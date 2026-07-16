
import Phaser from 'phaser';
import { TILE, GRID_SIZE, type Grid, type Direction } from '@ft/shared';
import { BaseScene, TILE_SIZE } from './BaseScene';
import {
	KEY_SPRITE_PLAYER,
	KEY_SPRITE_ENEMY_H, ASSET_SPRITE_ENEMY_H,
	KEY_SPRITE_ENEMY_V, ASSET_SPRITE_ENEMY_V,
	DEFAULT_PLAYER_SPRITE,
} from '../assets';
import { type Enemy, HorizontalEnemy, VerticalEnemy, type EnemyGameObject } from '../entities/Enemy';

// ─── Constantes de la scène ───────────────────────────────────────────────────

const FRAME_RATE = 8;  // fps animation marche


//ATTENTION CE COMENTAIRE N"EST PAS LA PAR ERREUR- Ne pas suprimer
//pour player hero

// ─── Player ───────────────────────────────────────────────────────────────────

// const FRAME_W = 900;
// const FRAME_H = 900;
// const SCALE_PLAYER = 0.12
// const ANIM_FRAMES: Record<Direction, { walk: number[]; idle: number }> = {
// 	down: { walk: [3, 2, 1, 0], idle: 4 },//
// 	left: { walk: [5, 6, 7, 8], idle: 9 },//
// 	right: { walk: [3, 2, 1, 0], idle: 4 },
// 	up: { walk: [10, 11, 12, 13], idle: 14 },
// };

//ATTENTION CE COMENTAIRE N"EST PAS LA PAR ERREUR- Ne pas suprimer
//pour player martin/jen
const FRAME_W = 200;
const FRAME_H = 320;
const SCALE_PLAYER = 0.2;
const ANIM_FRAMES: Record<Direction, { walk: number[]; idle: number }> = {
	down: { walk: [0,1,2,1], idle: 0 },//
	left: { walk: [6, 7, 8, 7], idle: 7 },//
	right: { walk: [3, 4, 5, 4], idle: 4 },
	up: { walk: [9, 10, 9, 11], idle: 9 },
};

// //LES COMENTAIRE LAYOUT NE SONT PAS BON JE REMODIF QUAND VERSION FINAL
// // ─── Ennemis ──────────────────────────────────────────────────────────────────
// // Layout enemy_h.png / enemy_v.png (4 col × 4 rows) — à ajuster selon le PNG :
// //   Row 0 (frames  0– 3) → down   Row 1 (frames  4– 7) → left
// //   Row 2 (frames  8–11) → right  Row 3 (frames 12–15) → up

const ENEMY_FRAME_W   = 240;  // 962px / 4 colonnes  (floor — 2px perdus bord droit)
const ENEMY_H_FRAME_H = 343;  // 1375px / 4 rangées  (floor — 3px perdus bord bas)
const ENEMY_V_FRAME_H = 343;

const ENEMY_ANIM_FRAMES: Record<Direction, number[]> = {
	down: [1, 3, 2, 1, 3],
	left: [4, 6, 5, 4, 6],
	right: [1, 3, 2, 1, 3],
	up: [12, 13, 14, 15],
};

// // ─── Interface des données passées à la scène ─────────────────────────────────

// export interface GameSceneData {
// 	grid: Grid;
// 	player_id: string;
// }

// ─── GameScene ────────────────────────────────────────────────────────────────

export class GameScene extends BaseScene {
	private settings!: {
		enemySpeed: "slow" | "normal" | "fast";
		};
	private grid: Grid = [];
	private gridX = 0;
	private gridY = 0;
	private playerSpriteUrl = DEFAULT_PLAYER_SPRITE;

	private player!: Phaser.GameObjects.Sprite;

	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private wasd!: {
		up: Phaser.Input.Keyboard.Key;
		down: Phaser.Input.Keyboard.Key;
		left: Phaser.Input.Keyboard.Key;
		right: Phaser.Input.Keyboard.Key;
	};

