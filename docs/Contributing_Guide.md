# 🤝 Contributing Guide

Merci de contribuer à la plateforme **Ba7ath** ! Ce document définit les standards et le workflow pour maintenir la qualité du projet.

## 🌿 Workflow Git
1. **Branching**: Créez une branche descriptive pour chaque feature ou bugfix.
   - `feat/nom-de-la-feature`
   - `fix/nom-du-bug`
   - `docs/nom-de-la-doc`
2. **Pull Requests**:
   - Décrivez clairement les changements effectués.
   - Liez la PR à une issue si elle existe.
   - Assurez-vous que le build passe avant de demander une review.

## 📝 Standards de Code

### Backend (Python)
- Respectez la **PEP 8**.
- Utilisez des **type hints** pour toutes les fonctions FastAPI.
- Commentez les logiques OSINT complexes.

### Frontend (React)
- Utilisez des **Functional Components** avec hooks.
- **Tailwind CSS** : Évitez les styles inline ou le CSS personnalisé quand c'est possible.
- Nommez vos composants en `PascalCase`.

### Architecture
- Ne jamais coder en dur (hardcode) de secrets ou d'URLs de production.
- Utilisez toujours `src/services/api.js` pour les appels backend.

## 💬 Messages de Commit
Suivez la convention **Conventional Commits** :
- `feat: ajouter la comparaison par wilaya`
- `fix: corriger le hachage des mots de passe`
- `docs: mettre à jour l'architecture frontend`

---

## 🛡️ Sécurité
Si vous découvrez une faille de sécurité, ne créez pas d'issue publique. Contactez directement l'équipe à `ba77ath@proton.me`.
