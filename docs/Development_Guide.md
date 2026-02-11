# 🛠️ Development Guide

Ce guide détaille comment mettre en place l'environnement de développement local pour contribuer au projet Ba7ath.

## 📋 Prérequis
- **Python 3.10+**
- **Node.js 18+**
- **Git**

---

## 🐍 Backend Setup (FastAPI)

1. **Cloner le repository** :
   ```bash
   git clone <repo_url>
   cd Ba7ath_scripts/Scrap_Ahlya/microsite
   ```

2. **Créer l'environnement virtuel** :
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Installer les dépendances** :
   ```bash
   pip install -r requirements.txt
   ```

4. **Variables d'environnement** :
   Créez un fichier `.env` dans `backend/` :
   ```env
   SECRET_KEY=votre_cle_secrete_ultra_securisee
   ALGORITHM=HS256
   ```

5. **Lancer le serveur** :
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## ⚛️ Frontend Setup (React)

1. **Installer les dépendances** :
   ```bash
   cd microsite
   npm install
   ```

2. **Variables d'environnement** :
   Créez un fichier `.env` dans `microsite/` :
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. **Lancer le serveur de dev** :
   ```bash
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:5173`.

---

## 🚀 Scripts Utilitaires

- **`backend/create_admin.py`** : Recrée l'utilisateur administrateur par défaut.
- **`start_all.bat`** (Windows) : Script pour lancer simultanément le backend et le frontend en développement.

## 🧪 Tests Rapides
Pour vérifier que l'API répond correctement après installation :
```bash
curl http://localhost:8000/
# Réponse attendue: {"message": "Ba7ath OSINT API is running"}
```
