"""
Ba7ath LLM Analysis Service
============================
Service d'analyse croisée des données Ahlya/JORT/RNE via Google Gemini 1.5 Flash.

Ce module gère :
1. La connexion sécurisée à l'API Google Generative AI.
2. La construction de prompts structurés pour l'analyse OSINT.
3. La validation déterministe des réponses au format JSON.
4. Une gestion d'erreurs granulaire pour la traçabilité journalistique.
"""

import os
import json
import logging
from datetime import datetime

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

# Configuration du logging spécifique au module Ba7ath
logger = logging.getLogger("ba7ath.llm")
logger.setLevel(logging.INFO)

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

# ── JSON Schema (embedded in prompt, NOT in GenerationConfig) ────────────
# NOTE: response_schema forces v1beta routing which causes 404 on Render.
# We embed the schema in the prompt instead and only use response_mime_type.

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
# ██  LLM ANALYSIS SERVICE
# ══════════════════════════════════════════════════════════════════════════

class LLMAnalysisService:
    """
    Service d'analyse utilisant Google Gemini 1.5 Flash pour le cross-referencing.
    Configuré pour le déterminisme total (Temp=0).
    """

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not set — LLM analysis will be unavailable")
            self.model = None
            return

        try:
            # Initialisation de l'API avec la clé d'environnement
            genai.configure(api_key=api_key)

            # Utilisation du nom de modèle racine pour éviter les erreurs de version v1beta sur Render
            model_id = "gemini-1.5-flash"

            self.model = genai.GenerativeModel(
                model_name=model_id,
                system_instruction=SYSTEM_PROMPT
            )
            
            # Configuration de génération — JSON via v1 stable (pas v1beta)
            # IMPORTANT: response_schema est volontairement ABSENT car il
            # force le routage vers v1beta, qui renvoie 404 sur Render.
            # Le schéma JSON est injecté directement dans le prompt.
            self.generation_config = genai.GenerationConfig(
                temperature=0.0,
                top_p=1,
                top_k=1,
                response_mime_type="application/json",
            )
            
            logger.info(f"✅ LLMAnalysisService initialized — model: {model_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini Model: {str(e)}")
            self.model = None

    @staticmethod
    def _build_prompt(ahlya_data: dict, jort_data: dict, rne_data: dict) -> str:
        """Construit un prompt structuré avec les trois sources de données."""
        
        def format_section(data): 
            return json.dumps(data, ensure_ascii=False, indent=2) if data else "لا توجد بيانات"

        return f"""قم بإجراء مقارنة شاملة ودقيقة بين المصادر الثلاثة التالية لهذه الشركة الأهلية التونسية.

═══════════════════════════════════════
المصدر الأول: بيانات أهلية (البيانات التصريحية)
═══════════════════════════════════════
{format_section(ahlya_data)}

═══════════════════════════════════════
المصدر الثاني: الرائد الرسمي (JORT)
═══════════════════════════════════════
{format_section(jort_data)}

═══════════════════════════════════════
المصدر الثالث: السجل الوطني للمؤسسات (RNE)
═══════════════════════════════════════
{format_section(rne_data)}

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
        """Exécute l'analyse croisée via Gemini avec gestion d'erreurs granulaire."""
        
        company_name = ahlya_data.get("name", "Unknown")

        if not self.model:
            logger.error(f"LLM analysis skipped for '{company_name}': no API key")
            return _fallback_response("no_api_key", "GEMINI_API_KEY غير مُعَيَّن")

        logger.info(f"🔍 Starting LLM cross-check for: {company_name}")
        start_time = datetime.now()
        prompt = self._build_prompt(ahlya_data, jort_data, rne_data)

        try:
            # Appel à l'API Gemini
            response = self.model.generate_content(
                prompt,
                generation_config=self.generation_config
            )
            
            # Parsing de la réponse JSON
            result = json.loads(response.text)

            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(f"✅ Analysis complete for '{company_name}' in {elapsed:.1f}s")
            return result

        except google_exceptions.ResourceExhausted as e:
            logger.warning(f"⚠️ Rate-limit Gemini (429) for '{company_name}': {e}")
            return _fallback_response("rate_limited", "الخدمة مشغولة حاليًا.")

        except google_exceptions.InvalidArgument as e:
            logger.error(f"❌ InvalidArgument for '{company_name}': {e}")
            return _fallback_response("invalid_argument", str(e))

        except json.JSONDecodeError as e:
            logger.error(f"❌ JSONDecodeError for '{company_name}': {e}")
            return _fallback_response("json_parse_error", "تعذّر تحليل استجابة النموذج.")

        except Exception as e:
            logger.error(f"❌ Unexpected error for '{company_name}': {e}")
            return _fallback_response("unexpected_error", str(e))

# Instance unique du service
llm_service = LLMAnalysisService()