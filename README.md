# ✈️ Aviator Bankroll Manager

Application web de gestion de capital pour le jeu Aviator, avec persistance des données et déploiement automatique.

## 🚀 Fonctionnalités

### Gestion des objectifs
- Configuration du capital initial, objectif final et durée du plan
- Calcul automatique du taux de croissance journalier nécessaire
- Ajustement dynamique de l'objectif quotidien basé sur le capital actuel
- Suivi de la progression en temps réel

### Gestion du capital
- Saisie des gains et pertes quotidiennes
- Calcul automatique du capital actuel
- Indicateur d'avance ou de retard par rapport au plan théorique
- Système de stop-loss avec alertes visuelles

### Persistance des données
- Sauvegarde automatique dans IndexedDB
- Restauration des données à l'ouverture de la page
- Historique complet des transactions
- Option de réinitialisation du plan

### Visualisation
- Graphique d'évolution du capital sur Canvas
- Comparaison entre progression réelle et théorique
- Historique détaillé des transactions

## 🛠️ Technologies

- **100% Vanilla JavaScript** - Pas de frameworks
- **IndexedDB** - Persistance locale des données
- **Canvas API** - Graphiques personnalisés
- **GitHub Actions** - Déploiement automatique

## 📦 Installation locale

1. Clonez le repository
```bash
git clone https://github.com/ARMELW/aviator-bankroll.git
cd aviator-bankroll
```

2. Ouvrez `index.html` dans votre navigateur
   - Aucune installation de dépendances nécessaire
   - Fonctionne directement dans le navigateur

## 🌐 Déploiement

L'application est automatiquement déployée sur GitHub Pages à chaque push sur la branche `main`.

Le workflow GitHub Actions :
1. Vérifie le code
2. Configure GitHub Pages
3. Déploie l'application

## 📖 Utilisation

1. **Configuration initiale**
   - Entrez votre capital initial
   - Définissez votre objectif final
   - Indiquez la durée en jours
   - Configurez le seuil de stop-loss

2. **Suivi quotidien**
   - Saisissez vos gains ou pertes du jour
   - L'application calcule automatiquement votre nouveau capital
   - Suivez votre progression par rapport au plan

3. **Analyse**
   - Consultez le graphique d'évolution
   - Vérifiez votre historique
   - Identifiez si vous êtes en avance ou en retard

## 🔒 Sécurité des données

- Toutes les données sont stockées localement dans votre navigateur
- Aucune donnée n'est envoyée à un serveur externe
- Utilisez la fonction de réinitialisation pour effacer toutes les données

## 📝 Licence

MIT License - Libre d'utilisation et de modification
