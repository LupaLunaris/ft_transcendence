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
- `GET/POST /maps` `GET/PUT/DELETE /maps/:id` `POST /maps/:id/complete` `POST /maps/:id/publish` `GET /maps/my`
- `GET /tower` `GET /tower/level/:order_index`
- `POST /scores/:map_id` `GET /scores/leaderboard/:map_id`

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
interface ClientToServerEvents {
  player_input: (data: { direction: Direction }) => void;
  join_lobby:   (data: { map_id: string }) => void;
  leave_lobby:  () => void;
}
interface ServerToClientEvents {
  game_state:    (state: GameState) => void;
  race_finished: (result: RaceResult) => void;
  player_joined: (player: PlayerState) => void;
  player_left:   (data: { player_id: string }) => void;
  error_event:   (data: { message: string; code: number }) => void;
}
```

---

## Architecture Phaser existante (solo mode — à connaître pour le multijoueur)

### BaseScene (`frontend/src/game/scenes/BaseScene.ts`)
- `TILE_SIZE = 36`
- `protected preloadTileAssets()` — charge les textures tuile
- `protected buildTilemap(grid: Grid)` — construit la carte (PNG ou fallback couleur)
- Autotiling des murs via `getWallFrame()`

### GameScene (`frontend/src/game/scenes/GameScene.ts`)
- Étend `BaseScene`
- Reçoit `{ grid, player_id }` via `create(data: GameSceneData)`
- Mouvement : tween 150ms case par case, accélération progressive → 60ms min
- Collision mur : vérification avant déplacement sur `grid[ny][nx]`
- Collision ennemi : vérifiée dans `onComplete` du tween et dans `moveEnemies()`
- Émissions Phaser→React : `this.game.events.emit('player_reached_exit', elapsed_ms)` et `this.game.events.emit('player_caught')`
- Ennemis : `HorizontalEnemy` / `VerticalEnemy` — tick toutes les 400ms via `time.addEvent`

### GameCanvas (`frontend/src/game/GameCanvas.tsx`)
- Props : `{ grid, player_id, onExit: (ms)=>void, onDeath?: ()=>void }`
- Crée `new Phaser.Game(config)` dans `useEffect`
- Ajoute `GameScene` via `game.scene.add('GameScene', GameScene, true, { grid, player_id })`
- Écoute `game.events.on('player_reached_exit', ...)` et `game.events.on('player_caught', ...)`
- Détruit le jeu au `return` du `useEffect`

### Sprites et assets (`frontend/src/game/assets.ts`)
- `KEY_SPRITE_PLAYER / ASSET_SPRITE_PLAYER` — spritesheet 200×320 px par frame
- `KEY_SPRITE_ENEMY_H / ASSET_SPRITE_ENEMY_H` — ennemi horizontal, 258×353 px
- `KEY_SPRITE_ENEMY_V / ASSET_SPRITE_ENEMY_V` — ennemi vertical, 258×353 px
- Scale des sprites : `setScale(0.20)`, origine `(0.5, 0.75)`

---

## Socket.IO — état actuel dans server.ts

Le fichier `backend/src/server.ts` exporte `io` mais n'a **aucun middleware d'auth** et **aucun handler de jeu** :

```ts
io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);
  socket.on('disconnect', (reason) => { ... });
});
export { io };
```

JwtUser est défini dans `backend/src/middleware/auth.middleware.ts` :
```ts
interface JwtUser { id: string; email: string; is_admin: boolean; }
```

---

## Sprint actuel : implémenter le mode multijoueur (Étape 5)

### Architecture cible

```
backend/src/
  server.ts                   ← MODIFIER : ajouter io.use() auth + registerRaceHandlers
  game/
    lobby.manager.ts           ← CRÉER
    race.state.ts              ← CRÉER
    race.handler.ts            ← CRÉER

frontend/src/
  hooks/useSocket.ts           ← CRÉER
  game/
    scenes/RaceScene.ts        ← CRÉER
    RaceCanvas.tsx             ← CRÉER
  pages/game/RacePage.tsx      ← MODIFIER (actuellement placeholder vide)
```

---

## Détail de chaque fichier à créer/modifier

### 1. `backend/src/server.ts` — ajouter auth Socket.IO + brancher handlers

Ajouter **avant** `io.on('connection')` :
```ts
import jwt from 'jsonwebtoken';
import { JwtUser } from './middleware/auth.middleware';
import { registerRaceHandlers } from './game/race.handler';

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtUser;
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});
```

Remplacer le bloc `io.on('connection')` par :
```ts
io.on('connection', (socket) => {
  const user = socket.data.user as JwtUser;
  console.log(`[socket] connected: ${socket.id} — ${user.email}`);
  registerRaceHandlers(io, socket, user);
  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
  });
});
```

Garder `export { io };` en bas.

---

### 2. `backend/src/game/race.state.ts` — état en mémoire d'une course

```ts
import { GameState, PlayerState, Position } from '@ft/shared';

