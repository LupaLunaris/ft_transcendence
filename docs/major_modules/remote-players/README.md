# Module: Remote Players

For the Major Module: two (or more) players can play the same game from two different computers, over the network, with correctly synchronized state.

**Points:** 2 · **Owner:** Martin

## Overview

Duel mode is played by real, separate clients — different browsers on different machines, each with its own JWT session, its own Socket.IO connection, and its own instance of `DuelScene`. Each client renders itself as the controllable player and every opponent as a "ghost": a distinct, correctly-skinned, labeled sprite whose position is driven entirely by what the server reports, not by anything the opponent's own browser claims locally. The interesting engineering problem here isn't drawing a second sprite — it's making sure that what Client A sees of Client B is trustworthy even under real network conditions (latency, packet reordering, brief disconnects), which is why this module leans directly on the server-authoritative design from [Real-Time Features](../realtime-features/README.md).

## Stack

Same transport as [Real-Time Features](../realtime-features/README.md) — Socket.IO + JWT. The remote-player-specific pieces live in `frontend/src/game/scenes/DuelScene.ts` and `frontend/src/pages/duel/DuelGamePage.tsx`.

## How it works

### Each opponent gets its own texture and animation set

A naive approach would load one player spritesheet and tint/reuse it per opponent. That breaks in Phaser: an animation is bound to the texture it was created against, so a shared animation set always plays the *first* texture it was registered with, regardless of which sprite calls `.play()`. `DuelScene` therefore loads a dedicated texture per opponent id and registers a full walk/idle × 4-direction animation set per opponent:

```ts
function opponentTextureKey(id: string): string { return `sprite_opponent_${id}`; }

for (const opponent of data.opponents) {
  const key = opponentTextureKey(opponent.id);
  const sprite = this.add.sprite(spawnPx, spawnPy, key).setAlpha(0.55).setTint(0x66aaff);
  const label = this.add.text(spawnPx, spawnPy - TILE_SIZE, opponent.username, { fontSize: '10px', color: '#99ccff' });
  // ... registers remote_walk_<id>_<dir> / remote_idle_<id>_<dir> against `key` ...
  this.remotes.set(opponent.id, { sprite, label, gridX: this.gridX, gridY: this.gridY, moving: false, lastDir: 'down' });
}
```

Ghosts are semi-transparent and blue-tinted with a floating username label, so they're visually unambiguous against the local player even with several opponents on screen at once. See `docs/frontend_doc/duel-remote-ghost-sprite-identity.md` for the full rationale.

### Rendering a remote position update

`handleRemoteStates()` receives every opponent's `PlayerState` (position, direction, alive, finished) from React on each `game_state` broadcast and tweens the matching ghost toward its new tile:

```ts
private handleRemoteStates(states: PlayerState[]): void {
  for (const state of states) {
    const ghost = this.remotes.get(state.id);
    if (!ghost || (state.position.x === ghost.gridX && state.position.y === ghost.gridY)) continue;

    ghost.sprite.anims.play(`remote_walk_${state.id}_${state.direction}`, true);
    if (ghost.moving) { ghost.sprite.setPosition(targetX, targetY); continue; } // catch up instantly if still animating
    ghost.moving = true;
    this.tweens.add({ targets: [ghost.sprite, ghost.label], x: targetX, y: targetY, duration: 140,
      onComplete: () => { ghost.moving = false; ghost.sprite.anims.play(`remote_idle_${state.id}_${ghost.lastDir}`); } });
  }
}
```

A dead or finished opponent simply stops producing new positions server-side, so the ghost naturally freezes — no special-casing needed on the rendering side.

### Fairness across two different machines

The reason enemy movement was moved server-side (see `docs/backend_doc/duel-server-authoritative-enemies.md`) is specifically a remote-players concern: two independent browsers simulating the same "deterministic" bounce logic can still drift apart from clock skew or a delayed animation frame, meaning a player could be caught by an enemy on their own screen while it looks like empty space on their opponent's. Making the server the sole simulator and pushing positions to both clients removes that class of bug entirely — what Client A sees of Client B (and of every enemy) is *what actually happened*, not a local guess.

### A remote player's own death has to be told, not inferred

Local movement is predictive — the player's own sprite tweens immediately on keypress, without waiting for server confirmation, for responsiveness. But once the server marks that player `alive: false` (enemy collision, detected server-side), it silently stops acting on their `player_input` — nothing in that silence tells the client it has lost. `DuelGamePage.tsx` watches `game_state` for `me.alive === false` and explicitly signals Phaser:

```ts
// DuelGamePage.tsx — on game_state
if (!me.alive) { setMyAlive(false); game.events.emit('i_died'); }
```

```ts
// DuelScene.ts
private handleIDied(): void { this.finished = true; } // reuses the same input-freeze gate as reaching EXIT
```

Without this explicit event, the local player kept animating and moving on their own screen indefinitely after a server-confirmed death, with no visual indication they'd lost until the final ranking appeared — a bug caught during 3-player testing, documented in `docs/backend_doc/duel-server-authoritative-enemies.md`.

### Surviving real network conditions

Two remote machines don't share a network path, so a brief Wi-Fi drop or tab reload on one client shouldn't instantly end the race for the other. `duelHandler.ts` gives a disconnected player a 10-second grace window (`DISCONNECT_GRACE_MS`) before marking them forfeited, keyed by `user_id` rather than `socket_id` so a reconnecting client resumes its exact in-race state (position, `alive`, `finished`) on a brand-new socket:

```ts
socket.on('disconnect', () => {
  if (race && player.socket_id === socket.id && player.alive && !player.finished) {
    player.connected = false;
    player.disconnect_timer = setTimeout(() => {
      if (!race.players.get(user_id)?.connected) resolvePlayerLoss(io, race, user_id);
    }, DISCONNECT_GRACE_MS);
  }
});
```

Full detail in `docs/backend_doc/duel-reconnection-grace-period.md`.

## Diagram

```text
Machine A (browser)                                             Machine B (browser)
┌───────────────────────────┐                                  ┌───────────────────────────┐
│ DuelScene                 │                                  │ DuelScene                 │
│  localPlayer  (controlled)│         Socket.IO server         │  localPlayer  (controlled)│
│  remotes["B"] ◄───────────┼──── game_state (authoritative) ──┼───────────► remotes["A"]  │
│  (ghost, tinted, labeled) │◄──── stepEnemy() tick (400ms) ───┼──────────── (ghost)        │
└───────────────────────────┘         (single source of         └───────────────────────────┘
                                        truth for enemies
                                        and every player)
```

## Why this satisfies the module

- Two clients on two different machines/browsers, each with an independent session, genuinely play the same live race — not a split-screen or same-process simulation.
- Remote state is rendered from server-pushed data only; the local client never fabricates or predicts an opponent's position.
- Handles the network realities of remote play explicitly: reconnection grace period, and an explicit "you died" signal so a client's own screen never lies about the outcome of a fight that happened on the server.
- Distinguishes each remote player visually (per-opponent texture, tint, username label) so a race with several remote participants stays readable.
