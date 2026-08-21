# Module: Complete Web Game

For the Major Module: build a complete game with clear rules, win/lose conditions, and a real game engine rather than a static prototype.

**Points:** 2 · **Owner:** Martin

## Overview

Guilds of the Deep is a top-down maze game: the player spawns on a 25×25 tile grid, must reach the exit tile while avoiding patrolling enemies, and either wins (reaches `EXIT`) or loses (touched by an enemy). Maps are authored by players in the built-in editor and played in three contexts that all share the same rendering and movement engine: solo (`GamePage` / `GameScene`), the Tower's predefined levels (`TowerGamePage`), and real-time Duel races against other players (`DuelGamePage` / `DuelScene`, see [Remote Players](../remote-players/README.md)).

The engine is real: tile-based collision, two distinct enemy movement patterns, sprite animation per facing direction, a scrolling camera, keyboard/touch dual input, and deterministic rules — not a scripted demo.

## Stack

| Concern | Technology |
|---|---|
| Game engine | [Phaser 3.80](https://phaser.io) |
| Grid model | `TileValue[][]`, 25×25, shared type from `@ft/shared` — `EMPTY`, `WALL`, `EXIT`, `SPAWN`, `ENEMY_H`, `ENEMY_V` |
| Scenes | `frontend/src/game/scenes/BaseScene.ts` (shared tilemap/autotiling/touch input), `GameScene.ts` (solo), `DuelScene.ts` (multiplayer) |
| Entities | `frontend/src/game/entities/Enemy.ts` — `HorizontalEnemy` / `VerticalEnemy` |
| Bridge to React | `this.game.events.emit(eventName, payload)` — Phaser → React communication, no separate event bus |

## How it works

### Grid and rendering

`BaseScene.buildTilemap()` walks the 25×25 grid once and places one tile image per cell (`36×36px`, `TILE_SIZE`), with a dedicated autotiling pass for walls (`getWallFrame`) that picks the correct sprite frame from 8-neighbor wall adjacency (isolated wall, edges, inner corners) so maze walls render as a continuous structure instead of repeated single tiles. `ENEMY_H`/`ENEMY_V` cells render as floor — the enemy itself is a separate sprite layered on top by `spawnEnemies()`.

### Movement: tile-stepped, not free-roaming

The player never moves by pixel — `tryMove(dx, dy, dir)` checks the target tile for bounds and `TILE.WALL`, then tweens the sprite from the current tile's center to the next one over `moveDuration` (starts at 150ms, accelerates down to a 60ms floor while a key is held):

```ts
private tryMove(dx: number, dy: number, dir: Direction): void {
  const nx = this.gridX + dx, ny = this.gridY + dy;
  if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
  if (this.grid[ny][nx] === TILE.WALL) return;

  this.isMoving = true;
  this.gridX = nx; this.gridY = ny;
  this.player.anims.play(`walk_${dir}`, true);
  this.tweens.add({ targets: this.player, x: nx * TILE_SIZE + TILE_SIZE / 2, y: ny * TILE_SIZE + TILE_SIZE / 2,
    duration: this.moveDuration, onComplete: () => { /* win/lose check below */ } });
}
```

`update()` is gated by `this.isMoving`, so a new move can't start mid-tween — input is sampled once per completed step, which is what keeps movement perfectly grid-aligned instead of drifting.

### Two enemy behaviors, one abstraction

`Enemy` is an abstract class with a single required method, `computeNextPosition(grid)`; `HorizontalEnemy` and `VerticalEnemy` implement deterministic bounce movement along their respective axis and flip direction when the next tile would be a wall:

```ts
computeNextPosition(grid: Grid): { x: number; y: number } {
  const nx = this.gridX + this.dx;
  if (this.canStepOn(grid, nx, this.gridY)) { this.lastDirection = this.dx === 1 ? 'right' : 'left'; return { x: nx, y: this.gridY }; }
  this.dx = this.dx === 1 ? -1 : 1;
  const nx2 = this.gridX + this.dx;
  if (this.canStepOn(grid, nx2, this.gridY)) { return { x: nx2, y: this.gridY }; }
  return { x: this.gridX, y: this.gridY }; // boxed in — stays put
}
```

`GameScene` doesn't need to know which subclass it's driving — `spawnEnemies()` instantiates one per `ENEMY_H`/`ENEMY_V` grid cell and `moveEnemies()` just calls `computeNextPosition()` on each, on a timer whose delay is set by the map's difficulty (`slow: 800ms`, `normal: 400ms`, `fast: 150ms`).

### Win / lose conditions

Both are checked at the same point — right after a move tween completes, so the check always runs against the player's true landed tile:

```ts
const hitEnemyNow = this.enemies.some(e => e.gridX === nx && e.gridY === ny);
if (hitEnemyNow && !this.finished) { this.finished = true; this.game.events.emit('player_caught'); return; }

if (this.grid[ny][nx] === TILE.EXIT) {
  this.finished = true;
  const elapsed = Math.floor(this.time.now - this.startTime);
  this.game.events.emit('player_reached_exit', elapsed);
}
```

Enemies can also catch the player between the player's own moves (an enemy stepping onto the player's current tile) — `moveEnemies()` runs the same collision check after every enemy tick. `this.finished` then blocks `update()` from accepting any further input, so the game genuinely stops rather than continuing to render input after the outcome is decided. `GamePage.tsx` listens for `player_caught` / `player_reached_exit` on `game.events` and renders the corresponding win/lose UI (`GameOverModal` / `CongratulatoryModal`) and records the run time.

### Animation and camera

Each direction has a `walk_<dir>` (looping) and `idle_<dir>` (single-frame) animation registered once per scene instance (`anims.exists()` guards against duplicate registration on scene restart). The camera locks to the grid bounds and follows the player with `startFollow(this.player, true)` — the `true` (instant, no lerp) is deliberate: a smoothed follow combined with pixel-art rounding produced a visible 1px ghosting jump during tweens.

## Diagram

```text
update()  (60x/sec, ignored while isMoving)
   │
   ├─ read input (keyboard + touch, first pressed direction wins)
   ▼
tryMove(dx, dy, dir)
   │
   ├─ bounds / TILE.WALL check ─── blocked → no-op
   ▼
tween sprite one tile (150ms → 60ms as key held)
   │
   ▼ onComplete
   ├─ enemy on landed tile? ──────► 'player_caught'  (lose)
   ├─ landed tile === EXIT? ──────► 'player_reached_exit' (win, elapsed time)
   └─ else: isMoving = false, wait for next input

   (in parallel, on a timer keyed by map difficulty)
enemy tick → computeNextPosition() per enemy → tween → collision check against player tile
```

## Why this satisfies the module

- Runs on a real game engine (Phaser), with scenes, sprites, animation, tweening and a scrolling camera — not a static page or a slideshow of states.
- Clear, deterministic rules: tile-based movement, wall collision, two distinct enemy movement patterns, a single exit tile.
- Explicit win condition (reach `EXIT`) and lose condition (enemy collision), both gating further input once triggered.
- The same engine (`BaseScene`, tile rendering, `Enemy` abstraction) is reused across solo play, the Tower, and real-time Duel — proof the "game" is a genuine reusable system, not a one-off demo scene.