	private enemies: Enemy[] = [];

	private startTime = 0;
	private finished = false;
	private isMoving = false;
	private lastDirection: Direction = 'down';
	private moveDuration = 150;

	constructor() {
		super({ key: 'GameScene' });
	}

	// ── init ─────────────────────────────────────────────────────────────────────
	// Phaser appelle init() avant preload() — c'est ici qu'on capture le sprite.

	init(data: { player_sprite?: string }): void {
		if (data.player_sprite) this.playerSpriteUrl = data.player_sprite;
	}

	// ── preload ──────────────────────────────────────────────────────────────────

	preload(): void {
		this.preloadTileAssets();
		this.load.spritesheet(KEY_SPRITE_ENEMY_H, ASSET_SPRITE_ENEMY_H, {
			frameWidth: ENEMY_FRAME_W,
			frameHeight: ENEMY_H_FRAME_H,
		});
		this.load.spritesheet(KEY_SPRITE_ENEMY_V, ASSET_SPRITE_ENEMY_V, {
			frameWidth: ENEMY_FRAME_W,
			frameHeight: ENEMY_V_FRAME_H,
		});
		if (!this.textures.exists(KEY_SPRITE_PLAYER)) {
			this.load.spritesheet(KEY_SPRITE_PLAYER, this.playerSpriteUrl, {
				frameWidth: FRAME_W,
				frameHeight: FRAME_H,
			});
		}
	}

	// ── create ───────────────────────────────────────────────────────────────────

