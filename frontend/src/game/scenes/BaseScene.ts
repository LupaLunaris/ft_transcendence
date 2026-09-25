
import Phaser from 'phaser';
import { TILE, GRID_SIZE, type Grid, type Direction } from '@ft/shared';
import {
  KEY_TILE_FLOOR, KEY_TILE_WALL, KEY_TILE_EXIT,
  ASSET_TILE_FLOOR, ASSET_TILE_WALL, ASSET_TILE_EXIT,
  KEY_TILE_WALL_SHEET, ASSET_TILE_WALL_SHEET,
} from '../assets';
import { TILE_SIZE } from '../constants';

// TILE_SIZE now lives in a Phaser-free module so React can read it too
// (cf. game/constants.ts); re-exported here because the scenes, the entities
// and the editor already import it from this file.
export { TILE_SIZE };

// ─── Tile → Phaser texture key mapping ───────────────────────────────────────
// ENEMY tiles are rendered as floor: the enemy (sprite) is layered on top.

const TILE_TEXTURE_KEYS: Record<number, string> = {
  [TILE.EMPTY]:   KEY_TILE_FLOOR,
  [TILE.WALL]:    KEY_TILE_WALL,
  [TILE.EXIT]:    KEY_TILE_EXIT,
  [TILE.SPAWN]:   KEY_TILE_FLOOR,
  [TILE.ENEMY_H]: KEY_TILE_FLOOR,
  [TILE.ENEMY_V]: KEY_TILE_FLOOR,
};

// ─── Abstract scene ───────────────────────────────────────────────────────────

export abstract class BaseScene extends Phaser.Scene {

  // -- Touch input -------------------------------------------------------
  protected touchState: Record<Direction, boolean> = {
	up: false, down: false, left: false, right:false,
  };

  private handleTouchInput = (payload: { direction: Direction; pressed: boolean }): void => {
    this.touchState[payload.direction] = payload.pressed;
  };

  protected registerTouchInput(): void {
    this.game.events.on('touch_input', this.handleTouchInput, this);
  }

  protected unregisterTouchInput(): void {
    this.game.events.off('touch_input', this.handleTouchInput, this);
  }

  // ── Loading helpers ───────────────────────────────────────────────────────

  // Call from the concrete scene's preload() before loading
  // scene-specific assets (player, enemies).
  protected preloadTileAssets(): void {
	this.load.image(KEY_TILE_FLOOR, ASSET_TILE_FLOOR);
	this.load.image(KEY_TILE_WALL,  ASSET_TILE_WALL);
	this.load.image(KEY_TILE_EXIT,  ASSET_TILE_EXIT);
	this.load.spritesheet(KEY_TILE_WALL_SHEET, ASSET_TILE_WALL_SHEET,
	  { frameWidth: 32, frameHeight: 32 });
  }

  // ── Autotiling ────────────────────────────────────────────────────────────

  private getWallFrame(grid: Grid, col: number, row: number): number {
	const isWall = (r: number, c: number): boolean => {
	  if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return true;
	  return grid[r][c] === TILE.WALL;
	};

	const N  = isWall(row - 1, col);
	const S  = isWall(row + 1, col);
	const E  = isWall(row, col + 1);
	const W  = isWall(row, col - 1);
	const NE = isWall(row - 1, col + 1);
	const NW = isWall(row - 1, col - 1);
	const SE = isWall(row + 1, col + 1);
	const SW = isWall(row + 1, col - 1);

	if (!N && !S && !E && !W)  return 6; // isolated
	if (!N && (E || W))        return 0; // north edge
	if (!S && (E || W))        return 3; // south edge
	if (N && E && !NE)         return 1; // NE inner corner
	if (N && W && !NW)         return 2; // NW inner corner
	if (S && E && !SE)         return 4; // SE inner corner
	if (S && W && !SW)         return 5; // SW inner corner
	return 0;                            // solid wall
  }

  // ── Map construction ──────────────────────────────────────────────────────

  // For each tile:
  //   - If the texture is loaded → this.add.image (PNG)
  //   - Otherwise → graphics.fillRect with the fallback color (no crash)
  // ENEMY_H / ENEMY_V tiles are rendered as floor.
  // Enemy sprites are placed on top in GameScene.spawnEnemies().
  protected buildTilemap(grid: Grid): void {
	const graphics = this.add.graphics();

	for (let row = 0; row < GRID_SIZE; row++) {
	  for (let col = 0; col < GRID_SIZE; col++) {
		const tile       = grid[row][col];
		const textureKey = TILE_TEXTURE_KEYS[tile] ?? KEY_TILE_FLOOR;
		const px         = col * TILE_SIZE;
		const py         = row * TILE_SIZE;

		if (tile === TILE.WALL && this.textures.exists(KEY_TILE_WALL_SHEET)) {
		  if (this.textures.exists(KEY_TILE_FLOOR)) {
			this.add.image(px, py, KEY_TILE_FLOOR)
			  .setOrigin(0)
			  .setDisplaySize(TILE_SIZE, TILE_SIZE);
		  }
		  this.add.image(px, py, KEY_TILE_WALL_SHEET)
			.setOrigin(0)
			.setDisplaySize(TILE_SIZE, TILE_SIZE)
			.setFrame(this.getWallFrame(grid, col, row));
		} else if (this.textures.exists(textureKey)) {
		  this.add.image(px, py, textureKey)
			.setOrigin(0)
			.setDisplaySize(TILE_SIZE, TILE_SIZE);
		} else {
		  this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, 0x5b4a3a)
			.setOrigin(0);
		}
	  }
	}

	// Light grid lines — always drawn for readability
	graphics.lineStyle(1, 0x000000, 0.15);
	for (let i = 0; i <= GRID_SIZE; i++) {
	  graphics.strokeLineShape(
		new Phaser.Geom.Line(i * TILE_SIZE, 0, i * TILE_SIZE, GRID_SIZE * TILE_SIZE),
	  );
	  graphics.strokeLineShape(
		new Phaser.Geom.Line(0, i * TILE_SIZE, GRID_SIZE * TILE_SIZE, i * TILE_SIZE),
	  );
	}
  }
}