export interface ActiveRace {
  race_id:    string;
  map_id:     string;
  grid:       number[][];           // grid_json parsé
  players:    Map<string, PlayerState>; // socket.id → PlayerState
  started_at: number;               // Date.now()
  finished:   boolean;
  winner_id:  string | null;
}

// Map race_id → ActiveRace
export const activeRaces = new Map<string, ActiveRace>();

// Map socket.id → race_id
export const socketToRace = new Map<string, string>();

// Lobby : map_id → socket.id[] (max 2)
export const lobbies = new Map<string, string[]>();
```

Fonctions utilitaires à exporter :
- `findSpawn(grid): Position` — parcourt la grille, retourne `{x:col, y:row}` de TILE.SPAWN (3)
- `toGameState(race: ActiveRace): GameState` — convertit ActiveRace en GameState pour broadcast
- `isWalkable(grid, x, y): boolean` — vérifie que la case est dans les bornes et !== TILE.WALL (1)

---

### 3. `backend/src/game/lobby.manager.ts` — gestion des salles

Exporte :
- `joinLobby(socketId, mapId, user, io, prisma): Promise<void>`
  1. Ajouter socketId dans `lobbies.get(mapId)` (créer si absent)
  2. Si 1 joueur → émettre `player_joined` aux autres dans la room `map_id`
  3. Si 2 joueurs → démarrer la race via `startRace(socketId[], mapId, io, prisma)`

- `startRace(socketIds, mapId, io, prisma): Promise<void>`
  1. Charger la map depuis DB : `prisma.map.findUnique({ where: { id: mapId } })`
  2. Parser `grid_json` : `JSON.parse(map.grid_json) as number[][]`
  3. Créer un `ActiveRace` avec uuid() comme `race_id`
  4. Placer les deux joueurs sur SPAWN : `position = findSpawn(grid)`
  5. Stocker dans `activeRaces` et `socketToRace`
  6. Faire rejoindre la room Socket.IO : `io.in(socketId).socketsJoin(race_id)`
  7. Émettre `game_state` à la room : `io.to(race_id).emit('game_state', toGameState(race))`

- `leaveLobby(socketId, io): void`
  1. Retrouver la race ou le lobby via `socketToRace`
  2. Retirer le joueur, émettre `player_left` aux autres
  3. Si race en cours → déclarer l'autre gagnant

---

### 4. `backend/src/game/race.handler.ts` — handlers socket par connexion

```ts
import { Server, Socket } from 'socket.io';
import { JwtUser } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

