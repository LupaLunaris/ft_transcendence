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
  position: Position; direction: Direction; alive: boolean; finished: boolean;
}
type EnemyKind = 'horizontal' | 'vertical'
interface EnemyState { id: string; kind: EnemyKind; position: Position; direction: Direction }
interface GameState {
  race_id: string; map_id: string; players: PlayerState[]; enemies: EnemyState[];
  tick: number; started: boolean; finished: boolean;
}
interface RaceRankingEntry {
  user_id: string; username: string; rank: number;
  duration_ms: number | null; finished: boolean;   // duration_ms null si pas fini (mort/forfait)
}
interface RaceResult { race_id: string; map_id: string; ranking: RaceRankingEntry[]; created_at: string }

// socket.types.ts — généralisé 2-4 joueurs (plus de opponent/player singuliers)
interface LobbyEntry { map_id: string; players: { id, username, avatar }[]; countdown_ends_at: number | null }
interface DuelStartPayload { race_id, map_id, grid: Grid, opponents: { id, username, avatar }[] }  // 1 à 3 adversaires
interface ClientToServerEvents {
  player_input: (data: { direction: Direction }) => void;
  join_lobby:   (data: { map_id: string }) => void;
  leave_lobby:  () => void;
  join_race:    (data: { race_id: string }) => void;  // rejoint la room de course
  // player_died SUPPRIMÉ — collision ennemie détectée uniquement côté serveur (tick)
}
interface ServerToClientEvents {
  game_state:    (state: GameState) => void;
  race_finished: (result: RaceResult) => void;
  player_joined: (player: PlayerState) => void;   // non utilisé actuellement
  player_left:   (data: { player_id: string }) => void;  // non utilisé actuellement
  error_event:   (data: { message: string; code: number }) => void;
  lobby_state:   (data: { entries: LobbyEntry[] }) => void;
  duel_start:    (payload: DuelStartPayload) => void;
}

// shared/src/game/enemyLogic.ts (nouveau) — logique de rebond déterministe
// partagée entre backend (tick autoritaire) et frontend (types + parsing grille)
type EnemyRuntimeState = { id: string; kind: EnemyKind; x: number; y: number; dx: 1|-1; dy: 1|-1; direction: Direction }
function stepEnemy(state, grid): EnemyRuntimeState   // pure, un pas de simulation
function extractEnemiesFromGrid(grid): EnemyRuntimeState[]   // parse ENEMY_H/ENEMY_V, id = `enemy_${row}_${col}`
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

### DuelScene (`frontend/src/game/scenes/DuelScene.ts`) — multijoueur 2-4 joueurs
- Étend `BaseScene`
- Reçoit `{ grid, my_id, my_username, my_sprite?, opponents: {id,username,avatar}[], opponent_sprites: Record<user_id,string> }` via `create()`
- Joueur local : sprite normal (texture `KEY_SPRITE_PLAYER`), caméra suit le joueur
- Adversaires (1 à 3) : `this.remotes: Map<user_id, RemoteGhost>` — un fantôme par adversaire, chacun avec sa **propre texture** `sprite_opponent_${id}` et son **propre jeu d'anims** `remote_walk_${id}_${dir}`/`remote_idle_${id}_${dir}` (teinté bleu 0x66aaff, alpha 0.55, label pseudo au-dessus)
  (une anim Phaser garde sa texture d'origine même jouée sur un autre sprite → nécessite un jeu d'animations par texture et par adversaire, cf. `frontend_doc/duel-remote-ghost-sprite-identity.md` et `frontend_doc/duel-nplayer-remote-rendering.md`)
