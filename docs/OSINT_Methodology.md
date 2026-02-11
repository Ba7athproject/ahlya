# 🕵️ OSINT Methodology

La plateforme Ba7ath ne se contente pas d'afficher des données ; elle les transforme en **renseignements actionnables** grâce à une méthodologie d'enrichissement rigoureuse.

## 📡 Sources de Données

1. **RNE (Registre National des Entreprises)** : Source officielle pour le statut légal, le capital social, l'adresse et les actionnaires.
2. **JORT (Journal Officiel de la République Tunisienne)** : Extraction des annonces de création, de modification de capital et de liquidation.
3. **Marchés Publics (TUNEPS / Observatoire)** : Données sur les contrats remportés par les sociétés citoyennes.
4. **Scraping Web (Trovit / Web)** : Identification précoce des sociétés non encore officiellement enregistrées.

---

## 🚩 Calcul des Red Flags (Signaux d'Alerte)

Le système applique des algorithmes automatiques pour détecter des patterns suspects :

### 1. Ratio Financier Critiques
- **Logique**: Si `Valeur totale des contrats / Capital social > 10`.
- **Interprétation**: Une société avec un capital très faible remportant des marchés massifs peut indiquer une structure "écran" ou un manque de capacité réelle.
- **Badge**: `FINANCIAL_RATIO` (Severity: HIGH).

### 2. Méthodes de Passation
- **Logique**: Si `Marchés de gré à gré (Direct) > 50%` du total des contrats.
- **Interprétation**: Une dépendance excessive aux contrats non-concurrentiels est un indicateur de risque de favoritisme.
- **Badge**: `PROCUREMENT_METHOD` (Severity: HIGH).

### 3. Gouvernance
- **Logique**: Détection d'actionnaire unique ou de liens croisés entre sociétés Ahlia d'une même région.
- **Badge**: `GOVERNANCE` (Severity: MEDIUM).

---

## 🧪 Processus d'Enrichissement Manuel

Le **ManualEnrichmentWizard** permet aux journalistes d'ajouter une couche d'analyse humaine :
1. **Saisie des données RNE** : Validation des numéros de registre.
2. **Ajout de contrats** : Saisie manuelle si TUNEPS n'est pas à jour.
3. **Calcul Auto** : Le système recalcule instantanément les scores dès que les données sont enregistrées.

## 📈 Indice de Risque Régional
Le score d'une wilaya est la moyenne pondérée des scores de risque des sociétés Ahlia qui y sont basées. Cela permet de cartographier les "zones grises" au niveau national.
