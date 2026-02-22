import requests
import json
import time
import pandas as pd
from datetime import datetime

# --- CONFIGURATION ---
BASE_URL = "https://ba7ath-api.onrender.com/api/v1" # Remplace par ton URL locale pour tester vite
TOKEN = "TON_JWT_TOKEN_ICI"
COMPANY_IDS = ["id_1", "id_2", "id_3"] # Liste d'IDs à tester
DELAY_BETWEEN_REQUESTS = 5  # Secondes (pour éviter l'erreur 429 de Gemini)

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def run_bulk_test():
    results = []
    print(f"🚀 Démarrage du test massif : {len(COMPANY_IDS)} entreprises à analyser.\n")

    for c_id in COMPANY_IDS:
        print(f"🔍 Analyse de l'ID : {c_id}...", end="", flush=True)
        
        try:
            start_time = time.time()
            response = requests.post(f"{BASE_URL}/investigate/{c_id}", headers=HEADERS)
            duration = round(time.time() - start_time, 2)

            if response.status_code == 200:
                data = response.json()
                analysis = data.get("analysis", {})
                
                results.append({
                    "ID": c_id,
                    "Status": analysis.get("status"),
                    "Score": analysis.get("match_score"),
                    "Summary": analysis.get("summary_ar"),
                    "Duration": f"{duration}s"
                })
                print(" ✅ OK")
            else:
                print(f" ❌ Erreur {response.status_code}")
                results.append({"ID": c_id, "Status": "ERROR", "Summary": response.text})

        except Exception as e:
            print(f" ❌ Crash : {str(e)}")

        # Respect du quota Gemini Flash (15 RPM)
        time.sleep(DELAY_BETWEEN_REQUESTS)

    # --- GÉNÉRATION DU RAPPORT ---
    df = pd.DataFrame(results)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    report_name = f"investigation_report_{timestamp}.csv"
    df.to_csv(report_name, index=False, encoding='utf-8-sig')
    
    print(f"\n✅ Rapport généré : {report_name}")
    print("\n--- RÉSUMÉ DES TROUVAILLES ---")
    print(df[['ID', 'Status', 'Score']].to_string(index=False))

if __name__ == "__main__":
    run_bulk_test()