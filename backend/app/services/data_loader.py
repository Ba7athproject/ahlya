import pandas as pd
import json
import os

STATS_PATH = "c:/Ba7ath_scripts/Scrap_Ahlya/microsite/public/data/stats.json"
COMPANIES_PATH = "c:/Ba7ath_scripts/Scrap_Ahlya/microsite/public/data/companies.json"

class DataLoader:
    _instance = None
    companies_df = None
    stats_data = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataLoader, cls).__new__(cls)
        return cls._instance

    def load(self):
        print("Loading data...")
        try:
            with open(STATS_PATH, 'r', encoding='utf-8') as f:
                self.stats_data = json.load(f)
            
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