- Ennemis : **plus de simulation locale** — `spawnEnemies()` crée seulement les sprites visuels via `extractEnemiesFromGrid()` (shared), positions/animations pilotées par le serveur via `handleRemoteEnemies()` (tween 350ms, cadence 400ms). `ENEMY_FRAME_W/H = 240×343`, `.setCrop()` — cf. `frontend_doc/duel-enemy-sprite-crop-freeze.md`
- Collision joueur/ennemi et arrivée en EXIT : **autoritaires côté serveur**, vérifiées à la fois dans `player_input` (juste après la mise à jour de position) et dans le tick ennemi (400ms) — les deux sont nécessaires, cf. `backend_doc/duel-server-authoritative-enemies.md`. Le client ne fait que geler son propre input : `this.finished = true`, en atteignant visuellement l'EXIT **ou** sur l'event `i_died` (mort confirmée par le serveur, cf. ci-dessous)
- Émissions Phaser→React : `emit_player_input` → React → `socket.emit('player_input', { direction })`
- Écoute `game.events.on('remote_states', handleRemoteStates)`, `game.events.on('remote_enemies', handleRemoteEnemies)` et `game.events.on('i_died', handleIDied)` — mouvement local prédictif (tween immédiat) donc sans ce dernier event un joueur tué ne le sait jamais (continue à se déplacer visuellement, ses inputs sont juste ignorés côté serveur)
- `create()` émet `game.events.emit('scene_ready')` en dernière ligne — `DuelGamePage.tsx` rejoue alors son dernier `game_state` connu (`lastGameStateRef`) vers `remote_states`/`remote_enemies`/`i_died`, pour rattraper tout ce qui a été émis (et perdu, faute de listener) pendant le chargement des textures — cf. `frontend_doc/duel-nplayer-remote-rendering.md` (sinon un adversaire qui finit très vite pendant que cette scène charge encore reste figé au spawn indéfiniment)

### GameCanvas (`frontend/src/game/GameCanvas.tsx`)
- Props : `{ grid, player_id, onExit: (ms)=>void, onDeath?: ()=>void }`

### Sprites et assets (`frontend/src/game/assets.ts`)
- `KEY_SPRITE_PLAYER / ASSET_SPRITE_PLAYER` — spritesheet 200×320 px par frame
- `KEY_SPRITE_ENEMY_H / ASSET_SPRITE_ENEMY_H` — ennemi horizontal, 258×353 px
- `KEY_SPRITE_ENEMY_V / ASSET_SPRITE_ENEMY_V` — ennemi vertical, 258×353 px
- Scale des sprites : `setScale(0.20)`, origine `(0.5, 0.75)`

---

## Architecture Socket.IO Duel — 2 à 4 joueurs (implémentée)

### `backend/src/socket/duelHandler.ts`
Monofichier — tout le cycle duel en un seul endroit :

**Constantes :** `MIN_RACE_PLAYERS=2` `MAX_RACE_PLAYERS=4` `LOBBY_COUNTDOWN_MS=30_000` `DISCONNECT_GRACE_MS=10_000` `ENEMY_TICK_MS=400`

**État en mémoire :**
```
lobbies:     Map<map_id, LobbyQueue>          // file d'attente 1-4 joueurs par map + countdown_timer
socketRegs:  Map<socket_id, Set<map_id>>      // inscriptions d'un socket
activeRaces: Map<race_id, ActiveRace>         // players: Map<user_id, RacePlayer>, enemies: EnemyRuntimeState[], enemy_tick_timer
socketRace:  Map<socket_id, race_id>
```

**Flux duel :**
1. `join_lobby({map_id})` → ajouté à la `LobbyQueue` de la map ; le countdown de 30s démarre dès le **premier** joueur inscrit
2. À 4 joueurs → `tryStartRace()` immédiat (countdown annulé). À expiration du countdown : si ≥2 joueurs → démarre avec ce qu'il y a ; si 1 seul → countdown relancé pour 30s de plus (pas de course solo)
3. `tryStartRace()` crée l'`ActiveRace` (`enemies` extrait via `extractEnemiesFromGrid`), émet `duel_start` à chacun avec `opponents` = les autres joueurs du groupe
4. Chaque client → `join_race({race_id})` → rejoint `race:${race_id}` ; la course démarre (`race.started=true`) quand `room.size === race.players.size` ; démarre aussi `enemy_tick_timer` (`setInterval` 400ms : `stepEnemy()` sur chaque ennemi, détection collision avec les joueurs vivants, `game_state` broadcasté)
5. `player_input` → mouvement serveur-autoritaire ; **collision ennemie vérifiée à deux endroits** : ici (juste après la mise à jour de `player.position`) et dans le tick ennemi (étape 4). Nécessaire dans les deux sens — sinon un joueur qui marche sur la case d'un ennemi entre deux ticks (400ms) n'est jamais détecté si l'ennemi a déjà bougé au tick suivant (bug corrigé le 2026-07-07, cf. `backend_doc/duel-server-authoritative-enemies.md`). EXIT atteint (si pas de collision) → `player.finished=true` + `finish_time`, **la course ne se termine pas pour les autres** (`isRaceOver()` = tous `finished || !alive`)
6. `isRaceOver()` vrai → `finishRace()` calcule le classement (`buildRanking()` : finishers triés par `duration_ms` croissant, puis non-finishers par `death_time` décroissant) et émet `race_finished` avec `RaceResult.ranking`
7. `disconnect` pendant une course active (joueur encore vivant/pas fini) → délai de grâce **10000ms** — `RacePlayer.connected=false` + `setTimeout` → `resolvePlayerLoss()` si toujours déconnecté à expiration ; annulé si le même `user.id` rejoint via `join_race` avant. **Ne termine plus toute la course** : seul ce joueur est résolu, `isRaceOver()` décide de la suite. Désinscription du lobby en attente : toujours immédiate, sans délai.
8. `player_died` (event client) **supprimé du protocole** — toute collision ennemie est détectée côté serveur (étape 5), plus jamais signalée par le client

