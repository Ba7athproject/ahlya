from fastapi import APIRouter, Query
from typing import List, Optional
from app.services.data_loader import get_companies_df
from app.models.schemas import Company, CompanyWithLinks
from app.services.osint_links import get_company_links

router = APIRouter()

@router.get("/", response_model=List[Company])
def list_companies(
    wilaya: Optional[str] = None,
    group: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    df = get_companies_df()
    if df.empty:
        return []

    if wilaya:
        df = df[df['wilaya'] == wilaya]
    if group:
        df = df[df['activity_group'] == group]
    if type:
        df = df[df['type'] == type]
    if search:
        mask = df['name'].str.contains(search, na=False) | df['activity_normalized'].str.contains(search, na=False)
        df = df[mask]
        
    return df.head(limit).to_dict(orient='records')

@router.get("/{company_id}", response_model=CompanyWithLinks)
def read_company(company_id: int):
    df = get_companies_df()
    company = df[df['id'] == company_id]
    if company.empty:
        return {} # Should raise 404
        
    data = company.iloc[0].to_dict()
    data['osint_links'] = get_company_links(company_id)
    return data

@router.get("/{company_id}/osint_links")
def read_company_links(company_id: int):
    return get_company_links(company_id)