export function registerRaceHandlers(io: Server, socket: Socket, user: JwtUser): void {
  socket.on('join_lobby', async ({ map_id }) => {
    await joinLobby(socket.id, map_id, user, io, prisma);
  });

  socket.on('leave_lobby', () => {
    leaveLobby(socket.id, io);
  });

  socket.on('player_input', ({ direction }) => {
    // 1. Retrouver la race via socketToRace
    // 2. Retrouver le PlayerState du joueur
    // 3. Calculer nx, ny selon direction
    // 4. Vérifier isWalkable(grid, nx, ny) — si non : ignorer
    // 5. Mettre à jour position et direction dans race.players
    // 6. Vérifier si nx,ny === TILE.EXIT (2) → appeler finishRace()
    // 7. Incrémenter race.tick
    // 8. Émettre game_state à la room
  });

  socket.on('disconnect', () => {
    leaveLobby(socket.id, io);
  });
}
```

Fonction `finishRace(race, winnerId, io, prisma)` :
1. `race.finished = true; race.winner_id = winnerId`
2. Calculer `duration_ms = Date.now() - race.started_at`
3. Trouver `loser_id` = l'autre joueur
4. Émettre `race_finished` à la room : `io.to(race.race_id).emit('race_finished', { winner_id, loser_id, duration_ms, map_id, created_at: new Date().toISOString() })`
5. Persister en DB :
   ```ts
   await prisma.score.create({ data: { user_id: winnerId, map_id: race.map_id, completion_time_ms: duration_ms } });
   await prisma.user.update({ where: { id: winnerId }, data: { diamonds: { increment: 1 } } });
   ```
6. Nettoyer : supprimer de `activeRaces`, `socketToRace`, `lobbies`

---

### 5. `frontend/src/hooks/useSocket.ts` — hook Socket.IO client

```ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@ft/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(): AppSocket {
  const socketRef = useRef<AppSocket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io({
      auth: { token: localStorage.getItem('ft_token') ?? '' },
      autoConnect: true,
    });
  }

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef.current;
}
```

---

### 6. `frontend/src/game/scenes/RaceScene.ts` — scène Phaser multijoueur

Étend `BaseScene`. Reçoit `{ grid, localPlayerId }` via `create()`.

Différences par rapport à GameScene :
- **Pas de mouvement local** : le joueur ne déplace pas son sprite lui-même. Il envoie `player_input` au serveur via un callback.
- **Plusieurs sprites joueurs** : un sprite par `PlayerState` dans `game_state.players`.
- **Mise à jour depuis game_state** : méthode publique `applyGameState(state: GameState)` appelée depuis RaceCanvas quand un event `game_state` est reçu.
- **Animation direction** : lire `player.direction` depuis GameState pour jouer `walk_${direction}` ou `idle_${direction}`.
- **Pas d'ennemis côté serveur dans GameState** (non inclus dans le type) → les ennemis tournent en local dans RaceScene comme dans GameScene (même timer 400ms). C'est correct car tous les clients ont la même grille et même logique déterministe.
- Émissions Phaser→React : `this.game.events.emit('race_input', direction)` quand une touche est pressée.

Structure de données interne :
```ts
private playerSprites = new Map<string, Phaser.GameObjects.Sprite>(); // user.id → sprite
private grid: Grid = [];
private localPlayerId = '';
```

`applyGameState(state: GameState)`:
- Pour chaque player dans state.players : créer le sprite s'il n'existe pas, le déplacer (tween 80ms vers la nouvelle position pixel)
- Supprimer les sprites des joueurs absents de state.players
- Si `state.finished = true` : émettre `this.game.events.emit('race_over')`

Gestion input dans `update()` :
- Detecter touche pressée (curseurs ou WASD), ignorer si `isMoving`
- Émettre `this.game.events.emit('race_input', direction)` — **ne pas bouger localement**

---

### 7. `frontend/src/game/RaceCanvas.tsx` — composant Phaser multijoueur

Props : `{ grid, localPlayerId, socket, onRaceFinished: (result: RaceResult) => void }`

Structure :
```tsx
export function RaceCanvas({ grid, localPlayerId, socket, onRaceFinished }: RaceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Créer Phaser.Game avec RaceScene
    // Écouter game.events.on('race_input', (dir) => socket.emit('player_input', { direction: dir }))
    // Écouter game.events.on('race_over', () => { ... })
    // Écouter socket.on('game_state', (state) => { scene.applyGameState(state) })
    // Écouter socket.on('race_finished', (result) => onRaceFinished(result))
    return () => { game.destroy(true); }
  }, []);

  return <div ref={containerRef} ... />;
}
```

Invariant : accéder à la scène via `game.scene.getScene('RaceScene') as RaceScene` pour appeler `applyGameState()`.

---

### 8. `frontend/src/pages/game/RacePage.tsx` — page de course (actuellement placeholder)

Flux :
1. Récupérer `map_id` depuis `useParams`
2. Appeler `useSocket()` pour obtenir le socket
3. `useEffect` → `socket.emit('join_lobby', { map_id })` au montage
4. Écouter `socket.on('game_state', ...)` → si `state.started` → afficher `RaceCanvas`
5. Écouter `socket.on('player_joined', ...)` → afficher "En attente d'un adversaire..." ou "Adversaire connecté !"
6. Écouter `socket.on('race_finished', result)` → afficher écran de résultat (gagnant/perdant, diamonds)
7. `useEffect` cleanup → `socket.emit('leave_lobby')`

---

## Invariants à respecter absolument

- **Jamais de logique Phaser dans les composants React** — RaceCanvas est le seul point de contact
- **Phaser→React** uniquement via `this.game.events.emit()` — pas d'EventBus externe
- **React→Phaser** uniquement via méthodes publiques de la scène (`scene.applyGameState()`)
- **TypeScript strict, jamais de `any`**
- **Headers 42** : `backend/src/game/*` → jdebrull ; `frontend/src/game/*` → malafont ; `frontend/src/pages/game/*` → malafont ; `frontend/src/hooks/*` → jpaulis
- **Erreurs API** : `{ error: string, code: number }` — `sendError(res, msg, code)` déjà disponible
- **Socket events** : snake_case, exactement ceux définis dans `socket.types.ts`
- **Position** dans PlayerState : `{ x: col, y: row }` (même convention que gridX/gridY dans GameScene)

## État du déploiement
- Docker fonctionne (`make docker-up`)
- PostgreSQL connecté, migrations appliquées
- Frontend accessible sur http://localhost:5173
- Backend accessible sur http://localhost:3001
- Proxy Vite → backend via `BACKEND_INTERNAL_URL=http://backend:3001` (docker-compose.yml)
- Inscription/login fonctionnels (testé via curl)
