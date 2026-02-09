from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models.enrichment_models import (
    EnrichedCompany as EnrichedCompanyDB,
    InvestigationNote as InvestigationNoteDB
)

router = APIRouter()

# --- Pydantic Models (Request/Response shapes) ---

class Shareholder(BaseModel):
    name: str
    percentage: float
    role: str

class RneData(BaseModel):
    # Existing fields
    capital_social: float = 0.0
    legal_form: Optional[str] = None  # Made optional for CSV import compatibility
    registration_number: Optional[str] = ""
    registration_date: Optional[str] = ""
    address: Optional[str] = None
    shareholders: List[Shareholder] = []

    # Trovit CSV fields (1:1 mapping)
    charika_type: Optional[str] = None
    charika_id: Optional[str] = None
    name: Optional[str] = None
    delegation: Optional[str] = None
    zipcode_list: Optional[str] = None
    start_date_raw: Optional[str] = None
    capital: Optional[int] = None  # Distinct from capital_social (float), kept for CSV fidelity
    tax_id: Optional[str] = None
    rc_number: Optional[str] = None
    founding_date_iso: Optional[str] = None
    zipcode_detail: Optional[str] = None
    wilaya: Optional[str] = None
    founding_location: Optional[str] = None
    detail_url: Optional[str] = None

class JortAnnouncement(BaseModel):
    date: str
    type: str
    jort_number: Optional[str] = None
    content: str
    year: Optional[int] = None

class JortData(BaseModel):
    announcements: List[JortAnnouncement] = []

class Contract(BaseModel):
    date: str
    organisme: str
    type: str
    montant: float
    objet: str

class MarchesData(BaseModel):
    contracts: List[Contract] = []

class EnrichmentData(BaseModel):
    rne: RneData
    jort: JortData
    marches: MarchesData
    notes: Optional[str] = None

class RedFlag(BaseModel):
    type: str
    severity: str
    message_ar: str

class Metrics(BaseModel):
    total_contracts: int
    total_contracts_value: float
    capital_to_contracts_ratio: float
    red_flags: List[RedFlag] = []

class EnrichedCompanyRequest(BaseModel):
    company_id: str
    company_name: str
    wilaya: str
    data: EnrichmentData
    enriched_by: str = "Journalist"
    enriched_at: Optional[str] = None

class EnrichedCompanyResponse(BaseModel):
    company_id: str
    company_name: str
    wilaya: str
    data: dict
    metrics: dict
    enriched_by: str
    enriched_at: Optional[str]

# --- Investigation Notes Pydantic Models ---

class CreateNoteRequest(BaseModel):
    title: str
    content: str
    created_by: Optional[str] = "Unknown"
    tags: Optional[List[str]] = []

class UpdateNoteRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

# --- Business Logic ---

def calculate_red_flags(data: EnrichmentData) -> Metrics:
    """Calculate metrics and detect red flags from enrichment data."""
    total_contracts = len(data.marches.contracts)
    total_value = sum(c.montant for c in data.marches.contracts)
    capital = data.rne.capital_social if data.rne.capital_social > 0 else 1
    
    ratio = total_value / capital
    flags = []

    # Flag: High Ratio (> 10x)
    if ratio > 10:
        flags.append(RedFlag(
            type="FINANCIAL_RATIO",
            severity="HIGH",
            message_ar=f"قيمة الصفقات تتجاوز رأس المال بـ {ratio:.1f} مرة"
        ))
    
    # Flag: Gré à gré frequency
    gre_a_gre_count = sum(1 for c in data.marches.contracts if "تراضي" in c.type or "Direct" in c.type)
    if total_contracts > 0 and (gre_a_gre_count / total_contracts) > 0.5:
        flags.append(RedFlag(
            type="PROCUREMENT_METHOD",
            severity="HIGH",
            message_ar="أكثر من 50% من الصفقات بالتراضي"
        ))

    # Flag: Single Shareholder
    if len(data.rne.shareholders) == 1:
        flags.append(RedFlag(
            type="GOVERNANCE",
            severity="MEDIUM",
            message_ar="مساهم وحيد في الشركة"
        ))

    return Metrics(
        total_contracts=total_contracts,
        total_contracts_value=total_value,
        capital_to_contracts_ratio=ratio,
        red_flags=flags
    )


def db_company_to_dict(company: EnrichedCompanyDB) -> dict:
    """Convert SQLAlchemy model to dict matching the frontend-expected shape."""
    return {
        "company_id": company.company_id,
        "company_name": company.company_name,
        "wilaya": company.wilaya,
        "data": company.data,
        "metrics": company.metrics,
        "enriched_by": company.enriched_by,
        "enriched_at": company.enriched_at.isoformat() if company.enriched_at else None,
    }


