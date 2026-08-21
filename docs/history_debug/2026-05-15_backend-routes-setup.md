# 2026-05-15 — Mise en place des routes backend

## Périmètre de la session

Création des 12 fichiers backend (middleware, utils, schemas, routes) constituant l'API REST complète.
Suite directe de [2026-05-15_types-schema-seed.md](2026-05-15_types-schema-seed.md).

---

## Problèmes bloquants rencontrés

### 1. `@ft/shared` non compilé — erreur TS2307

**Symptôme :** `Cannot find module '@ft/shared' or its corresponding type declarations`

**Cause :** `shared/package.json` pointe vers `dist/index.js` + `dist/index.d.ts`, mais
`shared/dist/` n'existait pas (jamais compilé dans cette session de travail).

**Fix :** `npm run build --workspace=shared` avant tout `tsc --noEmit` backend.

**Contournement appliqué pour Jest :** `moduleNameMapper` dans `backend/package.json` :
```json
"@ft/shared": "<rootDir>/../shared/src/index.ts"
```
Jest pointe directement vers les sources TypeScript → pas besoin de compiler shared pour les tests.

**À faire (CI) :** Ajouter `npm run build --workspace=shared` en étape préliminaire
avant `tsc --noEmit` ou `npm test` dans le pipeline.

---

### 2. Zod v4 — `ZodError.errors` supprimé

**Symptôme :** `error TS2339: Property 'errors' does not exist on type 'ZodError<T>'`

**Cause :** Zod v4.4.3 a supprimé l'alias `.errors`. Propriété canonique = `.issues`.

**Fix dans `validate.middleware.ts` :**
```diff
- sendError(res, result.error.errors[0].message, 400);
+ sendError(res, result.error.issues[0].message, 400);
```

La signature de `z.custom<T>(validator, messageString)` est inchangée en v4.

---

## Dépendances ajoutées

| Package | Type | Raison |
|---------|------|--------|
| `zod@^4.4.3` | prod | Validation des corps de requêtes |
| `dotenv@^17.4.2` | prod | `import 'dotenv/config'` dans `server.ts` |
| `jest@^30` | dev | Runner de tests |
| `ts-jest@^29` | dev | Transpilation TypeScript pour Jest |
| `supertest@^7` | dev | Tests HTTP des routes Express |
| `@types/jest`, `@types/supertest` | dev | Typages |

---

## Surface API produite

### Auth — `/api/v1/auth`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/register` | — | Crée un compte. Valide email/username/password (Zod). 409 si email ou username pris. |
| POST | `/login` | — | Authentifie. Retourne `{ user, token }`. 401 générique (anti-énumération). |
| GET | `/me` | JWT | Retourne `UserPublic` du token. |
| PUT | `/profile` | JWT | Met à jour `username` et/ou `avatar`. 409 si username pris. |

### Maps — `/api/v1/maps`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/` | — | Maps publiées (pagination `page`/`limit=20`, filtre `difficulty`). Retourne `PaginatedResponse<MapSummary>`. |
| GET | `/my` | JWT | Toutes les maps du user connecté (publiées + brouillons). **Défini avant `/:id`** pour éviter le conflit de route. |
| GET | `/:id` | — | `MapData` complète d'une map publiée. 404 si inconnue ou non publiée. |
| POST | `/` | JWT | Crée une map. Valide grille (25×25, bordures WALL, 1 SPAWN, 1 EXIT, chemin BFS). `published: false`. Incrémente `created_maps_count`. |
| PUT | `/:id` | JWT | Met à jour `name` et/ou `grid`. 403 si non créateur, 400 si déjà publiée. |
| DELETE | `/:id` | JWT | Supprime map + scores associés. Décrémente `created_maps_count`. 204. |
| POST | `/:id/complete` | JWT | Marque `creator_completed: true`. Réservé au créateur. |
| POST | `/:id/publish` | JWT | Passe `published: true`. Exige `creator_completed === true` (400 sinon). |

### Tower — `/api/v1/tower`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/` | — | Liste des 8 niveaux admin (id, order_index, name — sans grille). |
| GET | `/:order_index` | JWT | Niveau complet avec `grid_json`. 403 si `order_index > tower_progress + 1`. |

### Scores — `/api/v1/scores`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/` | JWT | Soumet un score `{ map_id, completion_time_ms }`. 404 si map inconnue. |
| GET | `/leaderboard/:map_id` | — | Top 10 scores (tri ASC `completion_time_ms`) avec `username`. |

---

## Décisions techniques notables

### Mapping Difficulty Prisma ↔ shared

Prisma stocke `EASY | MEDIUM | HARD` (enum uppercase), le type partagé expose `easy | medium | hard`.
Conversion systématique dans `maps.routes.ts` :
```typescript
const DIFFICULTY_TO_PRISMA: Record<Difficulty, PrismaDifficulty> = {
  easy: PrismaDifficulty.EASY,
  medium: PrismaDifficulty.MEDIUM,
  hard: PrismaDifficulty.HARD,
};
// retour : map.difficulty.toLowerCase() as Difficulty
```

### Ordre des routes `/maps`

`GET /maps/my` doit être déclaré **avant** `GET /maps/:id` dans le router Express,
sinon le segment `my` est interprété comme un UUID et retourne 404.

### Anti-énumération sur `/login`

La route retourne `401 "Invalid credentials"` indépendamment de si l'email existe ou non,
pour éviter de révéler les comptes enregistrés.

### Validation de grille à deux niveaux

`createMapSchema` / `updateMapSchema` combinent dans le `z.custom` :
1. `validateGrid()` — structure, types, bordures, counts SPAWN/EXIT
2. `hasPath()` — BFS depuis SPAWN vers EXIT

Une grille valide structurellement mais sans chemin retourne 400 avec un message explicite.

### `$transaction` pour les opérations atomiques

- POST `/maps` : création map + incrément `created_maps_count` (atomique)
- DELETE `/maps/:id` : suppression scores + map + décrément `created_maps_count` (atomique)
- GET `/maps` : `findMany` + `count` (lecture cohérente, évite le double aller-retour)

---

## Résultats des tests

```
Test Suites: 4 passed, 4 total
Tests:       41 passed, 41 total
Time:        ~6.5s
```

| Suite | Tests | Couvre |
|-------|-------|--------|
| `grid.utils.test.ts` | 12 | `validateGrid` (8 cas) + `hasPath` (4 cas) |
| `auth.middleware.test.ts` | 5 | token valide, absent, mal formé, mauvais secret, expiré |
| `auth.routes.test.ts` | 14 | register (5), login (3), me (2), [Prisma mocké] |
| `maps.routes.test.ts` | 10 | GET public, GET /my, GET /:id, POST, publish (3), [Prisma mocké] |

**Mock Prisma :** `jest.mock('../lib/prisma', ...)` — les routes sont testées en isolation,
sans base de données. Les tests d'intégration réelle (migrate + seed) restent manuels pour l'instant.

---

## État après cette session

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` (backend) | ✅ 0 erreur |
| `npm test` (backend) | ✅ 41/41 |
| `npm audit` | ✅ 0 vulnérabilité |
| Serveur démarrable (`npm run dev`) | ✅ (nécessite DB + `.env` avec JWT_SECRET) |