	create(data: any): void {
		console.log("DATA RECEIVED:", data);
		console.log("DATA:", data);
		this.settings = data.settings ?? {
		enemySpeed: "normal",
		};
		this.grid = data.grid;
		this.finished = false;
		this.isMoving = false;
		this.lastDirection = 'down';

		this.buildTilemap(data.grid);

		// Localise la case SPAWN.
		for (let row = 0; row < GRID_SIZE; row++) {
			for (let col = 0; col < GRID_SIZE; col++) {
				if (data.grid[row][col] === TILE.SPAWN) {
					this.gridX = col;
					this.gridY = row;
				}
			}
		}

		// Crée le sprite centré sur la case SPAWN.
		const spawnPixelX = this.gridX * TILE_SIZE + TILE_SIZE / 2;
		const spawnPixelY = this.gridY * TILE_SIZE + TILE_SIZE / 2;

		this.player = this.add.sprite(spawnPixelX, spawnPixelY, KEY_SPRITE_PLAYER);

		// Scale 1, pas de crop : TILE_SIZE=36 = FRAME_W → sprite natif aligné exactement.
		// Débordement vertical résiduel : (64-36)/2 = 14px haut/bas → look RPG voulu.
		this.player.setScale(SCALE_PLAYER);
		this.player.setCrop(5, 5, FRAME_W - 15 , FRAME_H -10)
		this.player.setOrigin(0.5, 0.70)  // ancre au 3/4 → pieds au bas de la case
		this.player.setDepth(10 + this.gridY);



		// Enregistre les animations (walk + idle × 4 directions).
		// anims.exists() empêche les erreurs si la scène est redémarrée.
		(Object.entries(ANIM_FRAMES) as [Direction, { walk: number[]; idle: number }][])
			.forEach(([dir, { walk, idle }]) => {
				if (!this.anims.exists(`walk_${dir}`)) {
					this.anims.create({
						key: `walk_${dir}`,
						frames: this.anims.generateFrameNumbers(KEY_SPRITE_PLAYER, { frames: walk }),
						frameRate: FRAME_RATE,
						repeat: -1,
					});
				}
				if (!this.anims.exists(`idle_${dir}`)) {
					this.anims.create({
						key: `idle_${dir}`,
						frames: this.anims.generateFrameNumbers(KEY_SPRITE_PLAYER, { frames: [idle] }),
						frameRate: 1,
						repeat: 0,
					});
				}
			})

		console.log("SETTINGS:", this.settings);
		// Idle face caméra au spawn (Row 2 = 'down' = face).
		this.player.anims.play('idle_down');
		this.spawnEnemies(data.grid);

		this.cameras.main.setBounds(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
		// Suivi instantané — le lerp (0.1) combiné à pixelArt+roundPixels
		// provoque un saut d'1px pendant le tween → fantôme dans la case adjacente.
		this.cameras.main.startFollow(this.player, true);

		// Clavier.
		this.cursors = this.input.keyboard!.createCursorKeys();
		this.wasd = {
			up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
			down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
			left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
			right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
		};

		this.startTime = this.time.now;
	}

	// ── update ───────────────────────────────────────────────────────────────────
	// Appelée ~60x par seconde. Ignorée pendant un tween (isMoving = true).

	update(_time: number, _delta: number): void {
		if (this.finished || this.isMoving) return;

		const left = this.cursors.left.isDown || this.wasd.left.isDown;
		const right = this.cursors.right.isDown || this.wasd.right.isDown;
		const up = this.cursors.up.isDown || this.wasd.up.isDown;
		const down = this.cursors.down.isDown || this.wasd.down.isDown;

		if (left) this.tryMove(-1, 0, 'left');
		else if (right) this.tryMove(1, 0, 'right');
		else if (up) this.tryMove(0, -1, 'up');
		else if (down) this.tryMove(0, 1, 'down');
		else {
			this.moveDuration = 150;
			const idleKey = `idle_${this.lastDirection}`;
			if (this.player.anims.currentAnim?.key !== idleKey) {
				this.player.anims.play(idleKey);
			}
		}
	}

	// ── tryMove ──────────────────────────────────────────────────────────────────
	// Vérifie collision → met à jour la position logique → lance le tween.
	// La détection EXIT est dans onComplete (joueur visuellement arrivé).

	private tryMove(dx: number, dy: number, dir: Direction): void {
		const nx = this.gridX + dx;
		const ny = this.gridY + dy;

		this.lastDirection = dir;

		if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
		if (this.grid[ny][nx] === TILE.WALL) return;

		this.isMoving = true;
		this.gridX = nx;
		this.gridY = ny;
		this.player.setDepth(10 + this.gridY);

		this.player.anims.play(`walk_${dir}`, true);

		this.tweens.add({
			targets: this.player,
			x: nx * TILE_SIZE + TILE_SIZE / 2,
			y: ny * TILE_SIZE + TILE_SIZE / 2,
			duration: this.moveDuration,
			ease: 'Linear',
			onComplete: () => {
				this.isMoving = false;

				// Accélération progressive : raccourcit moveDuration si la touche
				// est toujours enfoncée, jusqu'au plafond bas de 60ms.
				const stillPressed =
					(dir === 'left' && (this.cursors.left.isDown || this.wasd.left.isDown)) ||
					(dir === 'right' && (this.cursors.right.isDown || this.wasd.right.isDown)) ||
					(dir === 'up' && (this.cursors.up.isDown || this.wasd.up.isDown)) ||
					(dir === 'down' && (this.cursors.down.isDown || this.wasd.down.isDown));
				if (stillPressed) {
					this.moveDuration = Math.max(60, this.moveDuration - 15);
				}

				const hitEnemyNow = this.enemies.some(
				e => e.gridX === nx && e.gridY === ny
				);

				if (hitEnemyNow && !this.finished) {
				this.finished = true;
				this.game.events.emit('player_caught');
				return;
				}

				if (this.grid[ny][nx] === TILE.EXIT) {
					this.finished = true;
					const elapsed = Math.floor(this.time.now - this.startTime);
					this.game.events.emit('player_reached_exit', elapsed);
				}
			},
		});
	}

	// ── spawnEnemies ─────────────────────────────────────────────────────────────
	// Parcourt la grille, crée un Sprite animé par case ENEMY_H / ENEMY_V
	// (Rectangle coloré en fallback si le PNG est absent), puis lance le timer.

	private spawnEnemies(grid: Grid): void {
		this.enemies = [];

		for (let row = 0; row < GRID_SIZE; row++) {
			for (let col = 0; col < GRID_SIZE; col++) {
				const tile = grid[row][col];
				if (tile !== TILE.ENEMY_H && tile !== TILE.ENEMY_V) continue;

				const px = col * TILE_SIZE + TILE_SIZE / 2;
				const py = row * TILE_SIZE + TILE_SIZE / 2;
				const key = tile === TILE.ENEMY_H ? KEY_SPRITE_ENEMY_H : KEY_SPRITE_ENEMY_V;
				const fallbackColor = tile === TILE.ENEMY_H ? 0xe53935 : 0xff8c00;

				let obj: EnemyGameObject;

				if (this.textures.exists(key)) {
					const sprite = this.add.sprite(px, py, key)
						.setScale(0.2)
						.setCrop(15, 15, ENEMY_FRAME_W - 30, ENEMY_H_FRAME_H - 30)
						.setOrigin(0.5, 0.75)
						.setDepth(10 + row);

					// Enregistre les animations walk × 4 directions pour ce type d'ennemi.
					// La clé est préfixée par 'key' pour éviter les conflits H/V.
					(Object.entries(ENEMY_ANIM_FRAMES) as [Direction, number[]][])
						.forEach(([dir, frames]) => {
							const animKey = `${key}_walk_${dir}`;
							if (!this.anims.exists(animKey)) {
								this.anims.create({
									key: animKey,
									frames: this.anims.generateFrameNumbers(key, { frames }),
									frameRate: FRAME_RATE,
									repeat: -1,
								});
							}
						});

					sprite.anims.play(`${key}_walk_down`);
					obj = sprite;
				} else {
					obj = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, fallbackColor)
						.setDepth(10 + row);
				}

				this.enemies.push(
					tile === TILE.ENEMY_H
						? new HorizontalEnemy(col, row, obj)
						: new VerticalEnemy(col, row, obj),
				);
			}
		}

		const speedMap = {
		slow: 800,
		normal: 400,
		fast: 100,
		};

		const delay = speedMap[this.settings.enemySpeed] ?? 400;

		this.time.removeAllEvents();
		this.time.addEvent({
		delay,
		loop: true,
		callback: () => this.moveEnemies(delay),
		});
	}

