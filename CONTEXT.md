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
  id, email, username, password_hash, avatar?, xp Int=0, diamonds Int=0,
  tower_progress Int=0, created_maps_count Int=0, is_admin Boolean=false,
  created_at, updated_at
  maps Map[], scores Score[], achievements UserAchievement[], xp_events XpEvent[]
  friendships_sent Friendship[] @relation("FriendshipRequester")
  friendships_received Friendship[] @relation("FriendshipAddressee")
}
model Map {
  id, name, grid_json String (TEXT), published, creator_completed,
  difficulty String="EASY", play_count Int=0, creator_id FK→User,
  created_at, updated_at
  scores Score[]
}
model AdminMap { id, order_index Int @unique, name, grid_json String, created_at }
model Score {
  // Une seule ligne par (user, map) depuis le 17/07 : le record personnel
  // du joueur, plus un historique d'essais — cf. section scoring ci-dessous.
  id, completion_time_ms Int, user_id FK→User, map_id FK→Map, created_at, updated_at
  @@unique([user_id, map_id])
  @@index([map_id, completion_time_ms])
}
model UserAchievement {
  id, user_id FK→User (cascade), code String, unlocked_at
  @@unique([user_id, code])  @@index([user_id])
}
model XpEvent {
  id, user_id FK→User (cascade), action String, key String, xp Int, created_at
  @@unique([action, key])   // idempotence : un même (action, key) ne peut payer qu'une fois
  @@index([user_id])
}
model MapRankingPoints {
  // Points actuels d'un joueur sur une map (pas un historique) — recalculé
  // à chaque nouveau record personnel sur cette map, cf. section scoring.
  id, map_id FK→Map (cascade), user_id FK→User (cascade), points Int, updated_at
  @@unique([map_id, user_id])  @@index([user_id])  @@index([map_id])
}
model Friendship {
  id, created_at, requester_id FK→User, addressee_id FK→User
  @@unique([requester_id, addressee_id])  @@index([requester_id])  @@index([addressee_id])
}
```

### Gamification MVP (migration `20260717000000_add_gamification`, commit 5d5e5aa, PR #71 mergée 2026-07-17)
- `backend/src/services/gamification.service.ts` — XP et achievements
  - `XP_PER_LEVEL = 100` ; `getLevelFromXp(xp) = floor(xp / 100) + 1`
  - `AchievementCode = 'FIRST_ESCAPE' | 'FIRST_CREATOR' | 'EXPLORER'` (shared)
  - **Idempotence via contrainte unique** `XpEvent(action, key)` : `awardXpOnce()` tente d'abord `xpEvent.create`, si `P2002` (unique constraint) → renvoie l'état courant sans re-créditer. Donc rejouer un complete/publish/score ne double jamais l'XP.
  - `rewardPublicMapCompletion(tx, userId, mapId)` — `action='PUBLIC_MAP_COMPLETION'` key=`${userId}:${mapId}`, +20xp, débloque `FIRST_ESCAPE` ; si l'utilisateur a un score sur ≥5 maps publiées différentes (`score.groupBy(['map_id'])`) → débloque aussi `EXPLORER`
  - `rewardTestMapCompletion(tx, userId, mapId)` — `action='TEST_MAP_COMPLETION'` key=`${userId}:${mapId}`, +10xp, appelé quand le créateur termine sa propre map (`POST /maps/:id/complete`)
  - `rewardFirstMapPublication(tx, userId)` — `action='FIRST_MAP_PUBLICATION'` key=`userId` (donc une seule fois par user, pas par map), +15xp, débloque `FIRST_CREATOR`
  - Toutes les fonctions tournent dans la même transaction Prisma que l'action métier (`prisma.$transaction`) déclenchant la récompense — cf. `maps.routes.ts` (`/complete`, `/publish`) et `scores.routes.ts`
  - Les routes ne récompensent que la **première** occurrence : `/complete` vérifie `map.creator_completed` avant, `/publish` vérifie `map.published` avant, `/scores` ne récompense que si `map.published` — combiné à l'unicité `(action,key)`, double protection contre le double-crédit
- `RewardResult { xp_gained, xp_total, level, achievements_unlocked: UserAchievement[] }` (shared, `gamification.types.ts`) renvoyé en `reward?` par `POST /maps/:id/complete`, `POST /maps/:id/publish`, `POST /scores`
- `UserPublic` (shared) étendu : `xp: number`, `level: number`, `achievements: UserAchievement[]` — calculés à chaque réponse auth (`toUserPublic()` dans `auth.routes.ts` inclut `achievements: true`)
- `GET /users/:user_id` (profil public) renvoie aussi `xp`/`level`/`achievements`
- Frontend : `ProfilePage.tsx` affiche XP/LVL (2 tuiles ajoutées, grid passée à `sm:grid-cols-2 lg:grid-cols-5`) + une section badges (`ACHIEVEMENT_LABEL` map code→clé i18n `achievement.<key>`)
- `EditorPage.tsx` (publish) et `GamePage.tsx` (`handleExit`/complete) : après action réussie, si `reward.xp_gained > 0` ou `achievements_unlocked.length > 0` → toast XP + toast par achievement débloqué, puis `updateUser(await api.auth.getMe())` pour rafraîchir le contexte auth (best-effort, catch silencieux — le prochain chargement de profil rattrapera sinon)
- i18n : nouvelles clés `profile_page_xp`, `profile_page_level`, `profile_page_achievements`, `profile_page_no_achievements`, `toast_xp_gained`, `toast_achievement_unlocked`, `achievement.first_escape`, `achievement.first_creator`, `achievement.explorer` dans `en/fr/nl common.json`

### Scoring, points de classement et leaderboards (migration `20260717010000_add_scoring_points`, 2026-07-17)
Doc complète : `backend_doc/scoring-points-and-leaderboards.md`. Résumé :
- `Score` : `POST /scores` (solo) et `duelHandler.ts#finishRace` (duel, chaque joueur ayant atteint l'EXIT) appellent tous deux `backend/src/services/scoring.service.ts#upsertBestScore(tx, userId, mapId, ms)` — n'écrit que si c'est un nouveau record personnel ; sinon no-op.
- `MapRankingPoints` : `scoring.service.ts#recalculateMapPoints(tx, mapId)` relit le top 5 `Score` de la map et met à jour les points (5/4/3/2/1) à **chaque** nouveau record — pas de calcul à la volée en lecture, les leaderboards lisent directement cette table.
- Duel : `finishRace` (désormais `async`, appels `void finishRace(...)`) persiste les temps des finisseurs puis, si un joueur a `rank===1 && finished`, appelle `gamification.service.ts#rewardDuelVictory(tx, userId, raceId)` — `action='DUEL_VICTORY'` key=`${userId}:${raceId}` (répétable à chaque victoire, contrairement aux récompenses de map), +25xp, débloque `DUEL_CHAMPION`. Émis uniquement au vainqueur via le nouvel event socket `reward_earned` (pas dans `race_finished`, qui est identique pour toute la room).
- `AchievementCode` (shared) += `'DUEL_CHAMPION'`
- Nouvelles routes leaderboard : voir section Routes ci-dessous. `LeaderboardEntry` (shared, `leaderboard.types.ts`) : `{ rank, user_id, username, avatar, points, completion_time_ms? }` — `completion_time_ms` seulement sur le leaderboard d'une map précise (absent sur le global)
- Frontend : `frontend/src/components/leaderboard/Leaderboard.tsx` (composant unique réutilisé) + `frontend/src/hooks/useLeaderboard.ts` (`useMapLeaderboard`/`useGlobalLeaderboard`) — affiché à droite du canvas sur `GamePage`/`DuelGamePage` (classement de la map jouée) et à droite du contenu sur `TrainingPage`/`DuelPage` (classement global, toutes maps)
  - Affichage par ligne : si `entry.completion_time_ms !== undefined` → temps formaté (`leaderboard.time_value`), sinon → points (`leaderboard.points_value`). Donc **temps** sur le leaderboard d'une map (via `/leaderboard/:map_id/points`, qui malgré son nom lit désormais `Score` directement — top 5 par `completion_time_ms` asc, points recalculés positionnellement via `POINTS_BY_RANK`, exporté depuis `scoring.service.ts`), **points** sur le leaderboard global
  - `GET /scores/leaderboard/global` : plus de `take` — retourne **tous** les joueurs ayant au moins 1 point (pas seulement le top 5) — modifié le 2026-07-17 sur demande explicite
