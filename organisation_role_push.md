# Organisation des fichiers — Guilds of the Deep

**Projet :** ft_transcendence
**Dépôt créé :** 2026-05-13
**Dernier push :** 2026-05-15

---

## Membres & logins 42

| Prénom   | Login 42  | Rôle principal                        |
|----------|-----------|---------------------------------------|
| Martin   | malafont  | Infrastructure, configuration, DevOps |
| Elise    | evan-dro  | Design system frontend                |
| Jenifer  | jpaulis   | Application React                     |
| Jeremy   | jdebrull  | Serveur backend                       |

---

## Fichiers par auteur — ordre chronologique de création

---

### Martin — `malafont`
*Infrastructure, configuration projet & DevOps*
*A REDISTRIBUER*]\

#### Commit 1 — 2026-05-13 15:43:57
| Fichier | Description |
|---------|-------------|
| `README.md` | Présentation du projet |

#### Commit 2 — 2026-05-13 15:54:44
| Fichier | Description |
|---------|-------------|
| `.gitignore` | Règles d'exclusion Git |
| `docker-compose.yml` | Orchestration des conteneurs (backend, frontend, DB) |
| `package.json` | Dépendances & scripts monorepo racine |
| `package-lock.json` | Lockfile monorepo racine |
| `shared/package.json` | Configuration du module partagé |
| `shared/tsconfig.json` | TypeScript — module partagé |
| `backend/package.json` | Dépendances backend |
| `backend/tsconfig.json` | TypeScript — backend |
| `backend/prisma.config.ts` | Configuration Prisma CLI |
| `backend/prisma/schema.prisma` | Schéma de base de données |
| `frontend/index.html` | Point d'entrée HTML |
| `frontend/package.json` | Dépendances frontend |
| `frontend/tsconfig.json` | TypeScript — frontend |
| `frontend/postcss.config.cjs` | Configuration PostCSS |
| `frontend/src/index.css` | Styles globaux Tailwind (`@tailwind base/components/utilities`) |

---

### Elise — `evan-dro`
*Configuration du design system frontend*

#### Créé le 2026/05/15
| Fichier | Description |
|---------|-------------|
| `frontend/tailwind.config.ts` | Thème Tailwind CSS : couleurs, polices, breakpoints |

---

### Jenifer — `jpaulis`
*Application React — routing, point d'entrée & composant racine*

#### Créé le 2026/05/15
| Fichier | Description |
|---------|-------------|
| `frontend/vite.config.ts` | Configuration du bundler Vite + plugin React |
| `frontend/src/main.tsx` | Point d'entrée React — montage DOM (`createRoot`) |
| `frontend/src/App.tsx` | Composant racine — structure des routes à venir |

---

### Jenifer — `jpaulis`
*Types partagés — contrats TypeScript entre frontend et backend*

#### Créé le 2026/05/15
| Fichier | Description |
|---------|-------------|
| `shared/src/types/tiles.types.ts` | Constantes de tuiles (TILE), TileValue, Grid, GRID_SIZE |
| `shared/src/types/user.types.ts` | UserPublic, UserProfile, UpdateProfileRequest |
| `shared/src/types/map.types.ts` | MapData, MapSummary, CreateMapRequest, UpdateMapRequest, Difficulty |
| `shared/src/types/auth.types.ts` | LoginRequest, RegisterRequest, AuthResponse |
| `shared/src/types/game.types.ts` | Direction, Position, PlayerState, GameState, RaceResult |
| `shared/src/types/socket.types.ts` | ClientToServerEvents, ServerToClientEvents (Socket.IO) |
| `shared/src/types/api.types.ts` | ApiError, ApiResponse\<T\>, PaginatedResponse\<T\> |
| `shared/src/index.ts` | Re-export de tous les types partagés |

---

### Jeremy — `jdebrull`
*Serveur backend — API REST & WebSocket*

