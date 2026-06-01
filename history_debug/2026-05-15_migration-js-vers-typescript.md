# 2026-05-15 — Migration architecture JS → TypeScript monorepo

## Contexte

Le commit `8ebcd32` ("Initial commit — Guilds-of-the-Deep", 2026-05-13) avait posé une
première architecture Express en **JavaScript pur**, sans TypeScript, sans Prisma, sans Docker.
Cette base a été abandonnée et **remplacée intégralement** par un monorepo TypeScript.

Aucun fichier de l'ancienne architecture n'a été conservé ni porté — c'est un remplacement complet,
pas une migration progressive.

---

## Ancienne architecture (commit 8ebcd32 — abandonnée)

```
backend/
  app.js               ← Express minimal, pas de middlewares auth/validation
  server.js            ← listen() basique
  db.js                ← pool pg brut (pas d'ORM)
  controllers/
    authController.js  ← register/login sans bcrypt ni JWT
    mapController.js   ← CRUD map basique
  middleware/
    auth.js            ← vérification JWT artisanale
  models/
    userModel.js       ← requêtes SQL brutes
    mapModel.js        ← requêtes SQL brutes
  routes/
    authRoutes.js
    mapRoutes.js

frontend/
  src/*.jsx            ← React JSX sans TypeScript
  src/api.js           ← fetch() brut, pas de types
```

**Problèmes identifiés justifiant le remplacement :**
- Aucun typage : les contrats entre frontend et backend n'étaient pas vérifiables
- Pas d'ORM : requêtes SQL brutes = risque injection + pas de migrations versionnées
- Pas de validation des entrées : aucun schéma Zod ou équivalent
- Pas de Docker : DB locale seulement, impossible à partager entre devs
- `package-lock.json` frontend/backend séparés, pas de workspace → dépendances dupliquées

---

## Nouvelle architecture (working tree actuel — non committé)

```
monorepo/
├── shared/src/types/        ← contrats TypeScript partagés (8 fichiers)
├── backend/src/
│   ├── lib/prisma.ts        ← singleton Prisma
│   ├── middleware/          ← auth JWT, validation Zod
│   ├── utils/               ← response helpers, grid BFS
│   ├── schemas/             ← schémas Zod (auth, maps, scores)
│   └── routes/              ← auth, maps, tower, scores + index
├── frontend/src/*.tsx        ← React TypeScript
└── docker-compose.yml        ← Postgres + backend + frontend
```

**ORM :** Prisma 5 — migrations versionnées, types générés automatiquement  
**Validation :** Zod 4 sur tous les corps de requêtes  
**Auth :** JWT (`jsonwebtoken`) + bcryptjs (12 rounds)  
**Tests :** Jest + ts-jest + supertest (41 tests, 4 suites)

---

## Fichiers supprimés (non committé — dans `git diff HEAD`)

| Fichier supprimé | Remplacé par |
|-----------------|--------------|
| `backend/server.js` | `backend/src/server.ts` |
| `backend/app.js` | intégré dans `server.ts` |
| `backend/db.js` | `backend/src/lib/prisma.ts` |
| `backend/middleware/auth.js` | `backend/src/middleware/auth.middleware.ts` |
| `backend/controllers/authController.js` | `backend/src/routes/auth.routes.ts` |
| `backend/controllers/mapController.js` | `backend/src/routes/maps.routes.ts` |
| `backend/models/userModel.js` | Prisma (`schema.prisma` → `@prisma/client`) |
| `backend/models/mapModel.js` | Prisma (`schema.prisma` → `@prisma/client`) |
| `backend/routes/authRoutes.js` | `backend/src/routes/auth.routes.ts` |
| `backend/routes/mapRoutes.js` | `backend/src/routes/maps.routes.ts` |
| `frontend/src/*.jsx` | `frontend/src/*.tsx` |
| `frontend/src/api.js` | à implémenter côté frontend (types depuis `@ft/shared`) |
| `CLAUDE.md` | retiré (contenu obsolète) |
| `Makefile` | retiré (remplacé par scripts npm) |
| `docs/mvp-presentation.md` | retiré |

---

## Décision : garder ou retravailler ?

Aucun code de l'ancienne base n'a été récupéré. La logique métier (register, login, CRUD map)
a été **réécrite from scratch** avec les nouvelles contraintes :
- format de réponse uniforme `{ data: T }` / `{ error, code }`
- validation systématique (Zod) avant tout handler
- mapping explicite `Difficulty` Prisma (MAJUSCULES) ↔ type partagé (minuscules)
- BFS sur la grille avant création/modification d'une map

---

## État git actuel

```
Committed (HEAD = 8ebcd32) : ancienne architecture JS
Working tree              : nouvelle architecture TS (non committé)
```

Le prochain commit devra :
1. Supprimer tous les anciens fichiers JS (`git rm`)
2. Ajouter tous les nouveaux fichiers TypeScript
3. Construire `shared/dist/` (`npm run build --workspace=shared`) avant le push CI
