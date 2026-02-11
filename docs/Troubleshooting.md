# 🔍 Troubleshooting Guide

Ce guide recense les erreurs courantes rencontrées lors du développement ou du déploiement de la plateforme Ba7ath.

## 1. Erreurs d'Authentification

### Symptôme : "401 Unauthorized" ou "403 Forbidden"
- **Cause 1**: Le token JWT a expiré.
- **Solution**: Se déconnecter et se reconnecter.
- **Cause 2**: Le frontend n'envoie pas le header `Authorization`.
- **Diagnostic**: Vérifiez dans l'onglet Network de votre navigateur si le header `Authorization: Bearer <token>` est présent.
- **Fix**: Assurez-vous que l'appel API utilise `authenticatedFetch`.

### Symptôme : Erreur de signature du token après redémarrage
- **Cause**: La `SECRET_KEY` n'est pas fixe et change à chaque redémarrage du serveur.
- **Fix**: Définir une `SECRET_KEY` statique dans les variables d'environnement.

---

## 2. Erreurs de Données (API 404)

### Symptôme : Les données enriched sont inaccessibles
- **Diagnostic**: L'URL appelée est incorrecte (ex: `/enrichment/list` au lieu de `/api/v1/enrichment/list`).
- **Fix**: Centraliser `API_BASE_URL` dans `config.js` et s'assurer qu'il inclut `/api/v1`.

### Symptôme : Les sociétés disparaissent au redéploiement Railway
- **Cause**: La base SQLite n'est pas sur un volume persistant.
- **Fix**: Monter un Volume Railway et pointer le chemin de la DB vers ce volume (`/data/ba7ath_enriched.db`).

---

## 3. Erreurs de Build (Frontend)

### Symptôme : `vite:html-inline-proxy` error
- **Cause**: Présence de blocs `<style>` inline dans `index.html` (bug spécifique à certains environnements Windows).
- **Fix**: Déplacer les styles vers `index.css` et configurer les polices dans `tailwind.config.js`.

---

## 🛠️ Diagnostics Utiles

**Logs Backend** :
```bash
# Sur Railway
railway logs
```

**Debugger React** :
Utilisez les **React DevTools** pour vérifier si `AuthContext` possède bien l'état `user` après le login.
