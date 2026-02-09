# inspect_db.py
import sqlite3
from pathlib import Path

# Essaie d'abord avec ce nom, puis adapte (microsite.db, database.sqlite, instance/app.db, etc.)
DB_PATH = Path("ba7ath_enriched.db")

def main():
    print("=== Inspection de la base SQLite ===")
    print("Chemin supposé :", DB_PATH.resolve())

    if not DB_PATH.exists():
        print("[ERREUR] Fichier introuvable :", DB_PATH.resolve())
        return

    print("Taille fichier (octets) :", DB_PATH.stat().st_size)

    conn = sqlite3.connect(DB_PATH)

    print("\n=== Bases attachées ===")
    for row in conn.execute("PRAGMA database_list;"):
        # schema, name, file
        print(row)

    print("\n=== Tables SQLite ===")
    tables = [
        r[0]
        for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    ]
    if not tables:
        print("(aucune table utilisateur)")
    for name in tables:
        print("-", name)

    print("\n=== Structure des tables ===")
    for name in tables:
        print(f"\nTable: {name}")
        for col in conn.execute(f"PRAGMA table_info({name})"):
            print(" ", col)

    conn.close()

if __name__ == "__main__":
    main()
