from fastapi import APIRouter
from app.services.aggregation import get_national_stats, get_wilaya_stats
from app.models.schemas import NationalStats, WilayaStats

router = APIRouter()

@router.get("/national", response_model=NationalStats)
def read_national_stats():
    return get_national_stats()

@router.get("/wilayas/{name}", response_model=WilayaStats)
def read_wilaya_stats(name: str):
    return get_wilaya_stats(name)
