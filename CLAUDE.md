# CLAUDE.md — ft_transcendence

## Équipe
| Membre   | Login      | Email 42                            | Rôle               |
|----------|------------|-------------------------------------|--------------------|
| Martin   | malafont   | malafont@student.42belgium.be       | PO + Gameplay      |
| Jerem    | jdebrull   | jdebrull@student.42belgium.be       | PM + Backend       |
| Jennifer | jpaulis    | jpaulis@student.42belgium.be        | Tech Lead + Front  |
| Élise    | evan-dro   | evan-dro@student.42belgium.be       | UI Lead            |

## Stack
- Frontend : React 18 + TypeScript + Vite 8 + Phaser 3.80 + Tailwind CSS
- Backend  : Node.js + Express 4 + TypeScript
- Auth     : JWT (localStorage clé ft_token, header Authorization: Bearer)
- ORM      : Prisma 5 + PostgreSQL (provider = "postgresql", DATABASE_URL=postgresql://...)
- Realtime : Socket.IO 4.7
- Tests    : Vitest (frontend) + Jest 30 (backend)
- Zod      : v4 — utiliser .issues[0].message (pas .errors)
- Deploy   : Docker Compose (services : postgres, backend, frontend)

## Déploiement Docker
- Fichier racine `.env` obligatoire (variables POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL, BACKEND_URL, NODE_ENV)
- Volume Docker `postgres_data` → persistance locale par collaborateur
- Ordre de démarrage : postgres (healthcheck) → backend (migrate + seed) → frontend
- `make docker-up` : point d'entrée unique
- `make docker-down` : arrêt sans perte de données
- `make docker-down-v` : arrêt + suppression des volumes (reset DB)
- Mode dev local sans Docker : possible via `make dev` avec une instance Postgres locale (DATABASE_URL dans backend/.env)

## Structure monorepo
/frontend   → React + Phaser
/backend    → Express + Prisma
/shared     → Types TypeScript partagés (compiler avant tout : npm run build -w shared)

## Conventions non négociables
- Erreurs API : { error: string, code: number }
- Réponses succès : { data: T } ou { data: T[], total, page, limit }
- Socket events : snake_case
- Client→Server : player_input, join_lobby, leave_lobby
- Server→Client : game_state, race_finished, player_joined, player_left, error_event
- Grille : TileValue[][] 25x25 — EMPTY=0 WALL=1 EXIT=2 SPAWN=3 ENEMY_H=4 ENEMY_V=5
- Phaser→React : this.game.events.emit(eventName, payload) — pas d'EventBus séparé
- Composants : fonctionnels + hooks, TypeScript strict, jamais de any
- Jamais de logique Phaser dans les composants React

## Admins
Les emails suivants ont is_admin=true automatiquement à la création de compte :
- malafont@student.42belgium.be
- jdebrull@student.42belgium.be
- jpaulis@student.42belgium.be
- evan-dro@student.42belgium.be

## Responsabilité des fichiers (headers 42)
- /backend/**                    → jdebrull
- /frontend/src/game/**          → malafont
- /frontend/src/components/**    → evan-dro
- /frontend/src/hooks/**         → jpaulis
- /frontend/src/context/**       → jpaulis
- /frontend/src/services/**      → jpaulis
- /frontend/src/pages/auth/**    → evan-dro
- /frontend/src/pages/editor/**  → malafont
- /frontend/src/pages/game/**    → malafont
- /frontend/src/pages/home/**    → evan-dro
- /shared/**                     → jpaulis

## État du projet
- Étapes 1-4 complètes
- Migration SQLite → PostgreSQL : à implémenter (schema.prisma + migrations + .env.example)
- Étape 5 (Socket.IO race multijoueur) : à implémenter
- Éditeur admin + mode tour complet : à faire

## Plan d'implémentation PostgreSQL + Multijoueur

### 1 — Migration PostgreSQL (backend)
Fichiers à modifier :
- `backend/prisma/schema.prisma` : `provider = "sqlite"` → `"postgresql"`
- `backend/prisma/migrations/` : supprimer l'historique SQLite, recréer avec `prisma migrate dev --name init_postgres`
- `backend/.env.example` : remplacer `DATABASE_URL="file:./dev.db"` par le format PostgreSQL
- `backend/src/` : aucun changement — Prisma Client est identique côté code

Points d'attention lors de la migration :
- `grid_json String` → reste `TEXT` en PostgreSQL, aucun changement de code
- `DateTime` → devient `TIMESTAMPTZ` natif (transparent via Prisma)
- Les seeds existants (`seed.ts`, `seed-tower.ts`) sont compatibles sans modification

### 2 — Étape 5 : Socket.IO race multijoueur
Architecture cible :
- `backend/src/game/` → nouveau dossier : logique de lobby et de course
  - `lobby.manager.ts` : gestion des rooms Socket.IO (join/leave/start)
  - `race.handler.ts` : enregistrement des handlers socket par connexion
  - `race.state.ts` : état en mémoire de la course (positions, timer, statuts)
- `backend/src/server.ts` : brancher `registerRaceHandlers(io, socket, user)` dans `io.on('connection')`

Events Socket.IO à implémenter :
- Client → Server : `join_lobby`, `leave_lobby`, `player_input`
- Server → Client : `game_state`, `race_finished`, `player_joined`, `player_left`, `error_event`

Persistance en fin de course :
- Créer un `Score` (completion_time_ms) pour chaque joueur qui termine
- Incrémenter `User.diamonds` du gagnant (+1)

### 3 — Fichiers à mettre à jour (docs + config)
- `README.md` : section stack → PostgreSQL, section démarrage → Docker en premier
- `README_install_and_start.md` : supprimer la section "Démarrage rapide SQLite", Docker devient le mode principal
- `Makefile` : vérifier que `db-migrate` fonctionne en mode PostgreSQL local (variable DATABASE_URL à passer)
- `docker-compose.yml` : déjà configuré — vérifier que le backend lance `prisma migrate deploy` au démarrage
- `.env.example` (racine) : créer s'il n'existe pas

## Documentation de session (obligatoire en fin de conversation)

### history_debug — journal de debug
Après chaque conversation, créer un fichier dans `history_debug/` si des bugs
ont été rencontrés ou des corrections effectuées.

Format du nom : `YYYY-MM-DD_sujet-kebab-case.md`

Structure du fichier :
```
# Debug history — YYYY-MM-DD : <Titre>

## Contexte
<Résumé de la session en 2-3 lignes>

---

## Problème N — <Titre court>

### Symptôme
<Ce que l'utilisateur observait>

### Cause
<Pourquoi ça arrivait — fichier et ligne si possible>

### Fix
<Ce qui a été changé, avec extrait de code si utile>

### Fichiers impliqués
- `chemin/vers/fichier.ts`

---

## Notes architecture
<Invariants ou comportements non évidents découverts pendant la session>
```

### backend_doc / frontend_doc — documentation technique de référence
Compléter `backend_doc/` et `frontend_doc/` au fil des sessions.
Créer `frontend_doc/` s'il n'existe pas encore.

Modèle appliqué (voir `backend_doc/cycle-de-vie-map.md` et
`background_doc/backend_middleware_express.md`) :
- Un fichier par concept ou sous-système (`auth-flow.md`, `socket-events.md`, etc.)
- Structure : titre → stack concernée → schéma ASCII ou code → explication
  des invariants → tableau des cas limites si utile
- Jamais de prose inutile : chaque phrase doit apporter une information
  qu'on ne peut pas déduire en lisant le code
- Mettre à jour le fichier existant plutôt qu'en créer un doublon

## context
mets a jour le fichier context.md entre chaque prompt si pertinent.
