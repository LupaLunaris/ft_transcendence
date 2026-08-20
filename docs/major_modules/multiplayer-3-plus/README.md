# Module: Multiplayer Game (More Than 2 Players)

For the Major Module: support more than two players in the same live game session.

**Points:** 2 · **Owner:** Martin

## Overview

Duel races are not fixed at 2 players — the same lobby, matchmaking, and race logic scale from 2 up to 4 players in a single race, with no separate "N-player mode" to maintain. A map's matchmaking queue fills as players join, a shared countdown decides when the race actually starts, and results are a full ranking (1st–4th) instead of a binary win/lose. This generalization is documented in detail in `docs/backend_doc/duel-nplayer-lobby-and-race-lifecycle.md`; this page summarizes it from the module's perspective.

## Stack

Same as [Real-Time Features](../realtime-features/README.md) — everything lives in `backend/src/socket/duelHandler.ts`, with the N-player-specific data structures being the lobby queue and the ranking builder.

## How it works

### Lobby: a queue, not a single slot

```ts
interface LobbyQueue {
  players: SocketUser[];             // 1 to MAX_RACE_PLAYERS (4), arrival order
  socket_ids: Map<string, string>;
  countdown_timer?: ReturnType<typeof setTimeout>;
  countdown_ends_at: number | null;
}
const MIN_RACE_PLAYERS = 2;
const MAX_RACE_PLAYERS = 4;
const LOBBY_COUNTDOWN_MS = 30_000;
```

`join_lobby` pushes the joining player into the map's queue. A 30-second countdown starts on the *first* registration; if the queue reaches 4 players before it expires, the race starts immediately instead of waiting out the timer:

```ts
if (queue.players.length >= MAX_RACE_PLAYERS) {
  void tryStartRace(map_id);
  return;
}
if (!queue.countdown_timer) {
  queue.countdown_ends_at = Date.now() + LOBBY_COUNTDOWN_MS;
  queue.countdown_timer = setTimeout(() => void tryStartRace(map_id), LOBBY_COUNTDOWN_MS);
}
```

If the countdown expires with only a single player queued, `tryStartRace` doesn't cancel their registration — it silently restarts a fresh 30-second window, so a player who explicitly chose a map is never bounced out just because nobody else joined in time:

```ts
if (queue.players.length < MIN_RACE_PLAYERS) {
  queue.countdown_ends_at = Date.now() + LOBBY_COUNTDOWN_MS;
  queue.countdown_timer = setTimeout(() => void tryStartRace(map_id), LOBBY_COUNTDOWN_MS);
  io.emit('lobby_state', { entries: getLobbyEntries() });
  return;
}
```

### Race start scales to however many joined

`join_race` waits for every registered player's socket to actually join the Socket.IO room before starting the clock — generalized to the queue's real size, not hardcoded to 2:

```ts
const room = io.sockets.adapter.rooms.get(`race:${race_id}`);
if (room && room.size === race.players.size && !race.started) {
  race.started = true;
  // start_time stamped for every player, enemy tick timer starts
}
```

### Results are a ranking, not win/lose

`RaceResult.ranking` always has exactly as many entries as there are players in the race, ordered by finish time, with non-finishers (dead or forfeited) trailing, ordered by how long they survived:

```ts
function buildRanking(race: ActiveRace): RaceRankingEntry[] {
  const finishers = players.filter(p => p.finished)
    .sort((a, b) => (a.finish_time! - a.start_time) - (b.finish_time! - b.start_time));
  const others = players.filter(p => !p.finished)
    .sort((a, b) => (b.death_time ?? Date.now()) - (a.death_time ?? Date.now()));
  return [...finishers, ...others].map((p, i) => ({ user_id: p.user.id, rank: i + 1, duration_ms: p.finished ? p.finish_time! - p.start_time : null, finished: p.finished }));
}
```

### The race only ends once *everyone* is resolved

With more than 2 players, "one player is gone" can no longer mean "the race is over" — 3 others might still be racing. `isRaceOver()` checks every player, and it's re-evaluated after *every* individual state change (a move reaching `EXIT`, an enemy collision, a reconnection timeout expiring):

```ts
function isRaceOver(race: ActiveRace): boolean {
  return Array.from(race.players.values()).every(p => p.finished || !p.alive);
}
```

This single change is what made the 2-player-only assumptions in the original implementation actually break at 3+ players until fixed — a forfeit or a death used to end the race outright because there was always exactly one opponent left; generalizing it to "check everyone" is what makes 3–4 player races behave correctly instead of ending prematurely when the second-place player merely loses.

### Reconnection also had to stop assuming "the last one standing wins"

At 2 players, a disconnect timeout meant "the other one wins" by definition. At 3–4 players, a timed-out disconnect only resolves *that* player — the race keeps going for whoever else is still in it:

```ts
if (player && !player.connected) {
  player.alive = false;
  player.death_time = Date.now();
  io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
  if (isRaceOver(race)) void finishRace(io, race); // only ends it if EVERYONE is now resolved
}
```

## Diagram

```text
join_lobby(map A) ──► queue=[P1]                         countdown 30s starts
join_lobby(map A) ──► queue=[P1,P2]                       (still counting)
join_lobby(map A) ──► queue=[P1,P2,P3]                     (still counting)
join_lobby(map A) ──► queue=[P1,P2,P3,P4] ──► MAX reached ──► tryStartRace() immediately

                              or, if only 2-3 ever join:
                              countdown expires (30s) ──► tryStartRace()
                                                             │
                                             ≥ MIN_RACE_PLAYERS (2)?
                                          yes ──────────────┴────────── no (1 player)
                                          │                              │
                              race created, ActiveRace                  countdown restarted
                              players.size = 2..4                       (no solo race)
                                          │
                       each player's game_state.players[] has length = players.size
                                          │
                       isRaceOver() waits for ALL of them (finished || !alive)
                                          │
                              race_finished: ranking.length === players.size
```

## Why this satisfies the module

- A single race genuinely supports 2, 3, or 4 simultaneous live players — not a 2-player mode duplicated or capped.
- Matchmaking (queue + countdown), state broadcast (`GameState.players[]`), and results (`ranking[]`) are all array-based and sized to the real player count, with no 2-player-specific shortcuts left in the ending logic.
- Verified against the failure mode that N-player support actually breaks in practice: the race no longer ends the instant one non-winning player is eliminated, and reconnection forfeits resolve only that player instead of always crowning "the other one."
