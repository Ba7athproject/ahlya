from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import stats, companies, risk, meta
from app.services.data_loader import load_data
from app.database import engine, Base
from app.models import enrichment_models  # Import models to register them with Base

app = FastAPI(title="Ba7ath OSINT API", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event
@app.on_event("startup")
async def startup_event():
    load_data()
    # Create SQLite tables if they don't exist
    Base.metadata.create_all(bind=engine)

# Routers
app.include_router(stats.router, prefix="/api/v1/stats", tags=["Stats"])
app.include_router(companies.router, prefix="/api/v1/companies", tags=["Companies"])
from app.api import enrichment

app.include_router(risk.router, prefix="/api/v1/risk", tags=["Risk"])
app.include_router(meta.router, prefix="/api/v1/meta", tags=["Meta"])
app.include_router(enrichment.router, prefix="/api/v1/enrichment", tags=["Enrichment"])

@app.get("/")
def read_root():
    return {"message": "Ba7ath OSINT API is running"}
