# compare_data.py
import sqlite3
import pandas as pd
from pathlib import Path

# ----------------- CONFIG -----------------

# Base SQLite des 141 sociétés enrichies
DB_PATH = Path("ba7ath_enriched.db")

# CSV complet des ~270 sociétés Trovit
CSV_PATH = Path("trovit_charikat_ahliya_all.csv")

# Table + colonne JSON dans SQLite
ENRICHED_TABLE = "enriched_companies"
DATA_COLUMN = "data"

# ----------------- CODE -----------------


def main():
    # 1. Charger les 270 sociétés depuis le CSV
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV introuvable : {CSV_PATH.resolve()}")

    df_270 = pd.read_csv(CSV_PATH)
    print(f"[INFO] Sociétés dans le CSV Trovit : {len(df_270)}")

    if "tax_id" not in df_270.columns:
        raise KeyError(
            "La colonne 'tax_id' est absente du CSV. "
            "Vérifie l'en-tête de trovit_charikat_ahliya_all.csv."
        )

    # 2. Ouvrir la base SQLite
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Base SQLite introuvable : {DB_PATH.resolve()}")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 3. Vérifier que la table existe bien
    cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (ENRICHED_TABLE,),
    )
    row = cur.fetchone()
    if row is None:
        tables = [
            r[0]
            for r in cur.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        ]
        conn.close()
        raise RuntimeError(
            f"La table '{ENRICHED_TABLE}' n'existe pas dans la base.\n"
            f"Tables disponibles : {tables}"
        )

    # 4. Extraire les tax_id déjà présents dans data.rne
    query = f"""
    SELECT DISTINCT
        json_extract({DATA_COLUMN}, '$.rne.tax_id') AS tax_id
    FROM {ENRICHED_TABLE}
    WHERE json_extract({DATA_COLUMN}, '$.rne.tax_id') IS NOT NULL
    """
    df_rne = pd.read_sql(query, conn)
    conn.close()

    print(f"[INFO] Sociétés avec tax_id dans la base : {len(df_rne)}")

    # 5. Comparer par tax_id (270 vs 141)
    merged = df_270.merge(df_rne, on="tax_id", how="left", indicator=True)

    # 6. Garder celles absentes de la base
    missing = merged[merged["_merge"] == "left_only"].drop(columns=["_merge"])
    print(
        "[INFO] Sociétés présentes dans le CSV mais absentes de la base :",
        len(missing),
    )

    # 7. Sauvegarder le résultat
    out_path = Path("trovit_missing_not_in_rne.csv")
    missing.to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"[OK] Fichier généré : {out_path.resolve()}")


if __name__ == "__main__":
    main()
