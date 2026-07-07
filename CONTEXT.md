# CONTEXT.md — Résumé complet pour Claude

## Stack actuelle
- React 18 / Phaser 3.80 / Express 4 / **PostgreSQL 16** / Prisma 5.14 / Socket.IO 4.7
- Deploy : Docker Compose (`make docker-up`) — PostgreSQL dans volume Docker, migrations auto au démarrage
- Zod v4 : `.issues[0].message` (pas `.errors`)
- Auth : JWT dans localStorage (`ft_token`), header `Authorization: Bearer`
- Phaser→React : `this.game.events.emit(eventName, payload)` — **pas d'EventBus séparé**
- Shared : compiler avec `npm run build -w shared` avant tout démarrage
- `socket.io-client ^4.7.5` déjà installé dans `frontend/package.json`

## Admins
malafont, jdebrull, jpaulis, evan-dro (@student.42belgium.be)

---

## Schéma Prisma (PostgreSQL actuel)

```prisma
model User {
  id, email, username, password_hash, avatar?, diamonds Int=0,
  tower_progress Int=0, created_maps_count Int=0, is_admin Boolean=false,
  created_at, updated_at
  maps Map[], scores Score[]
}
model Map {
  id, name, grid_json String (TEXT), published, creator_completed,
  difficulty String="EASY", play_count Int=0, creator_id FK→User,
  created_at, updated_at
  scores Score[]
}
model AdminMap { id, order_index Int @unique, name, grid_json String, created_at }
model Score {
  id, completion_time_ms Int, user_id FK→User, map_id FK→Map, created_at
  @@index([map_id, completion_time_ms])
}
```

## Routes API actives (/api/v1/)
- `POST /auth/register` `POST /auth/login` `GET /auth/me` `PUT /auth/profile`
- `GET /maps` `POST /maps` `GET /maps/my` `GET /maps/:id` `PUT /maps/:id` `DELETE /maps/:id`
- `POST /maps/:id/complete` `POST /maps/:id/publish` `POST /maps/:id/unpublish`
- `GET /tower` `GET /tower/level/:order_index`
- `POST /scores` `GET /scores/leaderboard/:map_id`
- `GET /admin/tower` `PUT /admin/tower/:order_index` ← admin seulement

