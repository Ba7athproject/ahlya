# 📖 API Reference

Tous les endpoints sont préfixés par `/api/v1`.  
**Base URL Production**: `https://ahlya-production.up.railway.app/api/v1`

## 🔐 Authentification
La plupart des routes nécessitent un token JWT valide.

| Header | Valeur |
| :--- | :--- |
| `Authorization` | `Bearer <access_token>` |

---

## 🔑 Auth Endpoints

### Login
`POST /auth/login`

Authentification via formulaire standard OAuth2.

- **Request Body** (`application/x-www-form-urlencoded`):
  - `username`: Email de l'utilisateur.
  - `password`: Mot de passe.
- **Success (200)**:
  ```json
  {
    "access_token": "eyJhbG...",
    "token_type": "bearer"
  }
  ```

---

## 📊 Statistiques & Risques

### Statistiques Nationales
`GET /stats/national` (PROTÉGÉ)

Retourne les métriques agrégées pour l'ensemble du pays.

- **Exemple de réponse**:
  ```json
  {
    "total_companies": 31000,
    "top_wilayas": ["Tunis", "Sousse", "Sfax"],
    "risk_index": 4.2
  }
  ```

### Risques par Wilaya
`GET /risk/wilayas` (PROTÉGÉ)

Liste les scores de risque pour toutes les wilayas.

---

## 📂 Enrichment (Core Data)

### Liste des sociétés enrichies
`GET /enrichment/list` (PROTÉGÉ)

- **Paramètres**:
  - `page` (int): Par défaut 1.
  - `per_page` (int): Par défaut 12.
  - `search` (str): Recherche par nom.
  - `wilaya` (str): Filtre par wilaya.
  - `has_red_flags` (bool): Filtre les cas critiques.

- **Response**:
  ```json
  {
    "companies": [...],
    "total": 150,
    "total_pages": 13
  }
  ```

### Profil complet
`GET /enrichment/profile/{company_id}` (PROTÉGÉ)

Retourne l'intégralité des données (RNE, JORT, Marchés) et les Red Flags calculés.

---

## 🛠️ User Management (Admin Only)

### Liste des utilisateurs
`GET /auth/users` (PROTECTED ADMIN)

Retourne la liste des utilisateurs du système.

### Création d'utilisateur
`POST /auth/users` (PROTECTED ADMIN)
- **Body**: `{ "email": "...", "password": "...", "is_admin": true }`

---

## 📝 Exemple Curl
```bash
curl -X GET "https://ahlya-production.up.railway.app/api/v1/enrichment/list" \
     -H "Authorization: Bearer <votre_token>"
```
