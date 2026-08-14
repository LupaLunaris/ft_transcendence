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
- Client→Server : `join_lobby`, `leave_lobby`, `join_race`, `player_input`, `player_died`
- Server→Client : `lobby_state`, `duel_start`, `game_state`, `race_finished`, `error_event`
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
- Étapes 1-4 : complètes
- Migration PostgreSQL : **complète** (schema.prisma + migration 20260527000000_init_postgres + Docker)
- Étape 5 (Socket.IO multijoueur) : **complète** — implémentée comme système de **Duel**
- Delete map + Unpublish map : **complets** (backend + frontend)
- Éditeur admin de la tour : **complet** (GET/PUT /admin/tower/:order_index + EditorPage admin mode)
- RacePage (`/play/:map_id/race`) : placeholder conservé, le vrai mode multijoueur passe par `/duel`
- **À traiter (responsable Martin, PO + Gameplay)** : `player_input` (duel) n'a pas de limite de fréquence côté serveur — speed-hack possible via `socket.emit` en boucle depuis la console. Problème de fair-play/gameplay, pas de sécurité au sens strict. Détails et piste de fix dans `CONTEXT.md` (section "À traiter") et `history_debug/2026-08-14_faille-scores-forgeable.md`.

## Architecture Socket.IO Duel (implémentée)

### Backend — `backend/src/socket/duelHandler.ts`
Monofichier qui gère tout le cycle duel (remplace les 3 fichiers game/ prévus) :
- **Lobby global** : `map_id → LobbyRegistration` — visible par tous les joueurs connectés
- **Limite** : max 3 inscriptions simultanées par joueur
- **Match** : déclenché immédiatement quand 2 joueurs différents rejoignent le même lobby
- **Room de course** : `race:${race_id}` (préfixée, séparée du lobby)
- **`join_race`** : event pour rejoindre la room de course (socket de jeu ≠ socket de lobby)
- **`player_died`** : émis par le client quand un ennemi le capture côté Phaser
- Auth JWT via `io.use()` avec lookup DB (`prisma.user.findUnique`)

Events Socket.IO réels :
- Client→Server : `join_lobby`, `leave_lobby`, `join_race`, `player_input`, `player_died`
- Server→Client : `lobby_state`, `duel_start`, `game_state`, `race_finished`, `player_joined`, `player_left`, `error_event`

### Frontend — pages et composants duel
- `frontend/src/pages/duel/DuelPage.tsx` — lobby avec liste des maps publiées + inscriptions
- `frontend/src/pages/duel/DuelGamePage.tsx` — jeu duel (reçoit `DuelStartPayload` via `location.state`)
- `frontend/src/game/scenes/DuelScene.ts` — scène Phaser : joueur local + fantôme adversaire (teinté bleu)
- `frontend/src/hooks/useDuelLobby.ts` — hook Socket.IO pour le lobby

### Types partagés duel (shared)
```ts
interface LobbyEntry { map_id: string; player: { id, username, avatar } }
interface DuelStartPayload { race_id, map_id, grid: Grid, opponent: { id, username, avatar } }
// ClientToServerEvents: + join_race({ race_id }), player_died()
// ServerToClientEvents: + lobby_state({ entries }), duel_start(DuelStartPayload)
```

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
