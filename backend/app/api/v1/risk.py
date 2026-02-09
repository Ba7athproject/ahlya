from fastapi import APIRouter
from typing import List
from app.services.risk_engine import get_risk_for_wilaya, get_all_risks
from app.models.schemas import WilayaRisk

router = APIRouter()

@router.get("/wilayas", response_model=List[WilayaRisk])
def list_risks():
    return get_all_risks()

@router.get("/wilayas/{name}", response_model=WilayaRisk)
def read_risk(name: str):
    return get_risk_for_wilaya(name)
