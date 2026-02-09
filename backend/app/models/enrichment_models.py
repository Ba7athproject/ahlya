from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON
from datetime import datetime
from app.database import Base


class EnrichedCompany(Base):
    """SQLAlchemy model for enriched company profiles."""
    __tablename__ = "enriched_companies"

    company_id = Column(String, primary_key=True, index=True)
    company_name = Column(String, index=True, nullable=False)
    wilaya = Column(String, index=True, nullable=False)

    # Full raw enrichment data (rne, jort, marches, notes) as JSON
    data = Column(JSON, nullable=False)

    # Computed metrics (total_contracts, total_contracts_value, ratio, red_flags) as JSON
    metrics = Column(JSON, nullable=False)

    enriched_by = Column(String, nullable=True, default="Journalist")
    enriched_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to investigation notes
    notes = relationship(
        "InvestigationNote",
        back_populates="company",
        cascade="all, delete-orphan"
    )


class WatchCompany(Base):  # Using Base from database.py (SQLAlchemy), NOT Pydantic
    __tablename__ = "watch_companies"

    id = Column(String, primary_key=True, index=True)
    name_ar = Column(String, index=True, nullable=False)
    wilaya = Column(String, index=True, nullable=True)
    delegation = Column(String, nullable=True)
    activity = Column(String, nullable=True)
    type = Column(String, nullable=True)  # jihawiya / mahaliya
    date_annonce = Column(String, nullable=True)  # YYYY-MM-DD or raw text
    
    # Status: 'watch', 'detected_trovit', 'detected_rne', 'archived'
    etat_enregistrement = Column(String, nullable=False, default="watch", index=True)
    
    # Auto-detection fields
    detected_trovit_at = Column(DateTime, nullable=True)
    detected_trovit_charika_id = Column(String, nullable=True)
    detected_trovit_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class InvestigationNote(Base):
    """SQLAlchemy model for investigation notes attached to a company dossier."""
    __tablename__ = "investigation_notes"

    id = Column(String, primary_key=True, index=True)  # UUID as string
    company_id = Column(
        String,
        ForeignKey("enriched_companies.company_id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String, nullable=True, default="Unknown")

    # Tags stored as JSON list of strings
    tags = Column(JSON, nullable=True)

    # Back-reference to company
    company = relationship("EnrichedCompany", back_populates="notes")
