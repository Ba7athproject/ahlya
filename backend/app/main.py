from dotenv import load_dotenv
import os

# Load environment variables as the very first step
load_dotenv()

from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from app.api.v1 import stats, companies, risk, meta
from app.services.data_loader import load_data
from app.database import engine, Base
from app.models import enrichment_models, user_models
from app.api.v1 import auth
from app.services.auth_service import get_current_user

app = FastAPI(title="Ba7ath OSINT API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────
# Starlette CORSMiddleware with allow_origins=["*"]
# NOTE: When allow_origins=["*"], allow_credentials MUST be False.
# The frontend sends the token in the Authorization header, NOT via cookies,
# so allow_credentials=False is perfectly fine.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup ───────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("  Ba7ath OSINT API - VERSION CORS V4 (allow_origins=[*])")
    print("=" * 60)
    load_data()
    Base.metadata.create_all(bind=engine)


# ── Routers ───────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])

app.include_router(
    stats.router,
    prefix="/api/v1/stats",
    tags=["Stats"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    companies.router,
    prefix="/api/v1/companies",
    tags=["Companies"],
    dependencies=[Depends(get_current_user)],
)

from app.api import enrichment

app.include_router(
    risk.router,
    prefix="/api/v1/risk",
    tags=["Risk"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    meta.router,
    prefix="/api/v1/meta",
    tags=["Meta"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    enrichment.router,
    prefix="/api/v1/enrichment",
    tags=["Enrichment"],
    dependencies=[Depends(get_current_user)],
)


@app.get("/")
def read_root():
    return {"message": "Ba7ath OSINT API is running - VERSION CORS V4"}