def db_note_to_dict(note: InvestigationNoteDB) -> dict:
    """Convert SQLAlchemy note model to dict matching the frontend-expected shape."""
    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "created_at": note.created_at.isoformat() if note.created_at else None,
        "updated_at": note.updated_at.isoformat() if note.updated_at else None,
        "created_by": note.created_by,
        "tags": note.tags or []
    }


# --- Enrichment Endpoints ---

@router.post("/manual")
def save_manual_enrichment(payload: EnrichedCompanyRequest, db: Session = Depends(get_db)):
    """Save or update an enriched company profile."""
    # Calculate metrics & flags
    metrics = calculate_red_flags(payload.data)
    
    metrics_dict = {
        "total_contracts": metrics.total_contracts,
        "total_contracts_value": metrics.total_contracts_value,
        "capital_to_contracts_ratio": metrics.capital_to_contracts_ratio,
        "red_flags": [f.dict() for f in metrics.red_flags]
    }
    
    data_dict = payload.data.dict()
    enriched_at = datetime.fromisoformat(payload.enriched_at) if payload.enriched_at else datetime.utcnow()
    
    # Check if company exists (upsert)
    existing = db.query(EnrichedCompanyDB).filter(
        EnrichedCompanyDB.company_id == payload.company_id
    ).first()
    
    if existing:
        # Update existing record
        existing.company_name = payload.company_name
        existing.wilaya = payload.wilaya
        existing.data = data_dict
        existing.metrics = metrics_dict
        existing.enriched_by = payload.enriched_by
        existing.enriched_at = enriched_at
        db.commit()
        db.refresh(existing)
        company_obj = existing
    else:
        # Create new record
        company_obj = EnrichedCompanyDB(
            company_id=payload.company_id,
            company_name=payload.company_name,
            wilaya=payload.wilaya,
            data=data_dict,
            metrics=metrics_dict,
            enriched_by=payload.enriched_by,
            enriched_at=enriched_at,
        )
        db.add(company_obj)
        db.commit()
        db.refresh(company_obj)
    
    return db_company_to_dict(company_obj)


