"""
Ba7ath LLM Analysis Service
============================
Service d'analyse croisée des données Ahlya/JORT/RNE via Google Gemini.

Ce module utilise l'API REST Gemini DIRECTEMENT via httpx (pas le SDK
google-generativeai) pour forcer l'utilisation de l'endpoint v1 stable
et éviter le routage automatique vers v1beta qui provoque des erreurs
404 sur Render et autres plateformes cloud.
"""

import os
import json
import logging
from datetime import datetime

import httpx

# Configuration du logging spécifique au module Ba7ath
logger = logging.getLogger("ba7ath.llm")
logger.setLevel(logging.INFO)

# ── Constants ─────────────────────────────────────────────────────────────

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_ENDPOINT = f"{GEMINI_API_BASE}/models/{GEMINI_MODEL}:generateContent"

# ── System Prompt (Expert Investigation) ──────────────────────────────────

SYSTEM_PROMPT = """أنت خبير تدقيق محقق في مشروع 'بحث' (Ba7ath). مهمتك هي مقارنة البيانات بدقة متناهية.

السياق القانوني:
- "شركة أهلية" (Entreprise Citoyenne) هي كيان قانوني أُنشئ بموجب القانون عدد 20 لسنة 2022.
- "الرائد الرسمي للجمهورية التونسية" (JORT) هو المنشور الرسمي الذي يتم فيه الإعلان عن تأسيس الشركات.
- "السجل الوطني للمؤسسات" (RNE) هو قاعدة البيانات الإدارية الرسمية.
- "المعرّف الجبائي" (Matricule Fiscal) هو رقم التعريف الضريبي.
- "الولاية" (Gouvernorat) هي الوحدة الإدارية في تونس (24 ولاية).

قواعد صارمة:
1. لا تستنتج معلومات غير موجودة في البيانات المقدمة.
2. إذا وجد اختلاف بين المصادر، صنفه كـ 'تضارب' (Conflict).
3. اللغة المستخدمة في الإجابة هي العربية الرصينة (MSA).
4. يجب أن يكون ملخص التحقيق (summary_ar) مهنيًا، مباشرًا، ومبنيًا فقط على الأدلة المقدمة.
5. لا تضف نصوصًا تفسيرية خارج هيكل JSON المطلوب."""

# ── Fallback response ────────────────────────────────────────────────────

def _fallback_response(error_type: str, detail: str = "") -> dict:
    """Génère une réponse JSON de secours en cas d'indisponibilité du LLM."""
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
# ██  LLM ANALYSIS SERVICE (Direct REST API — no SDK)
# ══════════════════════════════════════════════════════════════════════════

class LLMAnalysisService:
    """
    Service d'analyse utilisant l'API REST Gemini directement.
    Contourne le SDK google-generativeai pour éviter le routage v1beta.
    Configuré pour le déterminisme total (Temp=0).
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("⚠️ GEMINI_API_KEY not set — LLM analysis will be unavailable")
        else:
            logger.info(f"✅ LLMAnalysisService initialized — model: {GEMINI_MODEL} (REST API direct)")

    @staticmethod
    def _build_prompt(ahlya_data: dict, jort_data: dict, rne_data: dict) -> str:
        """Construit un prompt structuré avec les trois sources de données."""

        def fmt(data):
            return json.dumps(data, ensure_ascii=False, indent=2) if data else "لا توجد بيانات"

        return f"""قم بإجراء مقارنة شاملة ودقيقة بين المصادر الثلاثة التالية لهذه الشركة الأهلية التونسية.

═══════════════════════════════════════
المصدر الأول: بيانات أهلية (البيانات التصريحية)
═══════════════════════════════════════
{fmt(ahlya_data)}

═══════════════════════════════════════
المصدر الثاني: الرائد الرسمي (JORT)
═══════════════════════════════════════
{fmt(jort_data)}

═══════════════════════════════════════
المصدر الثالث: السجل الوطني للمؤسسات (RNE)
═══════════════════════════════════════
{fmt(rne_data)}

═══════════════════════════════════════
التعليمات:
═══════════════════════════════════════
1. قارن الاسم التجاري، رأس المال، والولاية.
2. تحقق من تطابق التواريخ والمعرّف الجبائي.
3. حدد أي تضاربات (Conflicts) أو نقاط مشبوهة.
4. أجب بصيغة JSON فقط وفق المخطط التالي بالضبط:

{{
  "match_score": <عدد صحيح من 0 إلى 100>,
  "status": "Verified" أو "Suspicious" أو "Conflict",
  "findings": ["نقطة تطابق 1", "نقطة تطابق 2"],
  "red_flags": ["تجاوز 1", "تجاوز 2"],
  "summary_ar": "ملخص التحقيق هنا"
}}"""

    async def analyze_cross_check(self, ahlya_data: dict, jort_data: dict, rne_data: dict) -> dict:
        """Exécute l'analyse croisée via l'API REST Gemini (v1 stable)."""

        company_name = ahlya_data.get("name", "Unknown")

        if not self.api_key:
            logger.error(f"LLM analysis skipped for '{company_name}': no API key")
            return _fallback_response("no_api_key", "GEMINI_API_KEY غير مُعَيَّن")

        logger.info(f"🔍 Starting LLM cross-check for: {company_name}")
        start_time = datetime.now()
        prompt = self._build_prompt(ahlya_data, jort_data, rne_data)

        # ── Build the REST API request body ──────────────────────────────
        request_body = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "topP": 1,
                "topK": 1,
                "responseMimeType": "application/json"
            }
        }

        url = f"{GEMINI_ENDPOINT}?key={self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    json=request_body,
                    headers={"Content-Type": "application/json"}
                )

            # ── Handle HTTP errors ───────────────────────────────────────
            if response.status_code == 429:
                logger.warning(f"⚠️ Rate-limit Gemini (429) for '{company_name}'")
                return _fallback_response("rate_limited", "الخدمة مشغولة حاليًا.")

            if response.status_code != 200:
                error_detail = response.text[:300]
                logger.error(f"❌ Gemini API {response.status_code} for '{company_name}': {error_detail}")
                return _fallback_response(f"http_{response.status_code}", error_detail)

            # ── Parse the response ───────────────────────────────────────
            resp_json = response.json()
            candidates = resp_json.get("candidates", [])
            if not candidates:
                logger.error(f"❌ No candidates in Gemini response for '{company_name}'")
                return _fallback_response("no_candidates", "لم يتم الحصول على نتائج من النموذج.")

            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            result = json.loads(text)

            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(
                f"✅ Analysis complete for '{company_name}' — "
                f"score={result.get('match_score')}, status={result.get('status')}, "
                f"time={elapsed:.1f}s"
            )
            return result

        except json.JSONDecodeError as e:
            logger.error(f"❌ JSONDecodeError for '{company_name}': {e}")
            return _fallback_response("json_parse_error", "تعذّر تحليل استجابة النموذج.")

        except httpx.TimeoutException:
            logger.error(f"❌ Timeout for '{company_name}' (60s limit)")
            return _fallback_response("timeout", "انتهت مهلة الاتصال بالنموذج.")

        except Exception as e:
            logger.error(f"❌ Unexpected error for '{company_name}': {e}")
            return _fallback_response("unexpected_error", str(e))

# Instance unique du service
llm_service = LLMAnalysisService()