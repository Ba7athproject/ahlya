# 🚀 Deployment Guide

Le projet est conçu pour un déploiement Cloud moderne et automatisé.

## 📁 Backend : Railway

Le backend FastAPI est hébergé sur **Railway**.

### Configuration
1. **Repository**: Liez votre repository GitHub à Railway.
2. **Volumes** (CRITIQUE) :
   - SQLite nécessite un stockage persistant.
   - Créez un Volume Railway nommé `data` monté sur `/app/data`.
   - Modifiez votre `DATABASE_URL` pour pointer vers `/app/data/ba7ath_enriched.db`.
3. **Variables d'environnement** :
   - `SECRET_KEY`: Une chaîne aléatoire longue.
   - `ALGORITHM`: `HS256`.
   - `CORS_ORIGINS`: Liste des domaines autorisés (ex: `https://ahlya-investigations.vercel.app`).

---

## 🎨 Frontend : Vercel

Le frontend React est hébergé sur **Vercel**.

### Configuration
1. **Framework Preset**: Vite.
2. **Build Command**: `npm run build`.
3. **Output Directory**: `dist`. (Ou `build` selon votre config `vite.config.js`).
4. **Environment Variables**:
   - `VITE_API_URL`: `https://votre-app-backend.up.railway.app/api/v1`.

---

## 🔄 Pipeline CI/CD
Toute modification poussée sur la branche `main` déclenche automatiquement :
1. Un redeploy sur Railway (Backend).
2. Un redeploy sur Vercel (Frontend).

> [!WARNING]
> Assurez-vous de migrer les données CSV vers la base SQLite SQL avant le déploiement final pour ne pas avoir une base vide en production.