**Notes routes :**
- `DELETE /maps/:id` : cascade sur scores, décrémente `created_maps_count`
- `POST /scores` : body `{ map_id, completion_time_ms }` (pas `/:map_id` dans l'URL)
- `PUT /admin/tower/:order_index` : upsert, order_index 1–8

## Types partagés clés (shared/src/types/)

```ts
// tiles.types.ts
TILE = { EMPTY:0, WALL:1, EXIT:2, SPAWN:3, ENEMY_H:4, ENEMY_V:5 }
GRID_SIZE = 25
type Grid = TileValue[][]

// game.types.ts
type Direction = 'up' | 'down' | 'left' | 'right'
interface Position { x: number; y: number }           // x=col, y=row dans la grille
interface PlayerState {
  id: string; username: string; avatar: string | null;
  position: Position; direction: Direction; alive: boolean;
}
interface GameState {
  race_id: string; map_id: string; players: PlayerState[];
  tick: number; started: boolean; finished: boolean;
}
interface RaceResult {
  winner_id: string; loser_id: string; duration_ms: number;
  map_id: string; created_at: string;
}

// socket.types.ts
interface LobbyEntry { map_id: string; player: { id, username, avatar } }
interface DuelStartPayload { race_id, map_id, grid: Grid, opponent: { id, username, avatar } }
interface ClientToServerEvents {
  player_input: (data: { direction: Direction }) => void;
  join_lobby:   (data: { map_id: string }) => void;
  leave_lobby:  () => void;
  join_race:    (data: { race_id: string }) => void;  // rejoint la room de course
  player_died:  () => void;                           // mort par ennemi (côté client)
}
interface ServerToClientEvents {
  game_state:    (state: GameState) => void;
  race_finished: (result: RaceResult) => void;
  player_joined: (player: PlayerState) => void;
  player_left:   (data: { player_id: string }) => void;
  error_event:   (data: { message: string; code: number }) => void;
  lobby_state:   (data: { entries: LobbyEntry[] }) => void;  // état global lobby
  duel_start:    (payload: DuelStartPayload) => void;        // match trouvé
}
```

---

## Architecture Phaser existante

### BaseScene (`frontend/src/game/scenes/BaseScene.ts`)
- `TILE_SIZE = 36`
- `protected preloadTileAssets()` — charge les textures tuile
- `protected buildTilemap(grid: Grid)` — construit la carte (PNG ou fallback couleur)
- Autotiling des murs via `getWallFrame()`

### GameScene (`frontend/src/game/scenes/GameScene.ts`) — solo
- Étend `BaseScene`
- Reçoit `{ grid, player_id }` via `create(data: GameSceneData)`
- Mouvement : tween 150ms case par case, accélération progressive → 60ms min
- Émissions Phaser→React : `this.game.events.emit('player_reached_exit', elapsed_ms)` et `player_caught`

### DuelScene (`frontend/src/game/scenes/DuelScene.ts`) — multijoueur
- Étend `BaseScene`
- Reçoit `{ grid, my_id, my_username, my_sprite?, opponent_sprite?, opponent: { id, username, avatar } }` via `create()`
- Joueur local : sprite normal (texture `KEY_SPRITE_PLAYER`, résolue depuis `my_sprite`), caméra suit le joueur
- Joueur distant : sprite teinté bleu (0x66aaff), alpha 0.55, label pseudo au-dessus — texture **dédiée** `sprite_opponent` (résolue depuis `opponent_sprite`), animations `remote_walk_*`/`remote_idle_*` séparées des animations locales
  (une anim Phaser garde sa texture d'origine même jouée sur un autre sprite → nécessite un jeu d'animations par texture, cf. `frontend_doc/duel-remote-ghost-sprite-identity.md`)
- Ennemis : `ENEMY_FRAME_W/H = 240×343` (aligné sur `GameScene`, seul découpage valide de `enemy_test.png` 962×1375px), `.setCrop()` appliqué comme dans `GameScene` — cf. `frontend_doc/duel-enemy-sprite-crop-freeze.md`
- Émissions Phaser→React :
  - `emit_player_input` → React → `socket.emit('player_input', { direction })`
  - `player_caught` → React → `socket.emit('player_died')`
  - `player_reached_exit` — victoire locale (confirmée côté serveur)
- Écoute `game.events.on('remote_state', handleRemoteState)` — tween vers nouvelle position

### GameCanvas (`frontend/src/game/GameCanvas.tsx`)
- Props : `{ grid, player_id, onExit: (ms)=>void, onDeath?: ()=>void }`

### Sprites et assets (`frontend/src/game/assets.ts`)
- `KEY_SPRITE_PLAYER / ASSET_SPRITE_PLAYER` — spritesheet 200×320 px par frame
- `KEY_SPRITE_ENEMY_H / ASSET_SPRITE_ENEMY_H` — ennemi horizontal, 258×353 px
- `KEY_SPRITE_ENEMY_V / ASSET_SPRITE_ENEMY_V` — ennemi vertical, 258×353 px
- Scale des sprites : `setScale(0.20)`, origine `(0.5, 0.75)`

---

## Architecture Socket.IO Duel (implémentée)

### `backend/src/socket/duelHandler.ts`
Monofichier — tout le cycle duel en un seul endroit :

**État en mémoire :**
```
lobbies:    Map<map_id, LobbyRegistration>    // 1 joueur en attente par map
socketRegs: Map<socket_id, Set<map_id>>       // inscriptions d'un socket
activeRaces: Map<race_id, ActiveRace>
socketRace: Map<socket_id, race_id>
```

**Flux duel :**
1. Client A → `join_lobby({ map_id })` → inscrit dans `lobbies`
2. Client B → `join_lobby({ map_id })` → match trouvé → `duel_start` émis aux deux (pas de broadcast)
3. Chaque client → `join_race({ race_id })` → rejoint `race:${race_id}`, la course démarre quand 2 présents
4. `player_input` → mouvement serveur-autoritaire, `game_state` broadcasté à la room
5. Exit atteint → `race_finished` + nettoyage
6. `player_died` (ennemi client) → `race_finished` avec le survivant gagnant
7. `disconnect` pendant une course active → délai de grâce **3000ms** (`DISCONNECT_GRACE_MS`) avant forfait — `RacePlayer.connected = false` + `setTimeout`, annulé si le même `user.id` rejoint via `join_race` avant expiration (cf. `backend_doc/duel-reconnection-grace-period.md`). Désinscription du lobby en attente : toujours immédiate, sans délai.

**Limite lobby :** max 3 inscriptions simultanées par socket

**Note :** lobby et courses actives sont strictement limités à 2 joueurs (pas encore de mode 3+ joueurs).

### `backend/src/server.ts`
- Appelle `registerDuelHandlers(io)` — c'est là que l'auth JWT et les handlers sont montés
- Pas de `registerRaceHandlers` séparé (architecture simplifiée)

---

## Frontend — Pages et flux

### Routes (App.tsx)
```
/             HomePage
/login        LoginPage
/register     RegisterPage
/profile      ProfilePage (protected)
/editor       EditorPage (protected)
/editor/:id   EditorPage (mode édition) (protected)
/train        TrainingPage (protected)
/tower        TowerPage (protected)
/play/tower/:order_index  TowerGamePage (protected)
/play/:map_id             GamePage (protected)
/play/:map_id/race        RacePage — placeholder (protected)
/duel                     DuelPage (protected)
/duel/game                DuelGamePage (protected, reçoit state: DuelStartPayload)
```

### EditorPage (`frontend/src/pages/editor/EditorPage.tsx`)
- Mode normal : créer/éditer ses maps, panel "Mes maps" latéral avec delete
- Mode admin (`user.is_admin`) : switch pour éditer les niveaux AdminMap de la tour
- Delete map : modal de confirmation → `api.maps.delete(id)` → `refetchMyMaps()`
- Hooks utilisés : `useMyMaps()` pour le panel latéral

### DuelPage (`frontend/src/pages/duel/DuelPage.tsx`)
- Liste les maps publiées avec pagination et filtre difficulté
- Affiche le lobby global (qui attend sur quelle map)
- Hook `useDuelLobby` gère la connexion Socket.IO et les events
- Bouton "S'inscrire" / "Défier" / "Inscrit" selon l'état

### DuelGamePage (`frontend/src/pages/duel/DuelGamePage.tsx`)
- Reçoit `DuelStartPayload` via `location.state` (navigate depuis DuelPage)
- Crée un 2ème socket pour le jeu (séparé du socket lobby)
- Crée `DuelScene` via Phaser après `game.events.once('ready')`
- Overlay "En attente..." jusqu'à `game_state.started === true`
- Overlay résultat (victoire/défaite) sur `race_finished`

---

## Hooks frontend clés

- `useApi` — wrapper générique pour les appels API avec loading/error/refetch
- `useMap(id)` — charge une MapData par id
- `usePublishedMaps(page, difficulty?)` — liste paginée des maps publiées
- `useMyMaps()` — maps du créateur connecté
- `useDuelLobby({ token, userId, onDuelStart, onError })` — Socket.IO lobby duel

---

## État du déploiement
- Docker fonctionne (`make docker-up`)
- PostgreSQL connecté, migrations appliquées (migration unique 20260527000000_init_postgres)
- Frontend accessible sur http://localhost:5173
- Backend accessible sur http://localhost:3001
- Proxy Vite → backend via `BACKEND_INTERNAL_URL=http://backend:3001` (docker-compose.yml)

---

## Fonctionnalités complètes (2026-06-09)
- Auth (register/login/me/profile)
- Éditeur de maps (create/edit/delete/publish/unpublish/complete)
- Mode solo (`/play/:map_id`) — GameScene avec ennemis
- Mode tour (`/tower` + `/play/tower/:order_index`) — 8 niveaux AdminMap
- Mode duel (`/duel` + `/duel/game`) — Socket.IO temps réel, 2 joueurs
- Admin : éditeur de niveaux de la tour dans EditorPage
- Scores : leaderboard par map, enregistrement après course solo

## Ce qui reste (branche actuelle : feature/add-maps-panel-and-saved-maps)
- Panel maps dans l'éditeur : affiché, delete fonctionnel (commit 924e5f2)
- Potentiel : persistance des scores en fin de duel (non implémentée côté duelHandler)
- RacePage (`/play/:map_id/race`) : encore placeholder
