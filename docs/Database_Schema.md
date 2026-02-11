# 🗄️ Database Schema

Le projet utilise **SQLite** pour sa simplicité de déploiement et ses performances suffisantes pour un outil d'investigation spécialisé.

**Fichier**: `backend/ba7ath_enriched.db`

## 📊 Diagramme E-R

```mermaid
erDiagram
    USER ||--o{ INVESTIGATION_NOTE : creates
    ENRICHED_COMPANY ||--o{ INVESTIGATION_NOTE : has
    WATCH_COMPANY ||--o{ ENRICHED_COMPANY : becomes

    USER {
        int id PK
        string email UK
        string hashed_password
        string full_name
        boolean is_active
        boolean is_admin
    }

    ENRICHED_COMPANY {
        string company_id PK
        string company_name
        string wilaya
        json data
        json metrics
        string enriched_by
        datetime enriched_at
    }

    INVESTIGATION_NOTE {
        string id PK
        string company_id FK
        string title
        text content
        datetime created_at
        string created_by
        json tags
    }

    WATCH_COMPANY {
        string id PK
        string name_ar
        string wilaya
        string etat_enregistrement
        datetime detected_trovit_at
    }
```

---

## 📑 Tables Détail

### 1. `users`
Stocke les identifiants et les niveaux de privilèges.
- `hashed_password`: Hachage sécurisé (Argon2).

### 2. `enriched_companies`
C'est le cœur de la plateforme. Les colonnes `data` et `metrics` sont de type JSON.
- **data**: Contient les données brutes extraites (RNE, JORT, Marchés).
- **metrics**: Contient les scores de risque et la liste des Red Flags détectés.

### 3. `investigation_notes`
Permet aux journalistes d'ajouter des preuves textuelles ou des commentaires sur une société spécifique.

### 4. `watch_companies`
Liste des sociétés identifiées comme "Ahlia" mais non encore trouvées dans les registres officiels (RNE).

---

## 📁 Migration et Initialisation
La base de données est automatiquement créée et les tables initialisées lors du démarrage du backend :
```python
# backend/app/main.py
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
```
