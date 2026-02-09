
import csv
import sys
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal, engine, Base
from app.models.enrichment_models import WatchCompany

# Ensure table exists (in case it wasn't created yet)
# Base.metadata.create_all(bind=engine) 
# Note: It's better if main.py does this, but for script autonomy we can double check.
# Ideally, we rely on the app to have created it.

CSV_FILE = os.path.join(backend_dir, 'ahlya_not_in_trovit_fuzzy.csv')

def normalize_text(s):
    if not s:
        return None
    return str(s).strip()

def run():
    print("=== Importing Watchlist from Ahlya CSV ===")
    
    if not os.path.exists(CSV_FILE):
        print(f"Error: File not found: {CSV_FILE}")
        return

    db = SessionLocal()
    try:
        # Create table if not exists (lazy init for script)
        from app.models.enrichment_models import WatchCompany
        WatchCompany.__table__.create(bind=engine, checkfirst=True)
        
        with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            count_new = 0
            count_skip = 0
            
            for row in reader:
                name_ar = normalize_text(row.get("name_ar") or row.get("اسم_الشركة"))
                wilaya = normalize_text(row.get("wilaya") or row.get("الولاية"))
                
                if not name_ar:
                    continue
                
                # Check uniqueness (Name + Wilaya)
                existing = db.query(WatchCompany).filter(
                    WatchCompany.name_ar == name_ar,
                    WatchCompany.wilaya == wilaya
                ).first()
                
                if existing:
                    count_skip += 1
                    continue
                
                # Create new entry
                watch_entry = WatchCompany(
                    id=str(uuid.uuid4()),
                    name_ar=name_ar,
                    wilaya=wilaya,
                    delegation=normalize_text(row.get("delegation") or row.get("المعتمدية")),
                    activity=normalize_text(row.get("activity") or row.get("الموضوع / النشاط")),
                    type=normalize_text(row.get("type") or row.get("النوع")),
                    date_annonce=normalize_text(row.get("date_annonce") or row.get("تاريخ الإعلان") or row.get("date")),
                    etat_enregistrement="watch",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                db.add(watch_entry)
                count_new += 1
            
            db.commit()
            print(f"Import finished.")
            print(f"New companies added to watchlist: {count_new}")
            print(f"Skipped (already exists): {count_skip}")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()