- **Bug corrigé le jour même** : `gamification.service.ts` catchait un P2002 (XP/achievement déjà accordé) puis continuait à interroger le même `tx` — dans Postgres, une transaction poursuivie après une requête en erreur est *aborted* (25P02) pour toute requête suivante, donc le rollback entier avalait aussi l'upsert du score fait juste avant dans la même transaction (replay d'une map déjà complétée → "score non enregistré"). Fix : `findUnique` de garde avant `create` au lieu de catch-and-continue. Cf. `history_debug/2026-07-17_score-not-saved-poisoned-transaction.md`. **Ne jamais catcher une erreur Prisma dans une transaction interactive pour continuer à interroger le même `tx`.**
- i18n : `leaderboard.map_title`, `leaderboard.global_title`, `leaderboard.points_value`, `leaderboard.time_value`, `leaderboard.empty`, `achievement.duel_champion`

## Routes API actives (/api/v1/)
- `POST /auth/register` `POST /auth/login` `GET /auth/me` `PUT /auth/profile` `POST /auth/avatar`
- `GET /maps` `POST /maps` `GET /maps/my` `GET /maps/:id` `PUT /maps/:id` `DELETE /maps/:id`
- `POST /maps/:id/complete` `POST /maps/:id/publish` `POST /maps/:id/unpublish`
- `GET /tower` `GET /tower/level/:order_index`
- `POST /scores` `GET /scores/leaderboard/global` `GET /scores/leaderboard/:map_id` `GET /scores/leaderboard/:map_id/points`
- `GET /users/:user_id` (profil public + achievements)
- `GET /admin/tower` `PUT /admin/tower/:order_index` ← admin seulement

