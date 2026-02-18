# StockAtelier — Site Map & Documentation

## Vision

Application de gestion de stock en temps réel pour un atelier de soudure. Interface premium, intuitive, adaptée au contexte industriel ouest-africain.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Connexion | Split-screen: branding navy + formulaire login |
| `/` | Dashboard | Vue d'ensemble: KPIs, mouvements récents, alertes stock |
| `/catalogue` | Catalogue | Grille de cartes matières avec filtres, recherche, niveaux stock |
| `/mouvements` | Mouvements | Formulaire entrée/sortie + timeline des mouvements récents |
| `/historique` | Historique | Tableau filtrable + export CSV/PDF |

## Stack Technique

- **Frontend** : React 18 + TypeScript + Vite
- **Routing** : React Router v7
- **Styling** : CSS vanilla (design system custom)
- **Design** : Stitch MCP (design AI)
- **Backend** : *(à implémenter)* Node.js + Express + PostgreSQL

## Structure du projet

```
src/
├── components/
│   └── Layout/
│       ├── Sidebar.tsx        # Navigation latérale
│       └── AppLayout.tsx      # Layout avec outlet
├── pages/
│   ├── LoginPage.tsx          # Page connexion
│   ├── DashboardPage.tsx      # Tableau de bord
│   ├── CataloguePage.tsx      # Catalogue matières
│   ├── MouvementsPage.tsx     # Entrées/sorties
│   └── HistoriquePage.tsx     # Journal des mouvements
├── data/
│   └── mockData.ts            # Données statiques
├── App.tsx                    # Router principal
├── main.tsx                   # Point d'entrée
└── index.css                  # Design system + styles
```
