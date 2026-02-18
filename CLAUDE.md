# StockAtelier — Documentation Projet (État réel)

Dernière mise à jour: 2026-02-18 (soir)

## 1) Résumé produit

StockAtelier est une application de gestion d’atelier de soudure (CEAS, Burkina Faso) avec:
- gestion des matières,
- mouvements d’entrée/sortie,
- gestion des utilisateurs et rôles,
- module **Travail** en Kanban (vues Équipements / Agents).

Cible principale: web responsive (mobile-first), exposé via ngrok pour tests terrain.

---

## 2) Stack technique

### Frontend
- React 19 + TypeScript (strict)
- Vite 7
- React Router
- CSS vanilla (`src/index.css`)
- lucide-react

### Backend
- Node.js + Express + TypeScript
- Prisma + PostgreSQL
- JWT auth avec invalidation de session via `tokenVersion`
- Gestion d’erreurs centralisée (middlewares)

### Runtime / accès externe
- ngrok via `/snap/bin/ngrok`
- URL publique (active au moment de la rédaction):
  - `https://wrongfully-sufferable-lue.ngrok-free.dev`

---

## 3) Fonctionnalités implémentées

## 3.1 Auth & session

Endpoints:
- `POST /api/auth/login`
- `GET /api/me`
- `PATCH /api/me/password`

Comportements:
- email normalisé (lowercase),
- compte inactif bloqué,
- JWT inclut `tokenVersion`,
- invalidation immédiate des sessions après reset mdp / désactivation.

Frontend login:
- option **Se souvenir de moi**:
  - activé → `localStorage`,
  - désactivé → `sessionStorage`.

## 3.2 Gestion utilisateurs (V1)

Page: `/utilisateurs` (ADMIN only)

Fonctions:
- création USER,
- modification profil,
- reset mot de passe par admin,
- activation/désactivation,
- filtres + recherche.

Règles métier:
- owner protégé,
- dernier admin actif protégé,
- création d’ADMIN interdite via UI,
- mot de passe min 8.

Chef d’équipe:
- champ `isTeamLead` sur `User`,
- géré par ADMIN,
- applicable aux USER,
- refus si compte désactivé.

Endpoint:
- `PATCH /api/users/:id/team-lead`

## 3.3 Module Travail (V1)

Page: `/travail`

Vues:
- **Équipements** (par défaut),
- **Agents**.

Kanban:
- statuts fixes: `TODO`, `IN_PROGRESS`, `CONTROL`, `DONE`,
- création/édition tâche,
- assignation multi-agents,
- archivage tâche/équipement (pas de hard delete),
- historique de tâche,
- gestion des retards (visuel).

Permissions:
- `ADMIN` + `isTeamLead=true`: gestion complète,
- `USER` standard: changement de statut seulement sur tâches assignées.

UX:
- drag & drop des tâches entre colonnes,
- fallback via actions manuelles,
- couleurs par statut,
- badge retard,
- meilleure lisibilité de la zone d’assignation.

---

## 4) Modèle Prisma (actuel)

Enums:
- `UserRole`: `ADMIN | USER`
- `MovementType`: `IN | OUT`
- `WorkTaskStatus`: `TODO | IN_PROGRESS | CONTROL | DONE`
- `WorkTaskPriority`: `LOW | MEDIUM | HIGH`

Modèles principaux:
- `User` (`active`, `isOwner`, `isTeamLead`, `tokenVersion`)
- `Material`
- `Movement`
- `WorkEquipment`
- `WorkTask`
- `WorkTaskAssignee`
- `WorkTaskHistory`

Migrations importantes:
- `catalogue_v2`
- `users_management_v1`
- `work_management_v1`

---

## 5) API routes (état réel)

### Santé
- `GET /api/health`

### Auth
- `POST /api/auth/login`
- `GET /api/me`
- `PATCH /api/me/password`

### Dashboard / stock
- `GET /api/dashboard`
- `GET /api/materials`
- `POST /api/materials`
- `GET /api/movements`
- `POST /api/movements`

### Users
- `GET /api/users` (ADMIN)
- `POST /api/users` (ADMIN)
- `PATCH /api/users/:id` (ADMIN)
- `PATCH /api/users/:id/password` (ADMIN)
- `PATCH /api/users/:id/team-lead` (ADMIN)