**Notes routes :**
- `DELETE /maps/:id` : cascade sur scores, décrémente `created_maps_count`
- `POST /scores` : body `{ map_id, completion_time_ms }` (pas `/:map_id` dans l'URL) ; réponse inclut `reward?: RewardResult` si la map est publiée (cf. gamification MVP) — n'écrase `Score` que si c'est un nouveau record personnel (cf. scoring)
- `POST /maps/:id/complete` et `POST /maps/:id/publish` : réponse `{ ...MapData, reward? }` — `reward` absent si déjà complété/publié (pas de re-crédit)
- `GET /scores/leaderboard/global` : tous les joueurs, par somme de points de classement (toutes maps), sans limite — **déclarée avant** `/leaderboard/:map_id` dans `scores.routes.ts` (sinon `map_id` capturerait le littéral `global`, cf. `backend_doc/scoring-points-and-leaderboards.md`)
- `GET /scores/leaderboard/:map_id` : temps bruts (inchangée, mais naturellement dédupliquée par joueur depuis que `Score` est 1 ligne/joueur/map)
- `GET /scores/leaderboard/:map_id/points` : top 5 de cette map par points de classement
- `PUT /admin/tower/:order_index` : upsert, order_index 1–8

## Types partagés clés (shared/src/types/)

```ts
// user.types.ts
interface UserPublic {
  id, username, avatar: string | null,
  xp: number, level: number, achievements: UserAchievement[],   // ajouté par la gamification MVP
  diamonds, tower_progress, created_maps_count, is_admin, created_at
}

// gamification.types.ts (nouveau)
type AchievementCode = 'FIRST_ESCAPE' | 'FIRST_CREATOR' | 'EXPLORER' | 'DUEL_CHAMPION'
interface UserAchievement { code: AchievementCode; unlocked_at: string }
interface RewardResult { xp_gained, xp_total, level, achievements_unlocked: UserAchievement[] }

// leaderboard.types.ts (nouveau)
interface LeaderboardEntry { rank: number; user_id, username, avatar: string | null; points: number; completion_time_ms?: number }

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
  reward_earned: (reward: RewardResult) => void;   // vainqueur de duel uniquement, cf. scoring
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
- `creator_completed` reset : `PUT /maps/:id` remet `creator_completed=false` dès que `grid` change (`backend/src/routes/maps.routes.ts`). Empêche de republier une map modifiée sans l'avoir re-testée (flow : unpublish → edit grid → publish échouait sinon, cf. `history_debug/2026-07-16_creator-completed-reset-on-edit.md`). `handleSave` capture la réponse de `api.maps.update`/`create` et appelle `setCreatorCompleted(...)` pour que le bouton Publier reflète l'état sans reload.

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
- Backend accessible sur http://localhost:3001 (pas de port publié directement, passe par `waf`)
- Proxy Vite → `waf:8080` (ModSecurity/OWASP CRS) → `backend:3001` (`BACKEND_INTERNAL_URL=http://waf:8080` dans docker-compose.yml)
- Vault (AppRole) fournit `DATABASE_URL`/`JWT_SECRET` au backend au démarrage (`backend/src/bootstrap.ts`, appelé depuis `index.ts` avant tout import de `server.ts`)

### WAF (ModSecurity/OWASP CRS) — service `waf`
- Seul `nginx/modsec/modsecurity.conf` est monté dans le conteneur (`main.conf`, `crs-setup.conf`, `override.conf` du repo sont orphelins, non montés — `crs-setup.conf` contient d'ailleurs un typo `/etx/` qui le rendrait de toute façon cassé)
- Réglage des règles CRS **uniquement** via variables d'environnement du service `waf` dans `docker-compose.yml`, lues par `/docker-entrypoint.d/95-configure-rules.sh` + `configure-rules.v3.conf` de l'image
- `ALLOWED_METHODS=GET HEAD POST PUT DELETE OPTIONS` — **obligatoire**, sinon toute requête PUT/DELETE (sauvegarde/suppression de map, etc.) est bloquée 403 par la règle CRS 911100 (défaut : `GET HEAD POST OPTIONS` seulement). Bug rencontré et corrigé le 2026-07-16, cf. `history_debug/2026-07-16_waf-blocks-put-delete-maps.md`
- Si une nouvelle méthode HTTP est utilisée côté API (ex. PATCH), l'ajouter à `ALLOWED_METHODS`

---

## Fonctionnalités complètes (mise à jour 2026-07-17, branche `dev`)
- Auth (register/login/me/profile/avatar)
- Éditeur de maps (create/edit/delete/publish/unpublish/complete)
- Mode solo (`/play/:map_id`) — GameScene avec ennemis
- Mode tour (`/tower` + `/play/tower/:order_index`) — 8 niveaux AdminMap
- Mode duel (`/duel` + `/duel/game`) — Socket.IO temps réel, **2 à 4 joueurs**, ennemis serveur-autoritaires, reconnexion 10s, classement complet
- Admin : éditeur de niveaux de la tour dans EditorPage
- Scores : leaderboard par map, enregistrement après course solo
- Amis : `FriendsList` + `Friendship` model (requester/addressee, statut implicite par présence de la ligne — voir `frontend/src/components/friends/`, `backend/src/routes/users.routes.ts`)
- **Gamification MVP** (2026-07-17) : XP + niveaux + 3 achievements (`FIRST_ESCAPE`, `FIRST_CREATOR`, `EXPLORER`), affichés sur `ProfilePage` et via toasts sur `EditorPage`/`GamePage` — détails ci-dessus
- WAF (ModSecurity) : PUT/DELETE débloqués via `ALLOWED_METHODS` (fix 2026-07-16)

## Ce qui reste
- RacePage (`/play/:map_id/race`) : encore placeholder
- `GameScene.ts` (solo) n'utilise pas `shared/game/enemyLogic.ts` — garde sa propre classe `entities/Enemy.ts`, ce qui est correct (pas de sync à assurer en solo) mais crée une duplication d'algorithme assumée (cf. `backend_doc/duel-server-authoritative-enemies.md`)
- Persistance des scores en fin de duel et récompense de victoire : **implémentées** (2026-07-17), cf. section scoring ci-dessus et `backend_doc/scoring-points-and-leaderboards.md`

## /duel généralisé à 2-4 joueurs — implémenté (2026-07-07)
Docs de référence (mises à jour post-implémentation, avec les écarts par rapport à la version planifiée) :
- `backend_doc/duel-nplayer-lobby-and-race-lifecycle.md`
- `backend_doc/duel-server-authoritative-enemies.md`
- `frontend_doc/duel-nplayer-remote-rendering.md`
- `backend_doc/duel-reconnection-grace-period.md` (superseded — voir note en tête)
