
import Phaser from 'phaser';
import { TILE, GRID_SIZE, type Grid } from '@ft/shared';
import {
  KEY_TILE_FLOOR, KEY_TILE_WALL, KEY_TILE_EXIT,
  ASSET_TILE_FLOOR, ASSET_TILE_WALL, ASSET_TILE_EXIT,
  KEY_TILE_WALL_SHEET, ASSET_TILE_WALL_SHEET,
} from '../assets';

export const TILE_SIZE = 36;

// ─── Fallback couleurs (utilisées quand la texture PNG est absente) ───────────

const TILE_COLORS: Record<number, number> = {
  [TILE.EMPTY]:   0x2a2a3e,
  [TILE.WALL]:    0x5c3d8f,
  [TILE.EXIT]:    0x00e5a0,
  [TILE.SPAWN]:   0x2a2a3e, // même couleur que le sol — invisible en jeu
  [TILE.ENEMY_H]: 0x2a2a3e, // case ennemi dessinée comme sol (ennemi par-dessus)
  [TILE.ENEMY_V]: 0x2a2a3e,
};

// ─── Mapping tuile → clé texture Phaser ──────────────────────────────────────
// Les cases ENEMY sont rendues comme le sol : l'ennemi (sprite) est superposé.

const TILE_TEXTURE_KEYS: Record<number, string> = {
  [TILE.EMPTY]:   KEY_TILE_FLOOR,
  [TILE.WALL]:    KEY_TILE_WALL,
  [TILE.EXIT]:    KEY_TILE_EXIT,
  [TILE.SPAWN]:   KEY_TILE_FLOOR,
  [TILE.ENEMY_H]: KEY_TILE_FLOOR,
  [TILE.ENEMY_V]: KEY_TILE_FLOOR,
};

// ─── Scène abstraite ──────────────────────────────────────────────────────────

export abstract class BaseScene extends Phaser.Scene {

  // ── Helpers de chargement ─────────────────────────────────────────────────

  // À appeler dans preload() de la scène concrète avant de charger
  // les assets spécifiques (joueur, ennemis).
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

	if (!N && !S && !E && !W)  return 6; // isolé
	if (!N && (E || W))        return 0; // bord nord
	if (!S && (E || W))        return 3; // bord sud
	if (N && E && !NE)         return 1; // coin NE intérieur
	if (N && W && !NW)         return 2; // coin NW intérieur
	if (S && E && !SE)         return 4; // coin SE intérieur
	if (S && W && !SW)         return 5; // coin SW intérieur
	return 0;                            // mur plein
  }

  // ── Construction de la carte ──────────────────────────────────────────────

  // Pour chaque tuile :
  //   - Si la texture est chargée → this.add.image (PNG)
  //   - Sinon → graphics.fillRect avec la couleur de fallback (aucun crash)
  // Les cases ENEMY_H / ENEMY_V sont rendues comme le sol.
  // Les sprites ennemis sont placés par-dessus dans GameScene.spawnEnemies().
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

	// Lignes de grille légères — toujours dessinées pour la lisibilité
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
