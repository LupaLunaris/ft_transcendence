
import Phaser from 'phaser';
import { TILE, GRID_SIZE, type Grid, type Direction } from '@ft/shared';
import { TILE_SIZE } from '../scenes/BaseScene';

// ─── Type alias ───────────────────────────────────────────────────────────────

// Sprite when the texture is loaded, Rectangle as fallback.
// Both implement Transform → setPosition() without a cast.
export type EnemyGameObject = Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

// ─── Abstract class ─────────────────────────────────────────────────────────
//
// In C this would be a struct + a function pointer:
//   typedef struct s_enemy {
//     int grid_x, grid_y;
//     t_pos (*compute_next)(struct s_enemy *, Grid);
//   } t_enemy;
//
// In TypeScript: an abstract class with an abstract method.
// Each subclass MUST implement computeNextPosition().
// GameScene doesn't need to know which enemy type it's handling.

export abstract class Enemy {
  gridX: number;
  gridY: number;
  lastDirection: Direction = 'down';
  readonly rect: EnemyGameObject;

  constructor(gridX: number, gridY: number, rect: EnemyGameObject) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.rect  = rect;
  }

  // Called by GameScene on every timer tick.
  // Returns the next logical position this enemy wants to move to.
  // GameScene then decides whether the tile is walkable and updates
  // gridX/gridY + rect.setPosition().
  //
  // Parameters:
  //   grid — the full grid, to test for walls
  // Returns:
  //   { x, y } — the target tile (may be the current tile if blocked)
  abstract computeNextPosition(grid: Grid): { x: number; y: number };

  // Shared utility across all subclasses.
  // Checks that a tile is within the grid and is not a wall.
  protected canStepOn(grid: Grid, x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return false;
    return grid[y][x] !== TILE.WALL;
  }

  // Updates the Phaser graphical position after a validated move.
  // Called by GameScene once it has confirmed the move.
  applyPosition(): void {
    this.rect.setPosition(
      this.gridX * TILE_SIZE + TILE_SIZE / 2,
      this.gridY * TILE_SIZE + TILE_SIZE / 2,
    );
  }
}

// ─── Horizontal enemy ─────────────────────────────────────────────────────────
//
// Moves only along the X axis (dx = ±1, dy = 0).
// Bounces off walls: flips dx.
// Deterministic — no randomness.

export class HorizontalEnemy extends Enemy {
  private dx: 1 | -1;

  constructor(gridX: number, gridY: number, rect: EnemyGameObject) {
    super(gridX, gridY, rect);
    // Initial direction: right by default.
    // If the tile to the right is a wall from the start, it moves left instead.
    this.dx = 1;
  }

  computeNextPosition(grid: Grid): { x: number; y: number } {
    const nx = this.gridX + this.dx;

    if (this.canStepOn(grid, nx, this.gridY)) {
      this.lastDirection = this.dx === 1 ? 'right' : 'left';
      return { x: nx, y: this.gridY };
    }

    this.dx = this.dx === 1 ? -1 : 1;
    const nx2 = this.gridX + this.dx;

    if (this.canStepOn(grid, nx2, this.gridY)) {
      this.lastDirection = this.dx === 1 ? 'right' : 'left';
      return { x: nx2, y: this.gridY };
    }

    return { x: this.gridX, y: this.gridY };
  }
}

// ─── Vertical enemy ───────────────────────────────────────────────────────────
//
// Same logic as HorizontalEnemy but on the Y axis (dx = 0, dy = ±1).

export class VerticalEnemy extends Enemy {
  private dy: 1 | -1;

  constructor(gridX: number, gridY: number, rect: EnemyGameObject) {
    super(gridX, gridY, rect);
    this.dy = 1;
  }

  computeNextPosition(grid: Grid): { x: number; y: number } {
    const ny = this.gridY + this.dy;

    if (this.canStepOn(grid, this.gridX, ny)) {
      this.lastDirection = this.dy === 1 ? 'down' : 'up';
      return { x: this.gridX, y: ny };
    }

    this.dy = this.dy === 1 ? -1 : 1;
    const ny2 = this.gridY + this.dy;

    if (this.canStepOn(grid, this.gridX, ny2)) {
      this.lastDirection = this.dy === 1 ? 'down' : 'up';
      return { x: this.gridX, y: ny2 };
    }

    return { x: this.gridX, y: this.gridY };
  }
}