	// ── moveEnemies ──────────────────────────────────────────────────────────────
	// Appelée toutes les 400ms. Déplace chaque ennemi, joue l'animation de marche
	// correspondant à sa direction, puis vérifie la collision avec le joueur.

	private moveEnemies(duration: number): void {
		for (const enemy of this.enemies) {
			const next = enemy.computeNextPosition(this.grid);
			enemy.gridX = next.x;
			enemy.gridY = next.y;
			enemy.rect.setDepth(10 + enemy.gridY);

			this.tweens.add({
				targets: enemy.rect,
				x: next.x * TILE_SIZE + TILE_SIZE / 2,
				y: next.y * TILE_SIZE + TILE_SIZE / 2,
				duration: duration,
				ease: 'Linear',
			});
			if (enemy.rect instanceof Phaser.GameObjects.Sprite) {
				const key = enemy instanceof HorizontalEnemy ? KEY_SPRITE_ENEMY_H : KEY_SPRITE_ENEMY_V;
				const animKey = `${key}_walk_${enemy.lastDirection}`;
				if (enemy.rect.anims.currentAnim?.key !== animKey) {
					enemy.rect.anims.play(animKey, true);
				}
			}
		}

		const caught = this.enemies.some(
			e => e.gridX === this.gridX && e.gridY === this.gridY,
		);
		if (caught && !this.finished) {
			this.finished = true;
			this.game.events.emit('player_caught');
		}
	}
}