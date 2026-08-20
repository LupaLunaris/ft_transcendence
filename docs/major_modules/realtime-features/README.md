# Module: Real-Time Features

For the Major Module: implement real-time, low-latency features using WebSockets (or an equivalent technology).

**Points:** 2 · **Owners:** Martin (gameplay logic), Jerem (Socket.IO backend infrastructure)

## Overview

All Duel gameplay — lobby matchmaking, race start, player movement, enemy movement, and race results — is driven by a single Socket.IO channel, authenticated with the same JWT used by the REST API. The server is the sole authority over game state: it validates every move, steps every enemy on a fixed tick, and broadcasts one consistent `game_state` to every client in the race. Clients never trust each other's local simulation for anything that affects the outcome of a race.

This module is implemented entirely in one file, `backend/src/socket/duelHandler.ts`, plus the shared event/payload contracts in `shared/src/types/socket.types.ts` and `shared/src/types/game.types.ts`.

## Stack

| Concern | Technology |
|---|---|
| Transport | [Socket.IO 4.7](https://socket.io) server (`backend/src/socket/duelHandler.ts`), Socket.IO client (`frontend/src/hooks/useDuelLobby.ts`, `DuelGamePage.tsx`) |
| Auth | JWT (`jsonwebtoken`), verified in a Socket.IO `io.use()` middleware before any event handler runs |
| Server state | In-memory `Map`s (`lobbies`, `activeRaces`, `socketRegs`, `socketRace`) — no DB round-trip needed on the hot path of a race |
| Shared contracts | `@ft/shared` — `ClientToServerEvents`, `ServerToClientEvents`, `Grid`, `Direction`, `GameState`, `stepEnemy()` |

## How it works

### Authenticating the socket

Every connection is authenticated once, before any handler is registered, by decoding the JWT sent in the handshake and loading the user from the database:

```ts
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) return next(new Error('Authentication required'));
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
  const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, username: true, avatar: true } });
  if (!user) return next(new Error('User not found'));
  socket.data.user = user;
  next();
});
```

### Event catalog

| Direction | Event | Purpose |
|---|---|---|
| Client → Server | `join_lobby` | Register for a map's matchmaking queue |
| Client → Server | `leave_lobby` | Unregister |
| Client → Server | `join_race` | Join the Socket.IO room for a race that has already been created |
| Client → Server | `player_input` | Move one tile in a direction |
| Server → Client | `lobby_state` | Full snapshot of every map's queue, broadcast to all connected sockets |
| Server → Client | `duel_start` | Race created — grid + opponents payload, sent only to the players in that race |
| Server → Client | `game_state` | Authoritative snapshot: every player's position/direction/alive/finished + every enemy's position, broadcast on every tick and every accepted move |
| Server → Client | `race_finished` | Final ranking |
| Server → Client | `error_event` | Rejected action (map not found, lobby full, already racing elsewhere, …) |

### Server-authoritative movement

`player_input` is deliberately minimal and defensive — it recomputes the move server-side rather than trusting client-reported positions:

```ts
socket.on('player_input', ({ direction }) => {
  const now = Date.now();
  if (player.last_input_at !== undefined && now - player.last_input_at < MIN_INPUT_INTERVAL_MS) return;
  player.last_input_at = now;

  const nx = x + dx, ny = y + dy;
  if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
  if (race.grid[ny][nx] === TILE.WALL) return;

  player.position = { x: nx, y: ny };
  // ... enemy-collision check, EXIT check, broadcast game_state ...
});
```

`MIN_INPUT_INTERVAL_MS = 60` matches the fastest tween the client can legitimately produce (see `DuelScene.moveDuration` floor). It exists specifically to reject a scripted `socket.emit` loop that bypasses the client's own pacing — a fairness fix documented in `history_debug/2026-08-14_faille-scores-forgeable.md`.

Enemies are simulated **only on the server**, on a fixed interval, and their positions are pushed to clients — not recomputed independently by each browser:

```ts
race.enemy_tick_timer = setInterval(() => {
  race.enemies = race.enemies.map(e => stepEnemy(e, race.grid));
  for (const p of race.players.values()) {
    if (!p.alive || p.finished) continue;
    if (race.enemies.some(e => e.x === p.position.x && e.y === p.position.y))
      resolvePlayerLoss(io, race, p.user.id);
  }
  if (!race.finished) io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
}, ENEMY_TICK_MS); // 400ms
```

`stepEnemy()` lives in `shared/src/game/enemyLogic.ts` specifically so the exact same deterministic bounce algorithm cannot drift between two independent implementations — see `docs/backend_doc/duel-server-authoritative-enemies.md` for the bug this prevented (a purely client-side simulation let two browsers see an enemy in slightly different places).

### Rooms scope the broadcast

Each race gets its own Socket.IO room, `race:${race_id}`, joined in the `join_race` handler. This is what lets `game_state` and `race_finished` be broadcast with a single `io.to(room).emit(...)` instead of iterating socket ids manually, and what keeps one race's traffic from leaking into another's.

## Diagram

```text
Client A                       Socket.IO Server                      Client B
   │                          (backend/src/socket/duelHandler.ts)        │
   │── join_lobby(map_id) ───────────►│                                  │
   │                                  │◄──────── join_lobby(map_id) ─────│
   │◄───────── lobby_state ───────────┤────────── lobby_state ──────────►│
   │                                  │  (30s countdown elapses,
   │                                  │   2-4 players queued)
   │◄───────── duel_start ────────────┤────────── duel_start ───────────►│
   │── join_race(race_id) ───────────►│◄───────── join_race(race_id) ────│
   │                                  │  both sockets in room
   │                                  │  race:${race_id} → race.started
   │── player_input(dir) ────────────►│
   │                                  │  validate move, check enemies
   │◄───────── game_state ────────────┤────────── game_state ───────────►│
   │                                  │◄─ enemy tick (setInterval 400ms) ─┤
   │◄───────── game_state ────────────┤────────── game_state ───────────►│
   │                                  │  isRaceOver() === true
   │◄───────── race_finished ─────────┤────────── race_finished ────────►│
```

## Why this satisfies the module

- Transport is WebSocket-based (Socket.IO) end to end, not polling.
- Every connection is authenticated before any gameplay event is accepted.
- Latency-sensitive state (player position, enemy position) is pushed to clients on every change (move or 400ms tick), not pulled.
- The server is the single source of truth: client-side movement is only ever a *prediction* rendered immediately for responsiveness (`DuelScene.tryMove`), while the actual outcome (collision, EXIT, ranking) is decided server-side and reconciled through `game_state`/`i_died` — see the [Remote Players module](../remote-players/README.md) for how this plays out across two separate machines.
