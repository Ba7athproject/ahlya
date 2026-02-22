import urllib.parse
import os
from dotenv import load_dotenv

load_dotenv()

INTERNAL_OSINT_MODE = os.getenv("INTERNAL_OSINT_MODE", "False").lower() == "true"

def generate_links(company_name: str, wilaya: str):
    base_name = urllib.parse.quote(company_name)
    
    links = {
        "Google": f"https://www.google.com/search?q={base_name} {wilaya} site:tn",
        "Facebook": f"https://www.facebook.com/search/top?q={base_name}"
    }
    
    if INTERNAL_OSINT_MODE:
        links["RNE"] = f"https://www.registre-entreprises.tn/search?q={base_name}" # Placeholder
        links["JORT"] = f"http://www.iort.gov.tn/search?q={base_name}" # Placeholder
        
    return links

def get_company_links(company_id: int):
    from app.services.data_loader import get_companies_df
    df = get_companies_df()
    
    company = df[df['id'] == company_id]
    if company.empty:
        return {}
    
    row = company.iloc[0]
    return generate_links(row['name'], row['wilaya'])