#### Créé le 2026/05/15
| Fichier | Description |
|---------|-------------|
| `backend/src/server.ts` | Serveur Express + Socket.IO (CORS, Helmet, rate-limit, health endpoint) |
| `backend/prisma/schema.prisma` | Schéma Prisma complet : User, Map, AdminMap, Score, enum Difficulty |
| `backend/prisma/seed.ts` | Seed : 2 utilisateurs de test + 1 AdminMap ordre 1 (grille 25×25 valide) |
| `backend/src/lib/prisma.ts` | Singleton PrismaClient avec logs dev uniquement |

#### Jour 2 — 2026/05/15 — Middleware, utilitaires, routes API complètes
> **Étape bloquante :** `@ft/shared` devait être compilé avant tout import dans le backend — ajout d'une étape de build dans le workflow.
> **Étape bloquante :** Zod v4 (installé) remplace `.errors` par `.issues` sur `ZodError` — correction immédiate dans `validate.middleware.ts`.

| Fichier | Description |
|---------|-------------|
| `backend/src/utils/response.utils.ts` | Helpers `sendSuccess<T>` / `sendError` — format `{ data }` / `{ error, code }` |
| `backend/src/utils/grid.utils.ts` | `validateGrid()` (structure 25×25, bordures WALL, 1 SPAWN + 1 EXIT) + `hasPath()` (BFS) |
| `backend/src/middleware/auth.middleware.ts` | Vérification JWT Bearer, augmentation `Express.Request.user` |
| `backend/src/middleware/validate.middleware.ts` | Factory `validateBody<T>(ZodSchema)` — renvoie 400 sur échec Zod |
| `backend/src/schemas/auth.schemas.ts` | Zod : `registerSchema`, `loginSchema`, `updateProfileSchema` |
| `backend/src/schemas/map.schemas.ts` | Zod : `createMapSchema`, `updateMapSchema`, `scoreSchema` — grille validée via `validateGrid + hasPath` |
| `backend/src/routes/auth.routes.ts` | POST register/login, GET me, PUT profile |
| `backend/src/routes/maps.routes.ts` | CRUD maps + /my + /complete + /publish |
| `backend/src/routes/tower.routes.ts` | GET tower (liste) + GET tower/:order_index (contrôle de progression) |
| `backend/src/routes/scores.routes.ts` | POST score + GET leaderboard/:map_id |
| `backend/src/routes/index.ts` | Assemblage des routers sous `/api/v1` |
| `backend/src/server.ts` | Mise à jour : montage `apiRouter`, 404 catch-all, handler d'erreur global |
| `backend/src/__tests__/grid.utils.test.ts` | 8 tests unitaires `validateGrid` + 4 tests `hasPath` |
| `backend/src/__tests__/auth.middleware.test.ts` | 5 tests middleware JWT |
| `backend/src/__tests__/auth.routes.test.ts` | 8 tests routes auth (Prisma mocké) |
| `backend/src/__tests__/maps.routes.test.ts` | 10 tests routes maps (Prisma mocké) |

---

### Elise — `evan-dro`
*Composants UI & pages auth*

#### Jour 2 — 2026/05/15 — Design system complet + pages auth + éditeur de grille
> **Étape bloquante :** `baseUrl` déprécié en TypeScript 6+ avec `moduleResolution: "bundler"` — suppression et migration vers `paths: { "@/*": ["./src/*"] }`.
> **Étape bloquante :** `vi.useFakeTimers()` incompatible avec `userEvent.click()` (microtasks) — remplacement par `fireEvent` (synchrone) pour les tests de timers.

