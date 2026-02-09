# enrich_not_in_trovit.py
import pandas as pd
from pathlib import Path

# Fichiers d'entrée
CSV_NOT_IN = Path("not_in_trovit_qwen.csv")
CSV_AHLYA  = Path("Ahlya_Total_Feuil1.csv")

# Fichier de sortie
CSV_OUT = Path("not_in_trovit_enriched.csv")

def main():
    if not CSV_NOT_IN.exists():
        raise FileNotFoundError(CSV_NOT_IN.resolve())
    if not CSV_AHLYA.exists():
        raise FileNotFoundError(CSV_AHLYA.resolve())

    # 1. Charger les fichiers
    df_not = pd.read_csv(CSV_NOT_IN, encoding="utf-8-sig")
    df_ah  = pd.read_csv(CSV_AHLYA, encoding="utf-8-sig")

    # 2. Vérifier les colonnes attendues
    if "name_ar" not in df_not.columns:
        raise KeyError(f"'name_ar' manquant dans {CSV_NOT_IN.name} ; colonnes = {list(df_not.columns)}")

    col_nom_ahlya = "اسم_الشركة"
    if col_nom_ahlya not in df_ah.columns:
        raise KeyError(f"'{col_nom_ahlya}' manquant dans {CSV_AHLYA.name} ; colonnes = {list(df_ah.columns)}")

    # 3. Normalisation légère des noms des deux côtés
    def norm(s):
        if pd.isna(s):
            return ""
        return str(s).strip()

    df_not["__key__"] = df_not["name_ar"].apply(norm)
    df_ah["__key__"]  = df_ah[col_nom_ahlya].apply(norm)

    # 4. Colonnes à ramener depuis Ahlya
    cols_details = [
        col_nom_ahlya,
        "الموضوع / النشاط",
        "العنوان",
        "الولاية",
        "المعتمدية",
        "المنطقة",
        "النوع",
    ]

    # On garde seulement les colonnes utiles + clé
    keep_ah = [c for c in cols_details if c in df_ah.columns] + ["__key__"]
    df_ah_small = df_ah[keep_ah].drop_duplicates("__key__")

    # 5. Merge left : toutes les lignes de not_in, détails pris dans Ahlya
    df_merged = df_not.merge(
        df_ah_small,
        on="__key__",
        how="left",
        suffixes=("", "_ahlya"),
    )

    # 6. Nettoyage : on peut retirer la clé technique si tu veux
    df_merged.drop(columns=["__key__"], inplace=True)

    # 7. Sauvegarde
    df_merged.to_csv(CSV_OUT, index=False, encoding="utf-8-sig")
    print(f"[OK] Fichier enrichi écrit dans : {CSV_OUT.resolve()}")
    print(f"Lignes : {len(df_merged)}")

if __name__ == "__main__":
    main()
