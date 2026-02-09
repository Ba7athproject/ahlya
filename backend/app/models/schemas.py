from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Company(BaseModel):
    id: Optional[int] = None # Generated ID
    name: str
    wilaya: str
    delegation: Optional[str] = None
    locality: Optional[str] = None
    type: str # محلية / جهوية
    activity_raw: Optional[str] = None
    activity_normalized: Optional[str] = None
    activity_group: Optional[str] = None

class CompanyWithLinks(Company):
    osint_links: Dict[str, str]

class WilayaStats(BaseModel):
    wilaya: str
    count: int
    pct_national: float
    rank: int
    types: Dict[str, int]
    top_groups: Dict[str, int]
    top_activities: Dict[str, int]

class NationalStats(BaseModel):
    total: int
    wilayas: Dict[str, int]
    types: Dict[str, int]
    top_activities: Dict[str, int]
    top_groups: Dict[str, int]

class Flag(BaseModel):
    code: str
    severity: str # "low", "medium", "high"
    label_ar: str

class WilayaRisk(BaseModel):
    wilaya: str
    baath_index: float
    s1: float # Dependency on resource sectors
    s2: float # Concentration in one group
    s3: float # Governance imbalance
    flags: List[Flag]
    
    # Editorial Enriched Fields
    level: str  # LOW | MEDIUM | HIGH
    level_ar: str
    color: str  # emerald | amber | red
    comment_ar: str
    recommendations: List[str]
