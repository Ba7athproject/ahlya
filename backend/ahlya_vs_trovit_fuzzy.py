import re
from pathlib import Path

import pandas as pd
from rapidfuzz import process, fuzz

# -------- CONFIG --------

CSV_AHLYA = Path("Ahlya_Total_Feuil1.csv")
CSV_TROVIT = Path("trovit_charikat_ahliya_all.csv")

# Noms de colonnes
COL_NAME_AHLYA = "اسم_الشركة"
COL_NAME_TROVIT = "name"

# Seuils de décision
# score >= MATCH_THRESHOLD       => match strict
# MAYBE_THRESHOLD <= score < MATCH_THRESHOLD => à vérifier
MATCH_THRESHOLD = 95
MAYBE_THRESHOLD = 85

# Fichiers de sortie
OUT_ALL = Path("ahlya_vs_trovit_fuzzy_all.csv")
OUT_NON_MATCH = Path("ahlya_not_in_trovit_fuzzy.csv")
OUT_MATCHES_STRICT = Path("ahlya_matches_stricts.csv")
OUT_MAYBE = Path("ahlya_a_verifier.csv")

# Encodage CSV
ENCODING = "utf-8-sig"

# ------------------------


def normalize_name(s: str) -> str:
    """Normalisation agressive pour comparer des noms arabes proches."""
    if pd.isna(s):
        return ""
    s = str(s).strip()

    # Unifier quelques lettres arabes fréquentes
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    s = s.replace("ى", "ي").replace("ئ", "ي").replace("ؤ", "و")
    s = s.replace("ة", "ه")

    # Supprimer mots génériques
    generic = [
        "شركة", "الشركة",
        "الاهلية", "الأهلية", "الاهليه",
        "المحلية", "المحليه",
        "الجهوية", "الجهويه",
    ]
    for g in generic:
        s = s.replace(g, "")

    # Supprimer ponctuation simple et normaliser les espaces
    s = re.sub(r"[^\w\s]", " ", s)
    s = " ".join(s.split())
    return s


def main():
    if not CSV_AHLYA.exists():
        raise FileNotFoundError(CSV_AHLYA.resolve())
    if not CSV_TROVIT.exists():
        raise FileNotFoundError(CSV_TROVIT.resolve())

    # 1. Charger les deux fichiers
    df_ahlya = pd.read_csv(CSV_AHLYA, encoding=ENCODING)
    df_trovit = pd.read_csv(CSV_TROVIT, encoding=ENCODING)

    if COL_NAME_AHLYA not in df_ahlya.columns:
        raise KeyError(
            f"Colonne '{COL_NAME_AHLYA}' absente dans {CSV_AHLYA.name} : "
            f"{list(df_ahlya.columns)}"
        )
    if COL_NAME_TROVIT not in df_trovit.columns:
        raise KeyError(
            f"Colonne '{COL_NAME_TROVIT}' absente dans {CSV_TROVIT.name} : "
            f"{list(df_trovit.columns)}"
        )

    # 2. Créer des versions normalisées des noms
    df_ahlya["__name_norm__"] = df_ahlya[COL_NAME_AHLYA].apply(normalize_name)
    df_trovit["__name_norm__"] = df_trovit[COL_NAME_TROVIT].apply(normalize_name)

    # Liste des noms trovit pour RapidFuzz
    trovit_names = df_trovit["__name_norm__"].tolist()

    best_scores = []
    best_indexes = []

    # 3. Pour chaque société Ahlya, chercher le meilleur match dans Trovit
    for _, row in df_ahlya.iterrows():
        name_a = row["__name_norm__"]

        if not name_a:
            best_scores.append(0)
            best_indexes.append(None)
            continue

        match = process.extractOne(
            name_a,
            trovit_names,
            scorer=fuzz.token_sort_ratio,
        )

        if match is None:
            best_scores.append(0)
            best_indexes.append(None)
        else:
            _, score, idx = match
            best_scores.append(score)
            best_indexes.append(idx)

    df_ahlya["match_score"] = best_scores
    df_ahlya["trovit_index"] = best_indexes
    df_ahlya["has_candidate"] = df_ahlya["trovit_index"].notna()

    # 4. Ajouter quelques colonnes Trovit pour contexte (nom, wilaya, delegation, ids…)
    def extract_from_trovit(idx, col):
        if pd.isna(idx):
            return None
        idx = int(idx)
        if 0 <= idx < len(df_trovit):
            return df_trovit.iloc[idx].get(col)
        return None

    trovit_cols_to_add = [
        COL_NAME_TROVIT,
        "charika_id",
        "tax_id",
        "wilaya",
        "delegation",
        "capital",
        "legal_form",
        "detail_url",
    ]

    for col in trovit_cols_to_add:
        new_col = f"trovit_{col}"
        if col in df_trovit.columns:
            df_ahlya[new_col] = df_ahlya["trovit_index"].apply(
                lambda i: extract_from_trovit(i, col)
            )
        else:
            df_ahlya[new_col] = None

    # 5. Marquer les catégories
    df_ahlya["matched_strict"] = df_ahlya["match_score"] >= MATCH_THRESHOLD
    df_ahlya["matched_maybe"] = (
        (df_ahlya["match_score"] >= MAYBE_THRESHOLD)
        & (df_ahlya["match_score"] < MATCH_THRESHOLD)
    )

    # 6. Sauvegarder toutes les lignes avec info de match
    df_ahlya.to_csv(OUT_ALL, index=False, encoding=ENCODING)

    # 7. Fichiers dérivés
    df_matches = df_ahlya[df_ahlya["matched_strict"]].copy()
    df_maybe = df_ahlya[df_ahlya["matched_maybe"]].copy()
    df_non_match = df_ahlya[~(df_ahlya["matched_strict"] | df_ahlya["matched_maybe"])].copy()

    df_matches.to_csv(OUT_MATCHES_STRICT, index=False, encoding=ENCODING)
    df_maybe.to_csv(OUT_MAYBE, index=False, encoding=ENCODING)
    df_non_match.to_csv(OUT_NON_MATCH, index=False, encoding=ENCODING)

    print(f"[INFO] Lignes Ahlya : {len(df_ahlya)}")
    print(f"[INFO] Matchs stricts (score >= {MATCH_THRESHOLD}) : {len(df_matches)}")
    print(
        f"[INFO] À vérifier ({MAYBE_THRESHOLD} <= score < {MATCH_THRESHOLD}) : "
        f"{len(df_maybe)}"
    )
    print(f"[INFO] Non-concordances (score < {MAYBE_THRESHOLD}) : {len(df_non_match)}")
    print(f"[OK] Fichier complet : {OUT_ALL.resolve()}")
    print(f"[OK] Matchs stricts : {OUT_MATCHES_STRICT.resolve()}")
    print(f"[OK] À vérifier : {OUT_MAYBE.resolve()}")
    print(f"[OK] Non-concordances : {OUT_NON_MATCH.resolve()}")


if __name__ == "__main__":
    main()
