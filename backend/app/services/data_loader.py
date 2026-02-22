import pandas as pd
import json
import os
import unicodedata
import re
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR is .../backend/app
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

STATS_PATH = DATA_DIR / "stats.json"
COMPANIES_PATH = DATA_DIR / "companies.json"

# CSV Paths from Environment Variables
PATH_AHLYA_CSV = os.getenv("PATH_AHLYA_CSV", "Ahlya_Total_Feuil1.csv")
PATH_JORT_CSV = os.getenv("PATH_JORT_CSV", "app/scripts/Base-JORT.csv")
PATH_RNE_CSV = os.getenv("PATH_RNE_CSV", "trovit_charikat_ahliya_all.csv")

def normalize_company_name(name):
    """
    Standard logic for the join key:
    - Uppercase
    - Stripped
    - Without accents
    - Without double spaces
    """
    if not isinstance(name, str):
        return ""
    
    # Uppercase
    name = name.upper()
    
    # Normalize unicode to decompose accents
    name = unicodedata.normalize('NFKD', name)
    # Remove accents/diacritics
    name = "".join([c for c in name if not unicodedata.combining(c)])
    
    # Remove double spaces and strip
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name

class DataLoader:
    _instance = None
    companies_df = None
    stats_data = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataLoader, cls).__new__(cls)
        return cls._instance

    def load(self):
        print(f"Loading data from {DATA_DIR} and CSVs...")
        try:
            # 1. Load Stats
            if not STATS_PATH.exists():
                 print(f"Warning: Stats file not found at {STATS_PATH}")
                 self.stats_data = {}
            else:
                with open(STATS_PATH, 'r', encoding='utf-8') as f:
                    self.stats_data = json.load(f)
            
            # 2. Load Base Companies (Ahlya)
            ahlya_path = Path(PATH_AHLYA_CSV)
            if not ahlya_path.is_absolute():
                ahlya_path = BASE_DIR.parent / ahlya_path
            
            if ahlya_path.exists():
                print(f"Loading Ahlya CSV from {ahlya_path}")
                self.companies_df = pd.read_csv(ahlya_path)
                # Normalize columns
                self.companies_df.rename(columns={
                    "اسم_الشركة": "name",
                    "الولاية": "wilaya",
                    "المعتمدية": "delegation",
                    "المنطقة": "locality",
                    "النوع": "type",
                    "الموضوع / النشاط": "activity_raw",
                    "activité_normalisée": "activity_normalized",
                    "activité_groupe": "activity_group"
                }, inplace=True)
                # Ensure critical columns exist even if CSV is missing them
                if 'activity_normalized' not in self.companies_df.columns:
                    self.companies_df['activity_normalized'] = self.companies_df.get('activity_raw', pd.Series(dtype=str))
                if 'activity_group' not in self.companies_df.columns:
                    # Derive from activity_normalized if available
                    self.companies_df['activity_group'] = self.companies_df.get('activity_normalized', pd.Series(dtype=str))
                print(f"  -> Loaded {len(self.companies_df)} companies. Columns: {list(self.companies_df.columns)}")

            elif COMPANIES_PATH.exists():
                print(f"Loading Ahlya from companies.json as fallback")
                with open(COMPANIES_PATH, 'r', encoding='utf-8') as f:
                    companies = json.load(f)
                    self.companies_df = pd.DataFrame(companies)
                    self.companies_df.rename(columns={
                        "اسم_الشركة": "name",
                        "الولاية": "wilaya",
                        "المعتمدية": "delegation",
                        "المنطقة": "locality",
                        "النوع": "type",
                        "الموضوع / النشاط": "activity_raw",
                        "activité_normalisée": "activity_normalized",
                        "activité_groupe": "activity_group"
                    }, inplace=True)
                    if 'activity_normalized' not in self.companies_df.columns:
                        self.companies_df['activity_normalized'] = self.companies_df.get('activity_raw', pd.Series(dtype=str))
                    if 'activity_group' not in self.companies_df.columns:
                        self.companies_df['activity_group'] = self.companies_df.get('activity_normalized', pd.Series(dtype=str))

            else:
                print("Warning: No Ahlya data found!")
                self.companies_df = pd.DataFrame()

            if not self.companies_df.empty:
                # Normalize name for join
                self.companies_df['name_normalized'] = self.companies_df['name'].apply(normalize_company_name)
                self.companies_df['id'] = range(1, len(self.companies_df) + 1)
                
                # 3. Load JORT Data
                jort_path = Path(PATH_JORT_CSV)
                if not jort_path.is_absolute():
                    jort_path = BASE_DIR.parent / jort_path
                
                if jort_path.exists():
                    print(f"Integrating JORT from {jort_path}")
                    jort_df = pd.read_csv(jort_path)
                    if 'Dénomination' in jort_df.columns:
                        jort_df['name_normalized'] = jort_df['Dénomination'].apply(normalize_company_name)
                        # Prepare subset for merge
                        jort_subset = jort_df[['name_normalized', 'Référence JORT', 'Date Annonce', 'Capital (DT)', 'Texte Source Original']].copy()
                        jort_subset.rename(columns={
                            'Référence JORT': 'jort_ref',
                            'Date Annonce': 'jort_date',
                            'Capital (DT)': 'jort_capital',
                            'Texte Source Original': 'jort_text'
                        }, inplace=True)
                        # Merge
                        self.companies_df = pd.merge(self.companies_df, jort_subset, on='name_normalized', how='left')

                # 4. Load RNE Data
                rne_path = Path(PATH_RNE_CSV)
                if not rne_path.is_absolute():
                    rne_path = BASE_DIR.parent / rne_path
                
                if rne_path.exists():
                    print(f"Integrating RNE from {rne_path}")
                    rne_df = pd.read_csv(rne_path)
                    if 'name' in rne_df.columns:
                        rne_df['name_normalized'] = rne_df['name'].apply(normalize_company_name)
                        # Prepare subset
                        rne_subset = rne_df[['name_normalized', 'charika_id', 'tax_id', 'rc_number', 'founding_date_iso', 'legal_form', 'address', 'detail_url', 'capital']].copy()
                        rne_subset.rename(columns={
                            'charika_id': 'rne_id',
                            'tax_id': 'rne_tax_id',
                            'rc_number': 'rne_rc_number',
                            'founding_date_iso': 'rne_founding_date',
                            'legal_form': 'rne_legal_form',
                            'address': 'rne_address',
                            'detail_url': 'rne_detail_url',
                            'capital': 'rne_capital'
                        }, inplace=True)
                        # Merge
                        self.companies_df = pd.merge(self.companies_df, rne_subset, on='name_normalized', how='left')

                # 5. Capital Divergence Check
                threshold = float(os.getenv("CAPITAL_DIVERGENCE_THRESHOLD", 0.05))
                self.companies_df['capital_divergence'] = False
                
                # Ensure columns exist before processing
                if 'jort_capital' in self.companies_df.columns and 'rne_capital' in self.companies_df.columns:
                    # Ensure capitals are numeric
                    self.companies_df['jort_capital'] = pd.to_numeric(self.companies_df['jort_capital'], errors='coerce')
                    self.companies_df['rne_capital'] = pd.to_numeric(self.companies_df['rne_capital'], errors='coerce')
                    
                    mask = (self.companies_df['jort_capital'].notna()) & (self.companies_df['rne_capital'].notna()) & (self.companies_df['jort_capital'] > 0)
                    diff = abs(self.companies_df.loc[mask, 'jort_capital'] - self.companies_df.loc[mask, 'rne_capital']) / self.companies_df.loc[mask, 'jort_capital']
                    self.companies_df.loc[mask, 'capital_divergence'] = diff > threshold
                else:
                    # Create empty columns if they dont exist to stay compliant with schema
                    if 'jort_capital' not in self.companies_df.columns: self.companies_df['jort_capital'] = pd.NA
                    if 'rne_capital' not in self.companies_df.columns: self.companies_df['rne_capital'] = pd.NA
                    if 'jort_ref' not in self.companies_df.columns: self.companies_df['jort_ref'] = pd.NA
                    if 'jort_date' not in self.companies_df.columns: self.companies_df['jort_date'] = pd.NA
                    if 'jort_text' not in self.companies_df.columns: self.companies_df['jort_text'] = pd.NA
                    if 'rne_id' not in self.companies_df.columns: self.companies_df['rne_id'] = pd.NA
                    if 'rne_tax_id' not in self.companies_df.columns: self.companies_df['rne_tax_id'] = pd.NA
                    if 'rne_rc_number' not in self.companies_df.columns: self.companies_df['rne_rc_number'] = pd.NA
                    if 'rne_founding_date' not in self.companies_df.columns: self.companies_df['rne_founding_date'] = pd.NA
                    if 'rne_legal_form' not in self.companies_df.columns: self.companies_df['rne_legal_form'] = pd.NA
                    if 'rne_address' not in self.companies_df.columns: self.companies_df['rne_address'] = pd.NA
                    if 'rne_detail_url' not in self.companies_df.columns: self.companies_df['rne_detail_url'] = pd.NA

        except Exception as e:
            print(f"Error loading combined data: {e}")
            import traceback
            traceback.print_exc()
            self.companies_df = pd.DataFrame()
            self.stats_data = {}

data_loader = DataLoader()

def load_data():
    data_loader.load()

def get_companies_df():
    return data_loader.companies_df

def get_stats_data():
    return data_loader.stats_data
