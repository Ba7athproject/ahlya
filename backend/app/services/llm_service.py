"""
Ba7ath LLM Analysis Service
============================
Cross-reference analysis of Ahlya/JORT/RNE data using Google Gemini 1.5 Flash.

Outputs deterministic Arabic (MSA) investigation reports with English JSON keys
for frontend compatibility.
"""

import os
import json
import logging
from datetime import datetime

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

logger = logging.getLogger("ba7ath.llm")
logger.setLevel(logging.INFO)

# ── System Prompt ────────────────────────────────────────────────────────

SYSTEM_PROMPT = """أنت خبير تدقيق محقق في مشروع 'بحث' (Ba7ath). مهمتك هي مقارنة البيانات بدقة متناهية.

السياق القانوني:
- "شركة أهلية" (Entreprise Citoyenne) هي كيان قانوني أُنشئ بموجب القانون عدد 20 لسنة 2022.
- "الرائد الرسمي للجمهورية التونسية" (JORT) هو المنشور الرسمي الذي يتم فيه الإعلان عن تأسيس الشركات.
- "السجل الوطني للمؤسسات" (RNE) هو قاعدة البيانات الإدارية الرسمية.
- "المعرّف الجبائي" (Matricule Fiscal) هو رقم التعريف الضريبي.
- "الولاية" (Gouvernorat) هي الوحدة الإدارية في تونس (24 ولاية).

قواعد صارمة:
1. لا تستنتج معلومات غير موجودة في البيانات المقدمة.
2. إذا وجد اختلاف بين المصادر، صنفه كـ 'تضارب' (Discrepancy).
3. اللغة المستخدمة في الإجابة هي العربية الرصينة (MSA).
4. يجب أن يكون ملخص التحقيق (summary_ar) مهنيًا، مباشرًا، ومبنيًا فقط على الأدلة المقدمة.
5. لا تضف نصوصًا تفسيرية خارج هيكل JSON المطلوب."""

# ── JSON Output Schema ───────────────────────────────────────────────────

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "match_score": {
            "type": "integer",
            "description": "Score de correspondance entre les sources (0-100)"
        },
        "status": {
            "type": "string",
            "enum": ["Verified", "Suspicious", "Conflict"],
            "description": "Statut global de la vérification croisée"
        },
        "findings": {
            "type": "array",
            "items": {"type": "string"},
            "description": "قائمة النقاط المتطابقة بين المصادر"
        },
        "red_flags": {
            "type": "array",
            "items": {"type": "string"},
            "description": "قائمة التجاوزات أو الأخطاء المرصودة"
        },
        "summary_ar": {
            "type": "string",
            "description": "ملخص التحقيق باللغة العربية الرصينة"
        }
    },
    "required": ["match_score", "status", "findings", "red_flags", "summary_ar"]
}

# ── Fallback response ────────────────────────────────────────────────────

def _fallback_response(error_type: str, detail: str = "") -> dict:
    """Return a safe fallback JSON when Gemini is unavailable."""
    return {
        "match_score": 0,
        "status": "Pending",
        "findings": [],
        "red_flags": [],
        "summary_ar": f"تعذّر إجراء التحليل: {error_type}. {detail}".strip(),
        "_error": error_type,
        "_detail": detail,
    }


# ══════════════════════════════════════════════════════════════════════════
# ██  LLM ANALYSIS SERVICE
# ══════════════════════════════════════════════════════════════════════════

