import pandas as pd
from pathlib import Path
from rapidfuzz import process, fuzz

# ------------- CONFIG À ADAPTER --------------

# CSV A : ta "liste politique / terrain"
CSV_A = Path("liste_270.csv")      # ex : Google Sheet complet

# CSV B : la liste des stés qui ont un RNE (ex. Trovit / base enrichie)
CSV_B = Path("liste_rne_ou_trovit.csv")

# Nom des colonnes contenant les NOMS à comparer
# A peut être en arabe, B en français, ou l'inverse.
# Idéalement, tu rajoutes dans chaque CSV une colonne 'name_canon'
# (normalisée/ traduite avec Qwen) et tu mets ces noms ici.
COL_NAME_A = "name"        # ex : "Nom société (FR)" ou "الاسم"
COL_NAME_B = "name"        # ex : nom Trovit en arabe

# (Optionnel) colonnes de contexte à garder pour l'analyse
CTX_COLS_A = ["wilaya", "delegation"]   # adapte à ton fichier
CTX_COLS_B = ["wilaya", "delegation"]   # idem

# Seuils fuzzy
# score >= HIGH_MATCH  -> match sûr
# LOW_MATCH <= score < HIGH_MATCH -> match douteux (à vérifier à la main / par LLM)
# score < LOW_MATCH -> considéré comme "non trouvé"
HIGH_MATCH = 90
LOW_MATCH = 70

# Fichiers de sortie
OUT_MATCHES = Path("matches_surs.csv")
OUT_MAYBE   = Path("matches_douteux.csv")
OUT_MISSING = Path("non_trouves_par_nom.csv")

# Encodage (UTF‑8 avec BOM fonctionne bien pour arabe + Excel)
ENC_A = "utf-8-sig"
ENC_B = "utf-8-sig"

# ------------- FONCTIONS ---------------------


def normalize_name(s: str) -> str:
    """Nettoyage léger pour comparer les noms."""
    if pd.isna(s):
        return ""
    s = str(s).strip()

    # mettre en minuscules pour la partie latine
    s = s.lower()

    # enlever quelques termes génériques FR/AR
    generic_fr = [
        "societe", "société", "ste", "sa", "sarl",
        "société anonyme", "société à responsabilité limitée",
    ]
    generic_ar = [
        "شركة", "الشركة", "الاهلية", "الأهلية", "الجهوية",
        "المحلية", "شركة أهلية", "شركة الاهلية", "شركة الأهلية",
    ]
    for g in generic_fr + generic_ar:
        s = s.replace(g, "")

    # normaliser les espaces
    s = " ".join(s.split())
    return s


def load_csv(path: Path, name_col: str, ctx_cols: list, enc: str) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(path.resolve())
    df = pd.read_csv(path, encoding=enc)
    if name_col not in df.columns:
        raise KeyError(f"Colonne '{name_col}' absente dans {path.name}.\n"
                       f"Colonnes dispo : {list(df.columns)}")
    df["__name_raw__"] = df[name_col]
    df["__name_norm__"] = df[name_col].apply(normalize_name)

    # garder nom + colonnes utiles pour l'analyse
    keep_cols = ["__name_raw__", "__name_norm__"]
    for c in ctx_cols:
        if c in df.columns:
            keep_cols.append(c)
    return df[keep_cols].copy()


def main():
    # 1. Charger les deux CSV
    df_a = load_csv(CSV_A, COL_NAME_A, CTX_COLS_A, ENC_A)
    df_b = load_csv(CSV_B, COL_NAME_B, CTX_COLS_B, ENC_B)

    print(f"[INFO] Lignes fichier A : {len(df_a)}")
    print(f"[INFO] Lignes fichier B : {len(df_b)}")

    # 2. Préparer une série de noms B pour RapidFuzz
    names_b = df_b["__name_norm__"].tolist()

    best_matches = []
    for idx, row in df_a.iterrows():
        name_a_norm = row["__name_norm__"]

        if not name_a_norm:
            best_matches.append({"score": 0, "b_index": None})
            continue

        # RapidFuzz: extractOne(label, choices, scorer=...)
        match = process.extractOne(
            name_a_norm,
            names_b,
            scorer=fuzz.token_sort_ratio,
        )
        if match is None:
            best_matches.append({"score": 0, "b_index": None})
        else:
            label_b, score, b_idx = match
            best_matches.append({"score": score, "b_index": b_idx})

    # 3. Construire un DataFrame résultat
    res = df_a.copy()
    res["match_score"] = [m["score"] for m in best_matches]
    res["b_index"] = [m["b_index"] for m in best_matches]

    # joindre les infos du fichier B
    res["name_b_raw"] = res["b_index"].apply(
        lambda i: df_b.loc[i, "__name_raw__"] if pd.notna(i) else None
    )
    res["name_b_norm"] = res["b_index"].apply(
        lambda i: df_b.loc[i, "__name_norm__"] if pd.notna(i) else None
    )

    # Ajout du contexte B (wilaya, delegation, etc.)
    for c in CTX_COLS_B:
        if c in df_b.columns:
            col_b = f"{c}_b"
            res[col_b] = res["b_index"].apply(
                lambda i: df_b.loc[i, c] if pd.notna(i) else None
            )

    # 4. Séparer en 3 catégories
    matches_surs = res[res["match_score"] >= HIGH_MATCH].copy()
    matches_douteux = res[
        (res["match_score"] >= LOW_MATCH) & (res["match_score"] < HIGH_MATCH)
    ].copy()
    non_trouves = res[res["match_score"] < LOW_MATCH].copy()

    print(f"[INFO] Matchs sûrs       (score >= {HIGH_MATCH}) : {len(matches_surs)}")
    print(f"[INFO] Matchs douteux    ({LOW_MATCH} <= score < {HIGH_MATCH}) : {len(matches_douteux)}")
    print(f"[INFO] Non trouvés       (score < {LOW_MATCH}) : {len(non_trouves)}")

    # 5. Export CSV
    matches_surs.to_csv(OUT_MATCHES, index=False, encoding="utf-8-sig")
    matches_douteux.to_csv(OUT_MAYBE, index=False, encoding="utf-8-sig")
    non_trouves.to_csv(OUT_MISSING, index=False, encoding="utf-8-sig")

    print("[OK] Export :")
    print("   ", OUT_MATCHES.resolve())
    print("   ", OUT_MAYBE.resolve())
    print("   ", OUT_MISSING.resolve())


if __name__ == "__main__":
    main()
