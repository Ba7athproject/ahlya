# compare_names_with_qwen.py
import csv
import json
import time
from pathlib import Path

import requests

# ---------------- CONFIG ----------------

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL_NAME = "qwen2.5:latest"   # comme dans ollama list

CSV_AR = Path("Ahlya_Total_Feuil1.csv")          # 1re colonne = nom AR
CSV_FR = Path("trovit_charikat_ahliya_all.csv")  # 3e colonne = nom FR

OUT_MATCHES = Path("matches_qwen.csv")
OUT_NOT_IN_TROVIT = Path("not_in_trovit_qwen.csv")

SLEEP_SECONDS = 0.05   # petite pause entre appels

# ----------------------------------------


def load_names_ar(path: Path):
    """Charge la 1re colonne (noms en arabe)."""
    if not path.exists():
        raise FileNotFoundError(path.resolve())
    rows = []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for line in reader:
            if not line:
                continue
            name_ar = (line[0] or "").strip()
            if not name_ar:
                continue
            rows.append({"name_ar": name_ar})
    print(f"[INFO] Noms AR chargés : {len(rows)}")
    return rows


def load_names_fr(path: Path):
    """Charge la 3e colonne (noms en français)."""
    if not path.exists():
        raise FileNotFoundError(path.resolve())
    names_fr = []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for line in reader:
            if len(line) < 3:
                continue
            name_fr = (line[2] or "").strip()
            if not name_fr:
                continue
            names_fr.append(name_fr)
    print(f"[INFO] Noms FR chargés (Trovit) : {len(names_fr)}")
    return names_fr


def build_fr_list_for_prompt(names_fr):
    """Construit une liste numérotée lisible pour le prompt."""
    lines = []
    for i, name in enumerate(names_fr, start=1):
        lines.append(f"{i}. {name}")
    return "\n".join(lines)


def ask_qwen_match(name_ar, fr_list_text):
    """Demande à Qwen si le nom AR correspond à un/plusieurs noms FR."""
    system_prompt = (
        "Tu es un assistant qui fait du rapprochement de noms de sociétés "
        "entre l'arabe et le français.\n"
        "Règles :\n"
        "- Tu dois dire si le nom arabe désigne la même société qu'un ou plusieurs "
        "noms français dans la liste.\n"
        "- Prends en compte le sens, pas la traduction littérale exacte.\n"
        "- Si tu n'es PAS sûr, considère qu'il n'y a PAS de correspondance.\n"
        "- Réponds STRICTEMENT en JSON valide, sans texte autour.\n"
        '  Format : {"match": true/false, "indexes": [liste_entiers], "reason": "texte court"}.\n'
        "- Les indexes commencent à 1 et correspondent à la numérotation de la liste française."
    )

    user_prompt = (
        "Nom de la société en arabe :\n"
        f"{name_ar}\n\n"
        "Liste des noms de sociétés en français :\n"
        f"{fr_list_text}\n\n"
        "Question :\n"
        "- Le nom arabe correspond-il à une ou plusieurs sociétés françaises dans cette liste ?\n"
        "- Si oui, donne les indexes exacts dans le champ \"indexes\".\n"
        "- Si non, renvoie match=false et indexes=[]."
    )

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
    }

    resp = requests.post(OLLAMA_URL, json=payload, timeout=300)
    resp.raise_for_status()
    data = resp.json()
    content = data.get("message", {}).get("content", "").strip()
    if not content and "response" in data:
        content = data["response"].strip()

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError(f"Réponse non JSON de Qwen : {content}")

    match = bool(result.get("match", False))
    indexes = result.get("indexes", []) or []
    if not isinstance(indexes, list):
        indexes = []
    reason = str(result.get("reason", "")).strip()

    return match, indexes, reason


def main():
    rows_ar = load_names_ar(CSV_AR)
    names_fr = load_names_fr(CSV_FR)
    fr_list_text = build_fr_list_for_prompt(names_fr)

    matches = []
    not_found = []

    for i, row in enumerate(rows_ar, start=1):
        name_ar = row["name_ar"]
        print(f"[{i}/{len(rows_ar)}] Qwen compare : {name_ar}")

        try:
            match, indexes, reason = ask_qwen_match(name_ar, fr_list_text)
        except Exception as e:
            print(f"  [ERREUR] {e}")
            match, indexes, reason = False, [], f"error: {e}"

        if match and indexes:
            matched_names = [names_fr[idx - 1] for idx in indexes if 1 <= idx <= len(names_fr)]
            matches.append({
                "name_ar": name_ar,
                "matched_indexes": ";".join(str(x) for x in indexes),
                "matched_names_fr": " | ".join(matched_names),
                "reason": reason,
            })
        else:
            not_found.append({
                "name_ar": name_ar,
                "reason": reason,
            })

        time.sleep(SLEEP_SECONDS)

    # Écriture des résultats
    with OUT_MATCHES.open("w", encoding="utf-8-sig", newline="") as f:
        fieldnames = ["name_ar", "matched_indexes", "matched_names_fr", "reason"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(matches)

    with OUT_NOT_IN_TROVIT.open("w", encoding="utf-8-sig", newline="") as f:
        fieldnames = ["name_ar", "reason"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(not_found)

    print(f"[OK] Matchs écrits dans : {OUT_MATCHES.resolve()}")
    print(f"[OK] Non présents (selon Qwen) : {OUT_NOT_IN_TROVIT.resolve()}")
    print(f"[INFO] Total matchs : {len(matches)}, non trouvés : {len(not_found)}")


if __name__ == "__main__":
    main()