**Limite lobby :** max 3 maps simultanées par socket (inchangé) ; max 4 joueurs par course

Docs de référence : `backend_doc/duel-nplayer-lobby-and-race-lifecycle.md`,
`backend_doc/duel-server-authoritative-enemies.md`,
`backend_doc/duel-reconnection-grace-period.md` (superseded, voir note en tête de fichier).

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
- Affiche le lobby global : par map, `{{count}}/4 inscrits` + `Départ dans {{seconds}}s` (dérivé de `LobbyEntry.countdown_ends_at`, re-rendu chaque seconde via un tick local)
- Hook `useDuelLobby` gère la connexion Socket.IO et les events ; `myRegistrations` dérivé de `LobbyEntry.players.some(p => p.id === userId)`
- Bouton "S'inscrire" / "Inscrit" / "Complet" selon l'état (le bouton "Défier" 1v1 a disparu — c'est maintenant une file d'attente, pas un défi ciblé)

### DuelGamePage (`frontend/src/pages/duel/DuelGamePage.tsx`)
- Reçoit `DuelStartPayload` (`opponents[]`) via `location.state` (navigate depuis DuelPage)
- Crée un 2ème socket pour le jeu (séparé du socket lobby)
- Crée `DuelScene` via Phaser après `game.events.once('ready')`, avec `opponent_sprites: Record<user_id,string>` résolu via `AVATAR_TO_SPRITE`
- `game_state` → `remote_states` (tous les adversaires) + `remote_enemies` émis vers Phaser ; si `me.alive === false` → `setMyAlive(false)` + `game.events.emit('i_died')` (sinon le joueur mort continue de bouger visuellement sans le savoir, cf. `backend_doc/duel-server-authoritative-enemies.md`)
- Overlay "En attente..." jusqu'à `game_state.started === true` ; "Terminé ! En attente des autres…" si le joueur local a fini ; "Éliminé ! En attente des autres…" si mort — dans les deux cas tant que `race_finished` n'est pas arrivé
- Overlay résultat : classement complet (`RaceResult.ranking`), victoire si `rank === 1`

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
- Mode duel (`/duel` + `/duel/game`) — Socket.IO temps réel, **2 à 4 joueurs**, ennemis serveur-autoritaires, reconnexion 10s, classement complet
- Admin : éditeur de niveaux de la tour dans EditorPage
- Scores : leaderboard par map, enregistrement après course solo

## Ce qui reste (branche actuelle : feature/multi-player-fair-play)
- Panel maps dans l'éditeur : affiché, delete fonctionnel (commit 924e5f2)
- Potentiel : persistance des scores en fin de duel (non implémentée côté duelHandler)
- RacePage (`/play/:map_id/race`) : encore placeholder
- `GameScene.ts` (solo) n'utilise pas `shared/game/enemyLogic.ts` — garde sa propre classe `entities/Enemy.ts`, ce qui est correct (pas de sync à assurer en solo) mais crée une duplication d'algorithme assumée (cf. `backend_doc/duel-server-authoritative-enemies.md`)

## /duel généralisé à 2-4 joueurs — implémenté (2026-07-07)
Docs de référence (mises à jour post-implémentation, avec les écarts par rapport à la version planifiée) :
- `backend_doc/duel-nplayer-lobby-and-race-lifecycle.md`
- `backend_doc/duel-server-authoritative-enemies.md`
- `frontend_doc/duel-nplayer-remote-rendering.md`
- `backend_doc/duel-reconnection-grace-period.md` (superseded — voir note en tête)
