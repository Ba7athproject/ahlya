import pandas as pd
import json
import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR is .../backend/app
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

STATS_PATH = DATA_DIR / "stats.json"
COMPANIES_PATH = DATA_DIR / "companies.json"

class DataLoader:
    _instance = None
    companies_df = None
    stats_data = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataLoader, cls).__new__(cls)
        return cls._instance

    def load(self):
        print(f"Loading data from {DATA_DIR}...")
        try:
            if not STATS_PATH.exists():
                 print(f"Warning: Stats file not found at {STATS_PATH}")
                 self.stats_data = {}
            else:
                with open(STATS_PATH, 'r', encoding='utf-8') as f:
                    self.stats_data = json.load(f)
            
            if not COMPANIES_PATH.exists():
                print(f"Warning: Companies file not found at {COMPANIES_PATH}")
                self.companies_df = pd.DataFrame()
            else:
                with open(COMPANIES_PATH, 'r', encoding='utf-8') as f:
                    companies = json.load(f)
                    self.companies_df = pd.DataFrame(companies)
                    # Normalize columns for easier access
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
                    self.companies_df['id'] = range(1, len(self.companies_df) + 1)
        except Exception as e:
            print(f"Error loading data: {e}")
            self.companies_df = pd.DataFrame()
            self.stats_data = {}

data_loader = DataLoader()

def load_data():
    data_loader.load()

def get_companies_df():
    return data_loader.companies_df

def get_stats_data():
    return data_loader.stats_data
