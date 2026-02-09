import csv
import sys
import os
from datetime import datetime
from sqlalchemy.orm import Session

# Add backend directory to path to allow imports from app
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.database import SessionLocal, engine
from app.models.enrichment_models import EnrichedCompany

# CSV file path (assuming it's in the root of backend directory)
CSV_FILE = os.path.join(backend_dir, 'trovit_charikat_ahliya_all.csv')

def run():
    print(f"Starting Trovit CSV Import...")
    print(f"Reading CSV from: {CSV_FILE}")
    
    if not os.path.exists(CSV_FILE):
        print(f"Error: CSV file not found at {CSV_FILE}")
        return

    db: Session = SessionLocal()
    
    try:
        # Increase CSV field size limit just in case
        csv.field_size_limit(sys.maxsize)
        
        with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            # Verify required columns exist
            required_cols = ["charika_id", "name", "wilaya"]
            if not all(col in reader.fieldnames for col in required_cols):
                print(f"Error: Missing required columns in CSV. Found: {reader.fieldnames}")
                return
            
            count_new = 0
            count_updated = 0
            count_skipped = 0
            
            # Process rows
            for i, row in enumerate(reader):
                company_id = row.get("charika_id")
                if not company_id:
                    count_skipped += 1
                    continue

                # --- Prepare RNE Data ---
                # Parse capital safely
                capital_str = row.get("capital", "").strip()
                capital_int = None
                if capital_str and capital_str.isdigit():
                    capital_int = int(capital_str)
                
                # Construct RNE object matching updated Pydantic model
                rne_data = {
                    # Trovit fields
                    "charika_type": row.get("charika_type", "").strip() or None,
                    "charika_id": company_id,
                    "name": row.get("name", "").strip() or None,
                    "delegation": row.get("delegation", "").strip() or None,
                    "zipcode_list": row.get("zipcode_list", "").strip() or None,
                    "start_date_raw": row.get("start_date_raw", "").strip() or None,
                    "capital": capital_int,
                    "tax_id": row.get("tax_id", "").strip() or None,
                    "rc_number": row.get("rc_number", "").strip() or None,
                    "founding_date_iso": row.get("founding_date_iso", "").strip() or None,
                    "legal_form": row.get("legal_form", "").strip() or None,
                    "address": row.get("address", "").strip() or None,
                    "zipcode_detail": row.get("zipcode_detail", "").strip() or None,
                    "wilaya": row.get("wilaya", "").strip() or None,
                    "founding_location": row.get("founding_location", "").strip() or None,
                    "detail_url": row.get("detail_url", "").strip() or None,
                    
                    # Legacy/Standard fields mapping
                    "capital_social": float(capital_int) if capital_int else 0.0,
                    # Fallback for registration number: RC or Tax ID or empty
                    "registration_number": row.get("rc_number", "").strip() or row.get("tax_id", "").strip() or "",
                    "registration_date": row.get("founding_date_iso", "").strip() or "",
                    "shareholders": [], # Can't extract from this CSV
                }

                # --- Upsert Logic ---
                existing = db.query(EnrichedCompany).filter(EnrichedCompany.company_id == company_id).first()
                
                if existing:
                    # UPDATE
                    # User requested NOT to clear existing metrics
                    # Preserve JORT/Marches sections if they exist in current data
                    current_data = existing.data or {}
                    
                    # Update RNE section only
                    current_data["rne"] = rne_data
                    
                    # Ensure other sections exist if missing
                    if "jort" not in current_data:
                        current_data["jort"] = {"announcements": []}
                    if "marches" not in current_data:
                        current_data["marches"] = {"contracts": []}
                    if "notes" not in current_data:
                        current_data["notes"] = ""
                        
                    # Update DB fields
                    existing.data = current_data # Signal change for SQL handling
                    existing.company_name = row.get("name", existing.company_name) or existing.company_name
                    existing.wilaya = row.get("wilaya", existing.wilaya) or existing.wilaya
                    
                    # Update enriched_by tagging
                    if existing.enriched_by and "trovit_csv" not in existing.enriched_by:
                        existing.enriched_by += ", trovit_csv"
                    elif not existing.enriched_by:
                        existing.enriched_by = "trovit_csv"
                        
                    existing.enriched_at = datetime.utcnow()
                    
                    # We do NOT touch 'metrics' or 'notes' relationship
                    
                    count_updated += 1
                    
                else:
                    # CREATE
                    data_json = {
                        "rne": rne_data,
                        "jort": {"announcements": []},
                        "marches": {"contracts": []},
                        "notes": "",
                    }
                    
                    # Default metrics
                    metrics = {
                        "total_contracts": 0,
                        "total_contracts_value": 0,
                        "capital_to_contracts_ratio": 0,
                        "red_flags": [],
                    }
                    
                    new_company = EnrichedCompany(
                        company_id=company_id,
                        company_name=row.get("name", "Unknown"),
                        wilaya=row.get("wilaya", "Unknown"),
                        data=data_json,
                        metrics=metrics,
                        enriched_by="trovit_csv",
                        enriched_at=datetime.utcnow()
                    )
                    
                    db.add(new_company)
                    count_new += 1

                # Batch commit every 100 rows
                if i > 0 and i % 100 == 0:
                    db.commit()
                    print(f"Processed {i} rows...")

            # --- Watchlist Auto-Detection ---
            # After upserting, check if this company was in our watchlist
            # We normalize the name and wilaya for comparison
            
            # Helper for normalization
            def normalize_for_match(s):
                if not s: return ""
                return s.strip()

            trovit_name = normalize_for_match(row.get("name"))
            trovit_wilaya = normalize_for_match(row.get("wilaya"))
            
            if trovit_name:
                from app.models.enrichment_models import WatchCompany
                
                # Try to find a matching watchlist entry
                # We look for: Same Name AND Same Wilaya AND Status='watch'
                # Note: This is an exact string match after strip.
                # ideally we use the same fuzzy logic, but for now exact match on cleaned strings is a good start.
                
                watched_entry = db.query(WatchCompany).filter(
                    WatchCompany.name_ar == trovit_name,
                    WatchCompany.wilaya == trovit_wilaya,
                    WatchCompany.etat_enregistrement == "watch"
                ).first()
                
                if watched_entry:
                    print(f"[Watchlist] Detected company: {trovit_name} ({trovit_wilaya})")
                    watched_entry.etat_enregistrement = "detected_trovit"
                    watched_entry.detected_trovit_at = datetime.utcnow()
                    watched_entry.detected_trovit_charika_id = company_id
                    watched_entry.detected_trovit_url = row.get("detail_url")
                    # We commit immediately for this detection to be safe
                    db.commit()


            # Final commit
            db.commit()
            print(f"Import complete!")
            print(f"Created: {count_new}")
            print(f"Updated: {count_updated}")
            print(f"Skipped: {count_skipped}")
            
    except Exception as e:
        print(f"Critical Error during import: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()
