"""
Ba7ath Investigation Endpoint
==============================
POST /api/v1/investigate/{company_id}

Cross-references Ahlya (CSV), JORT (DB), and RNE (DB) data via Gemini LLM.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enrichment_models import EnrichedCompany as EnrichedCompanyDB
from app.services.llm_service import llm_service
from app.services.data_loader import get_companies_df
from app.services.auth_service import get_current_user

import logging

logger = logging.getLogger("ba7ath.investigate")

router = APIRouter()


# ── Pydantic Response Models ─────────────────────────────────────────────

class LLMAnalysis(BaseModel):
    """The structured output from Gemini."""
    match_score: int = Field(0, ge=0, le=100, description="Score de correspondance (0-100)")
    status: str = Field("Pending", description="Verified | Suspicious | Conflict | Pending")
    findings: List[str] = Field(default_factory=list, description="النقاط المتطابقة")
    red_flags: List[str] = Field(default_factory=list, description="التجاوزات المرصودة")
    summary_ar: str = Field("", description="ملخص التحقيق بالعربية")


class InvestigationResult(BaseModel):
    """Full investigation response."""
    company_id: str
    company_name: str
    wilaya: str
    analysis: LLMAnalysis
    sources_used: List[str] = Field(default_factory=list)
    analyzed_at: str
    model_used: str = "gemini-1.5-flash"


# ── Helper: Extract Ahlya data from CSV ──────────────────────────────────

def _get_ahlya_data(company_id: str, company_name: str) -> Optional[dict]:
    """Find the company in the Ahlya DataFrame by ID or name."""
    df = get_companies_df()
    if df is None or df.empty:
        return None

    # Try matching by company_id first (if there's an ID column)
    if "company_id" in df.columns:
        match = df[df["company_id"] == company_id]
        if not match.empty:
            return match.iloc[0].to_dict()

    # Fallback to name matching
    name_col = "name" if "name" in df.columns else None
    if name_col is None:
        for col in df.columns:
            if "name" in col.lower() or "اسم" in col:
                name_col = col
                break

    if name_col:
        # Normalize for fuzzy matching
        normalized_target = company_name.strip().upper()
        match = df[df[name_col].astype(str).str.strip().str.upper() == normalized_target]
        if not match.empty:
            return match.iloc[0].to_dict()

    return None


# ── Main Endpoint ────────────────────────────────────────────────────────

@router.post(
    "/{company_id}",
    response_model=InvestigationResult,
    summary="تحليل المقارنة المتقاطعة عبر الذكاء الاصطناعي"
)
async def investigate_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Cross-reference a company's data from Ahlya (CSV), JORT (DB enrichment),
    and RNE (DB enrichment) using Gemini 1.5 Flash LLM analysis.

    Returns a structured investigation report in Arabic (MSA).
    """
    logger.info(f"📋 Investigation request for company_id: {company_id}")

    # ── 1. Retrieve enriched data from SQLite ────────────────────────────
    enriched = db.query(EnrichedCompanyDB).filter(
        EnrichedCompanyDB.company_id == company_id
    ).first()

    if not enriched:
        raise HTTPException(
            status_code=404,
            detail=f"الشركة '{company_id}' غير موجودة في قاعدة البيانات المُثرَاة"
        )

    company_name = enriched.company_name
    wilaya = enriched.wilaya
    enrichment_data = enriched.data or {}

    # Extract JORT and RNE from enrichment data
    jort_data = enrichment_data.get("jort", {})
    rne_data = enrichment_data.get("rne", {})

    # ── 2. Retrieve Ahlya data from CSV ──────────────────────────────────
    ahlya_data = _get_ahlya_data(company_id, company_name)

    # Track which sources were used
    sources_used = []
    if ahlya_data:
        sources_used.append("أهلية (CSV)")
    if jort_data and jort_data.get("announcements"):
        sources_used.append("الرائد الرسمي (JORT)")
    if rne_data and (rne_data.get("capital_social") or rne_data.get("tax_id")):
        sources_used.append("السجل الوطني (RNE)")

    if not sources_used:
        raise HTTPException(
            status_code=422,
            detail="لا توجد بيانات كافية لإجراء التحليل المتقاطع"
        )

    # ── 3. Build the payload for Gemini ───────────────────────────────────
    ahlya_payload = ahlya_data or {"company_name": company_name, "wilaya": wilaya}
    jort_payload = jort_data if jort_data.get("announcements") else {}
    rne_payload = rne_data if rne_data.get("capital_social") or rne_data.get("tax_id") else {}

    # Clean NaN/float values from ahlya DataFrame row
    if ahlya_payload:
        ahlya_payload = {
            k: (None if (isinstance(v, float) and (v != v)) else v)
            for k, v in ahlya_payload.items()
        }

    # ── 4. Call LLM Analysis ─────────────────────────────────────────────
    logger.info(
        f"🚀 Sending to Gemini: company='{company_name}', "
        f"sources={sources_used}"
    )

    raw_analysis = await llm_service.analyze_cross_check(
        ahlya_data=ahlya_payload,
        jort_data=jort_payload,
        rne_data=rne_payload,
    )

    # Parse into Pydantic model (validates schema)
    analysis = LLMAnalysis(
        match_score=raw_analysis.get("match_score", 0),
        status=raw_analysis.get("status", "Pending"),
        findings=raw_analysis.get("findings", []),
        red_flags=raw_analysis.get("red_flags", []),
        summary_ar=raw_analysis.get("summary_ar", ""),
    )

    # ── 5. Build response ────────────────────────────────────────────────
    return InvestigationResult(
        company_id=company_id,
        company_name=company_name,
        wilaya=wilaya,
        analysis=analysis,
        sources_used=sources_used,
        analyzed_at=datetime.utcnow().isoformat(),
        model_used="gemini-1.5-flash",
    )