@router.get("/profile/{company_id}")
def get_enriched_profile(company_id: str, db: Session = Depends(get_db)):
    """Get a single enriched company profile by ID."""
    company = db.query(EnrichedCompanyDB).filter(
        EnrichedCompanyDB.company_id == company_id
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Profile not enriched yet")
    
    return db_company_to_dict(company)


@router.get("/status/{company_id}")
def check_enrichment_status(company_id: str, db: Session = Depends(get_db)):
    """Check if a company has been enriched."""
    company = db.query(EnrichedCompanyDB).filter(
        EnrichedCompanyDB.company_id == company_id
    ).first()
    
    return {
        "company_id": company_id,
        "is_enriched": company is not None
    }


@router.get("/all")
def get_all_enriched(db: Session = Depends(get_db)):
    """Get all enriched companies (without pagination)."""
    companies = db.query(EnrichedCompanyDB).order_by(
        EnrichedCompanyDB.enriched_at.desc()
    ).all()
    
    return [db_company_to_dict(c) for c in companies]


@router.get("/list")
def list_enriched_companies(
    page: int = 1,
    per_page: int = 12,
    search: Optional[str] = None,
    wilaya: Optional[str] = None,
    has_red_flags: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List all enriched companies with filters and pagination."""
    query = db.query(EnrichedCompanyDB)
    
    # Filter by search (company name)
    if search:
        query = query.filter(EnrichedCompanyDB.company_name.ilike(f"%{search}%"))
    
    # Filter by wilaya
    if wilaya:
        query = query.filter(EnrichedCompanyDB.wilaya == wilaya)
    
    # Get all matching companies for counting and red flag filtering
    # (SQLite JSON filtering is limited, so we filter in Python for has_red_flags)
    all_companies = query.order_by(EnrichedCompanyDB.enriched_at.desc()).all()
    
    # Convert to dicts and apply red flag filter if needed
    companies_dicts = [db_company_to_dict(c) for c in all_companies]
    
    if has_red_flags is not None:
        if has_red_flags:
            companies_dicts = [
                c for c in companies_dicts 
                if c.get('metrics', {}).get('red_flags')
            ]
        else:
            companies_dicts = [
                c for c in companies_dicts 
                if not c.get('metrics', {}).get('red_flags')
            ]
    
    # Pagination
    total = len(companies_dicts)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = companies_dicts[start:end]
    
    return {
        "companies": paginated,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 1
    }


# --- Investigation Notes Endpoints ---

@router.post("/{company_id}/notes")
def create_note(company_id: str, request: CreateNoteRequest, db: Session = Depends(get_db)):
    """Create a new investigation note for a company."""
    # Check if company exists
    company = db.query(EnrichedCompanyDB).filter(
        EnrichedCompanyDB.company_id == company_id
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    now = datetime.utcnow()
    note = InvestigationNoteDB(
        id=str(uuid.uuid4()),
        company_id=company_id,
        title=request.title,
        content=request.content,
        created_by=request.created_by or "Unknown",
        tags=request.tags or [],
        created_at=now,
        updated_at=now,
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    # Count total notes for this company
    total_notes = db.query(InvestigationNoteDB).filter(
        InvestigationNoteDB.company_id == company_id
    ).count()
    
    return {
        "status": "success",
        "note": db_note_to_dict(note),
        "total_notes": total_notes
    }


@router.get("/{company_id}/notes")
def get_notes(company_id: str, db: Session = Depends(get_db)):
    """Get all investigation notes for a company."""
    company = db.query(EnrichedCompanyDB).filter(
        EnrichedCompanyDB.company_id == company_id
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    notes = db.query(InvestigationNoteDB).filter(
        InvestigationNoteDB.company_id == company_id
    ).order_by(InvestigationNoteDB.created_at.desc()).all()
    
    return {
        "company_id": company_id,
        "company_name": company.company_name,
        "notes": [db_note_to_dict(n) for n in notes],
        "total": len(notes)
    }


@router.put("/{company_id}/notes/{note_id}")
def update_note(
    company_id: str, 
    note_id: str, 
    updates: UpdateNoteRequest, 
    db: Session = Depends(get_db)
):
    """Update an existing investigation note."""
    note = db.query(InvestigationNoteDB).filter(
        InvestigationNoteDB.company_id == company_id,
        InvestigationNoteDB.id == note_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if updates.title is not None:
        note.title = updates.title
    if updates.content is not None:
        note.content = updates.content
    if updates.tags is not None:
        note.tags = updates.tags
    
    note.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(note)
    
    return {
        "status": "success",
        "note": db_note_to_dict(note)
    }


@router.delete("/{company_id}/notes/{note_id}")
def delete_note(company_id: str, note_id: str, db: Session = Depends(get_db)):
    """Delete an investigation note."""
    note = db.query(InvestigationNoteDB).filter(
        InvestigationNoteDB.company_id == company_id,
        InvestigationNoteDB.id == note_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    
    # Count remaining notes
    remaining = db.query(InvestigationNoteDB).filter(
        InvestigationNoteDB.company_id == company_id
    ).count()

    return {
        "status": "success",
        "deleted_note_id": note_id,
        "total_notes": remaining
    }


# --- Watchlist Endpoints ---

class WatchCompanyOut(BaseModel):
    id: str
    name_ar: str
    wilaya: Optional[str]
    delegation: Optional[str]
    activity: Optional[str]
    type: Optional[str]
    date_annonce: Optional[str]
    etat_enregistrement: str
    detected_trovit_at: Optional[datetime]
    detected_trovit_charika_id: Optional[str]
    detected_trovit_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class WatchCompanyUpdate(BaseModel):
    etat_enregistrement: Optional[str] = None
    detected_trovit_charika_id: Optional[str] = None
    detected_trovit_url: Optional[str] = None


@router.get("/watch-companies", response_model=List[WatchCompanyOut])
def list_watch_companies(
    wilaya: Optional[str] = None,
    etat: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List companies in the watchlist with optional filters."""
    from app.models.enrichment_models import WatchCompany
    
    query = db.query(WatchCompany)
    
    if wilaya:
        query = query.filter(WatchCompany.wilaya == wilaya)
    
    if etat:
        query = query.filter(WatchCompany.etat_enregistrement == etat)
        
    if q:
        query = query.filter(WatchCompany.name_ar.ilike(f"%{q}%"))
        
    # Default sort: created_at desc
    return query.order_by(WatchCompany.created_at.desc()).all()


@router.patch("/watch-companies/{company_id}", response_model=WatchCompanyOut)
def update_watch_company(
    company_id: str,
    updates: WatchCompanyUpdate,
    db: Session = Depends(get_db)
):
    """Update status or details of a watched company."""
    from app.models.enrichment_models import WatchCompany
    
    company = db.query(WatchCompany).filter(WatchCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Watch company not found")
        
    if updates.etat_enregistrement is not None:
        company.etat_enregistrement = updates.etat_enregistrement
        if updates.etat_enregistrement == "detected_trovit" and not company.detected_trovit_at:
             company.detected_trovit_at = datetime.utcnow()
             
    if updates.detected_trovit_charika_id is not None:
        company.detected_trovit_charika_id = updates.detected_trovit_charika_id
        
    if updates.detected_trovit_url is not None:
        company.detected_trovit_url = updates.detected_trovit_url
        
    company.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(company)
    
    return company
