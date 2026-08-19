
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

// ─── Scene constants ────────────────────────────────────────────────────────

const FRAME_RATE = 8;  // walk animation fps


// WARNING THIS COMMENT IS NOT HERE BY MISTAKE - Do not delete
// for hero player

// ─── Player ───────────────────────────────────────────────────────────────────

// const FRAME_W = 900;
// const FRAME_H = 900;
// const SCALE_PLAYER = 0.12
// const ANIM_FRAMES: Record<Direction, { walk: number[]; idle: number }> = {
// 	down: { walk: [3, 2, 1, 0], idle: 4 },
// 	left: { walk: [5, 6, 7, 8], idle: 9 },
// 	right: { walk: [3, 2, 1, 0], idle: 4 },
// 	up: { walk: [10, 11, 12, 13], idle: 14 },
// };

// WARNING THIS COMMENT IS NOT HERE BY MISTAKE - Do not delete
// for martin/jen player
const FRAME_W = 200;
const FRAME_H = 320;
const SCALE_PLAYER = 0.2;
const ANIM_FRAMES: Record<Direction, { walk: number[]; idle: number }> = {
	down: { walk: [0,1,2,1], idle: 0 },
	left: { walk: [6, 7, 8, 7], idle: 7 },
	right: { walk: [3, 4, 5, 4], idle: 4 },
	up: { walk: [9, 10, 9, 11], idle: 9 },
};

// NOTE: the layout comments below may not be accurate — recheck against
// the final enemy_h.png / enemy_v.png sheet.
// ─── Enemies ──────────────────────────────────────────────────────────────────
// Layout enemy_h.png / enemy_v.png (4 cols × 4 rows):
//   Row 0 (frames  0– 3) → down   Row 1 (frames  4– 7) → left
//   Row 2 (frames  8–11) → right  Row 3 (frames 12–15) → up

const ENEMY_FRAME_W   = 240;  // 962px / 4 columns (floor — 2px lost on right edge)
const ENEMY_H_FRAME_H = 343;  // 1375px / 4 rows   (floor — 3px lost on bottom edge)
const ENEMY_V_FRAME_H = 343;

const ENEMY_ANIM_FRAMES: Record<Direction, number[]> = {
	down: [1, 3, 2, 1, 3],
	left: [4, 6, 5, 4, 6],
	right: [1, 3, 2, 1, 3],
	up: [12, 13, 14, 15],
};

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
	// Phaser calls init() before preload() — this is where we capture the sprite.

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

		// Locate the SPAWN tile.
		for (let row = 0; row < GRID_SIZE; row++) {
			for (let col = 0; col < GRID_SIZE; col++) {
				if (data.grid[row][col] === TILE.SPAWN) {
					this.gridX = col;
					this.gridY = row;
				}
			}
		}

		// Create the sprite centered on the SPAWN tile.
		const spawnPixelX = this.gridX * TILE_SIZE + TILE_SIZE / 2;
		const spawnPixelY = this.gridY * TILE_SIZE + TILE_SIZE / 2;

		this.player = this.add.sprite(spawnPixelX, spawnPixelY, KEY_SPRITE_PLAYER);

		this.player.setScale(SCALE_PLAYER);
		this.player.setCrop(5, 5, FRAME_W - 15 , FRAME_H -10)
		this.player.setOrigin(0.5, 0.70)  // anchor at 3/4 height → feet at the bottom of the tile
		this.player.setDepth(10 + this.gridY);



		// Register animations (walk + idle × 4 directions).
		// anims.exists() prevents errors if the scene is restarted.
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
		// Idle facing camera at spawn (Row 2 = 'down' = facing forward).
		this.player.anims.play('idle_down');
		this.spawnEnemies(data.grid);

		this.cameras.main.setBounds(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
		// Instant follow — lerp (0.1) combined with pixelArt+roundPixels
		// causes a 1px jump during the tween → ghosting into the adjacent tile.
		this.cameras.main.startFollow(this.player, true);

		// Keyboard.
		this.cursors = this.input.keyboard!.createCursorKeys();
		this.wasd = {
			up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
			down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
			left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
			right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
		};

		this.registerTouchInput();
		this.startTime = this.time.now;
	}

	// ── update ───────────────────────────────────────────────────────────────────
	// Called ~60x per second. Ignored during a tween (isMoving = true).

	update(_time: number, _delta: number): void {
		if (this.finished || this.isMoving) return;

		const left = this.cursors.left.isDown || this.wasd.left.isDown || this.touchState.left;
		const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchState.right;
		const up = this.cursors.up.isDown || this.wasd.up.isDown || this.touchState.up;
		const down = this.cursors.down.isDown || this.wasd.down.isDown || this.touchState.down;

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
	// Checks collision → updates the logical position → starts the tween.
	// EXIT detection happens in onComplete (player visually arrived).

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

				// Progressive acceleration: shortens moveDuration while the key
				// stays pressed, down to the 60ms floor.
				const stillPressed =
					(dir === 'left' && (this.cursors.left.isDown || this.wasd.left.isDown || this.touchState.left)) ||
					(dir === 'right' && (this.cursors.right.isDown || this.wasd.right.isDown || this.touchState.right)) ||
					(dir === 'up' && (this.cursors.up.isDown || this.wasd.up.isDown || this.touchState.up)) ||
					(dir === 'down' && (this.cursors.down.isDown || this.wasd.down.isDown || this.touchState.down));
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
	// Walks the grid, creates an animated Sprite per ENEMY_H / ENEMY_V tile
	// (colored Rectangle as fallback if the PNG is missing), then starts the timer.

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

					// Registers walk animations × 4 directions for this enemy type.
					// The key is prefixed with 'key' to avoid H/V conflicts.
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
		fast: 150,
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
	// Called on each enemy tick (interval set by enemySpeed). Moves each enemy,
	// plays the walk animation matching its direction, then checks collision
	// with the player.

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

	// -- shutdown ----------------------------------------------------------------
	shutdown(): void {
  		this.unregisterTouchInput();
	}
}