| Fichier | Description |
|---------|-------------|
| `frontend/src/components/ui/Button.tsx` | Variants primary/secondary/danger/ghost, tailles sm/md/lg, spinner intégré |
| `frontend/src/components/ui/Input.tsx` | Label + message d'erreur, focus ring violet |
| `frontend/src/components/ui/Spinner.tsx` | SVG animé, tailles sm/md/lg |
| `frontend/src/components/ui/Modal.tsx` | Overlay sombre, fermeture Escape + click overlay |
| `frontend/src/components/ui/useToast.ts` | Context + hook `useToast()` + `ToastProvider` |
| `frontend/src/components/ui/Toast.tsx` | `ToastItem` + `ToastContainer` (bas-droite, auto-4s) |
| `frontend/src/components/layout/Navbar.tsx` | Logo + liens auth/nav, avatar, burger mobile |
| `frontend/src/components/layout/Layout.tsx` | Wrapper Navbar + `<main>` + `ToastContainer` |
| `frontend/src/components/editor/EditorGrid.tsx` | Grille 25×25 CSS grid, paint au clic et au drag |
| `frontend/src/components/editor/TileSelector.tsx` | Boutons par type de tuile, indicateur actif |
| `frontend/src/pages/auth/LoginPage.tsx` | Formulaire email/password, redirect si déjà connecté |
| `frontend/src/pages/auth/RegisterPage.tsx` | Formulaire + validation frontend (username, confirm password) |
| `frontend/src/pages/HomePage.tsx` | Lore + carte joueur (diamants, niveau tour) + 3 CTA |
| `frontend/src/pages/NotFoundPage.tsx` | Page 404 |

---

### Jenifer — `jpaulis`
*Services, context, routing, hooks*

#### Jour 2 — 2026/05/15 — Couche service + auth context + routing complet + hooks
> **Étape bloquante :** React Router v7 installé (spec demandait v6) — rétrocompatible, code identique.
> **Étape bloquante :** Les réponses paginées du backend ne suivent pas le pattern `{ data: T }` standard — ajout de `requestPaginated<T>()` distinct dans `ApiService`.

| Fichier | Description |
|---------|-------------|
| `frontend/src/services/api.service.ts` | Classe `ApiService` (singleton `api`) — toutes les routes REST |
| `frontend/src/context/auth.context.tsx` | `AuthProvider`, `useAuth()`, restauration session depuis localStorage |
| `frontend/src/hooks/useApi.ts` | Hook générique `useApi<T>` — loading/data/error/refetch, abort on unmount |
| `frontend/src/hooks/useMap.ts` | `useMap`, `usePublishedMaps`, `useMyMaps` |
| `frontend/src/App.tsx` | Router v7, `ProtectedRoute`, assemblage providers |
| `frontend/src/main.tsx` | Point d'entrée React |
| `frontend/src/pages/ProfilePage.tsx` | Stub sprint 3 |
| `frontend/src/pages/TrainingPage.tsx` | Stub sprint 3 |
| `frontend/src/pages/TowerPage.tsx` | Stub sprint 3 |

---

### Martin — `malafont`
*Phaser 3, jeu, éditeur*

#### Jour 2 — 2026/05/15 — Moteur Phaser + GameCanvas + pages jeu et éditeur
> **Étape bloquante :** `game.scene.getScene()` retourne `null` avant le démarrage de la scène — émission des événements via `game.events` (global) au lieu des événements de scène, pour éviter la race condition dans `GameCanvas`.

| Fichier | Description |
|---------|-------------|
| `frontend/src/game/scenes/BaseScene.ts` | Classe abstraite + `buildTilemap(grid)` (carrés colorés, lignes de grille) |
| `frontend/src/game/scenes/GameScene.ts` | Mouvement grille (WASD/curseurs), collision WALL, détection EXIT, timer |
| `frontend/src/game/GameCanvas.tsx` | Instanciation Phaser dans useEffect, écoute `player_reached_exit`, destroy cleanup |
| `frontend/src/pages/game/GamePage.tsx` | Fetch map → spinner → GameCanvas → submit score → navigate |
| `frontend/src/pages/game/RacePage.tsx` | Stub sprint 4 |
| `frontend/src/pages/editor/EditorPage.tsx` | State grille + nom, save/update/publish avec Modal de confirmation |