class LLMAnalysisService:
    """
    Cross-reference analysis service using Google Gemini 1.5 Flash.
    
    - Deterministic: temperature=0.0, top_p=1, top_k=1
    - Output: JSON with English keys, Arabic values (MSA)
    - Fallback on 429 / API errors
    """

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not set — LLM analysis will be unavailable")
            self.model = None
            return

        genai.configure(api_key=api_key)

        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(
                temperature=0.0,
                top_p=1,
                top_k=1,
                response_mime_type="application/json",
                response_schema=OUTPUT_SCHEMA,
            ),
        )
        logger.info("LLMAnalysisService initialized — model: gemini-1.5-flash (temp=0.0)")

    # ── Build the user prompt ────────────────────────────────────────────

    @staticmethod
    def _build_prompt(ahlya_data: dict, jort_data: dict, rne_data: dict) -> str:
        """Build a structured comparison prompt from the three data sources."""

        ahlya_section = json.dumps(ahlya_data, ensure_ascii=False, indent=2) if ahlya_data else "لا توجد بيانات"
        jort_section = json.dumps(jort_data, ensure_ascii=False, indent=2) if jort_data else "لا توجد بيانات"
        rne_section = json.dumps(rne_data, ensure_ascii=False, indent=2) if rne_data else "لا توجد بيانات"

        return f"""قم بإجراء مقارنة شاملة ودقيقة بين المصادر الثلاثة التالية لهذه الشركة الأهلية التونسية.

═══════════════════════════════════════
المصدر الأول: بيانات أهلية (البيانات التصريحية)
═══════════════════════════════════════
{ahlya_section}

═══════════════════════════════════════
المصدر الثاني: الرائد الرسمي (JORT)
═══════════════════════════════════════
{jort_section}

═══════════════════════════════════════
المصدر الثالث: السجل الوطني للمؤسسات (RNE)
═══════════════════════════════════════
{rne_section}

═══════════════════════════════════════
التعليمات:
═══════════════════════════════════════
1. قارن الاسم التجاري بين المصادر الثلاثة.
2. قارن رأس المال المُصرّح به في كل مصدر.
3. تحقق من تطابق الولاية والمعتمدية.
4. تحقق من تطابق التواريخ (تاريخ التأسيس، تاريخ التسجيل).
5. تحقق من وجود المعرّف الجبائي ورقم السجل التجاري.
6. حدد أي تضاربات أو نقاط مشبوهة.
7. أعط درجة تطابق (match_score) من 0 إلى 100.
8. حدد الحالة: Verified (تم التحقق) أو Suspicious (مشبوه) أو Conflict (تضارب).

أجب بصيغة JSON فقط."""

    # ── Main analysis method ─────────────────────────────────────────────

    async def analyze_cross_check(
        self,
        ahlya_data: dict,
        jort_data: dict,
        rne_data: dict,
    ) -> dict:
        """
        Send a cross-reference analysis request to Gemini.
        
        Returns:
            dict with match_score, status, findings, red_flags, summary_ar
        """
        company_name = ahlya_data.get("name", ahlya_data.get("company_name", "Unknown"))

        if not self.model:
            logger.error(f"LLM analysis skipped for '{company_name}': no API key configured")
            return _fallback_response("no_api_key", "GEMINI_API_KEY غير مُعَيَّن")

        logger.info(f"🔍 Starting LLM cross-check for: {company_name}")
        start_time = datetime.now()

        prompt = self._build_prompt(ahlya_data, jort_data, rne_data)

        try:
            response = self.model.generate_content(prompt)
            result = json.loads(response.text)

            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(
                f"✅ LLM analysis complete for '{company_name}' — "
                f"score={result.get('match_score')}, status={result.get('status')}, "
                f"time={elapsed:.1f}s"
            )
            return result

        except google_exceptions.ResourceExhausted as e:
            logger.warning(f"⚠️ Gemini rate-limited (429) for '{company_name}': {e}")
            return _fallback_response(
                "rate_limited",
                "الخدمة مشغولة حاليًا. يرجى المحاولة لاحقًا."
            )

        except google_exceptions.InvalidArgument as e:
            logger.error(f"❌ Gemini InvalidArgument for '{company_name}': {e}")
            return _fallback_response("invalid_argument", str(e))

        except json.JSONDecodeError as e:
            logger.error(f"❌ Gemini returned non-JSON for '{company_name}': {e}")
            return _fallback_response(
                "json_parse_error",
                "تعذّر تحليل استجابة النموذج."
            )

        except Exception as e:
            logger.error(f"❌ Unexpected error during LLM analysis for '{company_name}': {e}")
            return _fallback_response("unexpected_error", str(e))


# ── Singleton instance ───────────────────────────────────────────────────

llm_service = LLMAnalysisService()