### Work
- `GET /api/work/agents`
- `GET /api/work/equipments`
- `POST /api/work/equipments` (work manager)
- `PATCH /api/work/equipments/:id` (work manager)
- `PATCH /api/work/equipments/:id/archive` (work manager)
- `GET /api/work/equipments/:id/tasks`
- `POST /api/work/equipments/:id/tasks` (work manager)
- `PATCH /api/work/tasks/:id` (work manager)
- `PATCH /api/work/tasks/:id/status`
- `PATCH /api/work/tasks/:id/archive` (work manager)
- `GET /api/work/tasks/:id/history` (ADMIN/chef)
- `GET /api/work/agents/:userId/kanban`

`work manager` = `ADMIN` ou `USER isTeamLead=true`.

---

## 6) Frontend routes

- `/login`
- `/`
- `/travail`
- `/catalogue`
- `/mouvements`
- `/historique`
- `/parametres`
- `/utilisateurs` (admin only)

---

## 7) Qualité code & architecture (cleanup 2026-02-18)

Améliorations appliquées:

### Backend
- correction build TS backend (`TS6059` seed hors `rootDir`),
- factorisation Work en modules:
  - `work.schemas.ts`
  - `work.mapper.ts`
  - `work.service.ts`
- factorisation Users en modules:
  - `users.schemas.ts`
  - `users.mapper.ts`
- util partagé `readIdParam`:
  - `src/lib/request.ts`
- helpers d’erreurs HTTP:
  - `src/lib/http-errors.ts`
- middleware global:
  - `src/middleware/async-handler.ts`
  - `src/middleware/error-handler.ts`
- routes enveloppées par `asyncHandler(...)` pour capturer les erreurs async proprement.

### Frontend
- correction React Hooks sur `MouvementsPage.tsx` (suppression de patterns `setState` problématiques dans `useEffect`).

Résultat:
- build backend OK,
- lint frontend OK,
- build frontend OK.

---

## 8) Fichiers clés modifiés récemment

### Backend
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/prisma/migrations/20260218095500_users_management_v1/migration.sql`
- `backend/prisma/migrations/20260218133027_work_management_v1/migration.sql`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/controllers/users.controller.ts`
- `backend/src/controllers/users.schemas.ts`
- `backend/src/controllers/users.mapper.ts`
- `backend/src/controllers/work.controller.ts`
- `backend/src/controllers/work.schemas.ts`
- `backend/src/controllers/work.mapper.ts`
- `backend/src/controllers/work.service.ts`
- `backend/src/lib/http-errors.ts`
- `backend/src/lib/request.ts`
- `backend/src/middleware/async-handler.ts`
- `backend/src/middleware/error-handler.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/routes/index.ts`
- `backend/tsconfig.json`

### Frontend
- `src/App.tsx`
- `src/types/index.ts`
- `src/lib/api.ts`
- `src/pages/LoginPage.tsx`
- `src/pages/MouvementsPage.tsx`
- `src/pages/UtilisateursPage.tsx`
- `src/pages/TravailPage.tsx`
- `src/components/Layout/Sidebar.tsx`
- `src/components/Layout/MobileTopBar.tsx`
- `src/components/Layout/MobileBottomNav.tsx`
- `src/index.css`

### Documentation
- `docs/plans/2026-02-18-stockatelier-catalogue-design.md`
- `docs/plans/2026-02-18-stockatelier-users-management-design.md`
- `docs/plans/2026-02-18-stockatelier-work-management-design.md`

---

## 9) Commandes utiles

### Frontend (racine app)
```bash
npm run dev
npm run lint
npm run build
npm run preview
```

### Backend
```bash
cd backend
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Base de données
```bash
docker compose up -d postgres
```

### ngrok
```bash
/snap/bin/ngrok http 5173 --authtoken <TOKEN>
```

---

## 10) Identifiants seed (dev)

Compte owner seedé:
- email: `kderoued@gmail.com`
- mot de passe: `Topsecret@123`

⚠️ Dev/local uniquement. À changer en environnement de production.

---

## 11) Backlog V2 (prévu)

- dépendances entre tâches,
- photos/pièces jointes sur tâche,
- personnalisation des statuts,
- exports avancés (CSV/PDF) du module Travail,
- stabilisation process runtime (anti SIGKILL / supervision).
