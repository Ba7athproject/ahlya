# 💻 Frontend Architecture

L'application est une **Single Page Application (SPA)** moderne construite avec **React 18** et **Vite**.

## 🏗️ Structure des Dossiers

```text
microsite/
├── public/          # Assets statiques
├── src/
│   ├── components/  # Composants réutilisables (Map, Widgets, Modals)
│   ├── context/     # AuthContext pour la gestion globale
│   ├── pages/       # Vues principales (Home, Admin, Enriched)
│   ├── services/    # Appels API et configuration
│   ├── App.jsx      # Router et layout global
│   └── index.css    # Tailwind et styles globaux
└── vite.config.js   # Configuration de build
```

## 🚦 Routing (`App.jsx`)
Le routage est géré par `react-router-dom`. Les routes sensibles sont protégées.

```jsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<HomeDashboard />} />
    <Route path="/enriched" element={<EnrichedCompaniesPage />} />
    <Route path="/admin" element={<AdminDashboard />} adminOnly={true} />
  </Route>
</Routes>
```

## 🔐 Gestion de l'État : `AuthContext`
Un contexte React global gère :
- L'utilisateur actuel (`user`).
- La persistance du token (`localStorage`).
- Les méthodes `login` / `logout`.

## 📦 Composants Clés

### Visualisation
- **`RegionPanel`**: Affiche les statistiques détaillées d'une wilaya sélectionnée sur la carte.
- **`SubScoresRadar`**: Graphique radar (Chart.js) montrant les différents axes de risque.
- **`StatisticalComparisonGrid`**: Grille de comparaison entre wilayas.

### Investigation
- **`InvestigationWizard`**: Formulaire pas-à-pas pour guider l'analyse.
- **`ManualEnrichmentWizard`**: Interface de saisie pour ajouter de nouvelles données d'enrichissement.

## 🎨 Design System
- **Tailwind CSS**: Utilisé pour tout le styling.
- **Inter / Noto Sans Arabic**: Polices utilisées pour une lisibilité maximale bilingue.
- **Glassmorphism**: Appliqué sur les modals et les overlays pour un aspect premium.

---

## 🔌 Intégration API
Tous les appels passent par `src/services/api.js` qui utilise un wrapper `authenticatedFetch` pour garantir que le token est envoyé si disponible.
