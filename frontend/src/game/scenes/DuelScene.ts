import Phaser from 'phaser';
import {
  TILE, GRID_SIZE, extractEnemiesFromGrid,
  type Grid, type Direction, type PlayerState, type EnemyState,
} from '@ft/shared';
import { BaseScene, TILE_SIZE } from './BaseScene';
import {
  KEY_SPRITE_PLAYER,
  KEY_SPRITE_ENEMY_H, ASSET_SPRITE_ENEMY_H,
  KEY_SPRITE_ENEMY_V, ASSET_SPRITE_ENEMY_V,
  DEFAULT_PLAYER_SPRITE,
} from '../assets';
import { type EnemyGameObject } from '../entities/Enemy';

// ─── Constantes ───────────────────────────────────────────────────────────────

const FRAME_RATE = 8;
const FRAME_W = 200;
const FRAME_H = 320;
const SCALE_PLAYER = 0.2;
const SPRITE_DEPTH_BASE = 10;
const LABEL_DEPTH_OFFSET = 0.5;

const ANIM_FRAMES: Record<Direction, { walk: number[]; idle: number }> = {
  down:  { walk: [0, 1, 2, 1], idle: 0 },
  left:  { walk: [6, 7, 8, 7], idle: 7 },
  right: { walk: [3, 4, 5, 4], idle: 4 },
  up:    { walk: [9, 10, 9, 11], idle: 9 },
};

const ENEMY_FRAME_W = 240;
const ENEMY_FRAME_H = 343;

const ENEMY_ANIM_FRAMES: Record<Direction, number[]> = {
  down:  [1, 3, 2, 1, 3],
  left:  [4, 6, 5, 4, 6],
  right: [1, 3, 2, 1, 3],
  up:    [12, 13, 14, 15],
};

// ─── Data passed to the scene ─────────────────────────────────────────────────

export interface DuelSceneData {
  grid:             Grid;
  my_id:            string;
  my_username:      string;
  my_sprite?:       string;
  // 1 to 3 opponents (2 to 4 player race) + sprite URL per id.
  opponents:        { id: string; username: string; avatar: string | null }[];
  opponent_sprites: Record<string, string>;
  /** Integer camera zoom — the touch layout renders its square view at 2x. */
  camera_zoom?:     number;
}

// ─── Opponent ghost ───────────────────────────────────────────────────────────
// An opponent = a dedicated texture + a dedicated animation set (cf.
// frontend_doc/duel-remote-ghost-sprite-identity.md): a Phaser animation keeps
// its original texture even when played on a different sprite, so there's no
// way to share a single animation set across opponents with distinct skins.

interface RemoteGhost {
  sprite:  Phaser.GameObjects.Sprite;
  label:   Phaser.GameObjects.Text;
  gridX:   number;
  gridY:   number;
  moving:  boolean;
  lastDir: Direction;
}

function opponentTextureKey(id: string): string {
  return `sprite_opponent_${id}`;
}

function depthForGridY(gridY: number): number {
  return SPRITE_DEPTH_BASE + gridY;
}

// ─── DuelScene ────────────────────────────────────────────────────────────────

export class DuelScene extends BaseScene {

  // ── Sprite URL resolved from the local player's avatar ────────────────────
  private playerSpriteUrl = DEFAULT_PLAYER_SPRITE;
  private opponents: DuelSceneData['opponents'] = [];
  private opponentSpriteUrls: Record<string, string> = {};

  // ── Local player ──────────────────────────────────────────────────────────
  private grid:          Grid     = [];
  private gridX         = 0;
  private gridY         = 0;
  private localPlayer!: Phaser.GameObjects.Sprite;
  private cursors!:     Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up:    Phaser.Input.Keyboard.Key;
    down:  Phaser.Input.Keyboard.Key;
    left:  Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private isMoving      = false;
  private finished      = false;
  private lastDirection: Direction = 'down';
  private moveDuration  = 150;

  // ── Remote opponents (1 to 3) ─────────────────────────────────────────────
  private remotes = new Map<string, RemoteGhost>(); // key = opponent user_id

  // ── Enemies (positions driven by the server, cf. duelHandler.ts) ──────────
  private enemySprites = new Map<string, EnemyGameObject>();

  constructor() {
    super({ key: 'DuelScene' });
  }

  // ── init ──────────────────────────────────────────────────────────────────

  init(data: DuelSceneData): void {
    if (data.my_sprite) this.playerSpriteUrl = data.my_sprite;
    this.opponents = data.opponents;
    this.opponentSpriteUrls = data.opponent_sprites;
  }

  // ── preload ───────────────────────────────────────────────────────────────

  preload(): void {
    this.preloadTileAssets();
    this.load.spritesheet(KEY_SPRITE_ENEMY_H, ASSET_SPRITE_ENEMY_H, {
      frameWidth:  ENEMY_FRAME_W,
      frameHeight: ENEMY_FRAME_H,
    });
    this.load.spritesheet(KEY_SPRITE_ENEMY_V, ASSET_SPRITE_ENEMY_V, {
      frameWidth:  ENEMY_FRAME_W,
      frameHeight: ENEMY_FRAME_H,
    });
    if (!this.textures.exists(KEY_SPRITE_PLAYER)) {
      this.load.spritesheet(KEY_SPRITE_PLAYER, this.playerSpriteUrl, {
        frameWidth:  FRAME_W,
        frameHeight: FRAME_H,
      });
    }
    for (const opponent of this.opponents) {
      const key = opponentTextureKey(opponent.id);
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, this.opponentSpriteUrls[opponent.id] ?? DEFAULT_PLAYER_SPRITE, {
          frameWidth:  FRAME_W,
          frameHeight: FRAME_H,
        });
      }
    }
  }

  // ── create ────────────────────────────────────────────────────────────────

  create(data: DuelSceneData): void {
    this.grid     = data.grid;
    this.finished = false;
    this.isMoving = false;
    this.lastDirection = 'down';

    this.buildTilemap(data.grid);

    // Find the SPAWN tile
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (data.grid[row][col] === TILE.SPAWN) {
          this.gridX = col;
          this.gridY = row;
        }
      }
    }

    const spawnPx = this.gridX * TILE_SIZE + TILE_SIZE / 2;
    const spawnPy = this.gridY * TILE_SIZE + TILE_SIZE / 2;

    // ── Local player animations (walk + idle × 4 directions) ─────────────────
    (Object.entries(ANIM_FRAMES) as [Direction, { walk: number[]; idle: number }][])
      .forEach(([dir, { walk, idle }]) => {
        if (!this.anims.exists(`walk_${dir}`)) {
          this.anims.create({
            key:       `walk_${dir}`,
            frames:    this.anims.generateFrameNumbers(KEY_SPRITE_PLAYER, { frames: walk }),
            frameRate: FRAME_RATE,
            repeat:    -1,
          });
        }
        if (!this.anims.exists(`idle_${dir}`)) {
          this.anims.create({
            key:       `idle_${dir}`,
            frames:    this.anims.generateFrameNumbers(KEY_SPRITE_PLAYER, { frames: [idle] }),
            frameRate: 1,
            repeat:    0,
          });
        }
      });

    // ── Local player sprite ───────────────────────────────────────────────────
    this.localPlayer = this.add.sprite(spawnPx, spawnPy, KEY_SPRITE_PLAYER);
    this.localPlayer.setScale(SCALE_PLAYER);
    this.localPlayer.setCrop(5, 5, FRAME_W - 15, FRAME_H - 10);
    this.localPlayer.setOrigin(0.5, 0.70);
    this.localPlayer.setDepth(depthForGridY(this.gridY));
    this.localPlayer.anims.play('idle_down');

    // ── Opponent ghosts (1 to 3), each with its own texture + anims ─────────
    for (const opponent of data.opponents) {
      const key = opponentTextureKey(opponent.id);

      const sprite = this.add.sprite(spawnPx, spawnPy, key);
      sprite.setScale(SCALE_PLAYER);
      sprite.setCrop(5, 5, FRAME_W - 15, FRAME_H - 10);
      sprite.setOrigin(0.5, 0.70);
      sprite.setDepth(depthForGridY(this.gridY));
      sprite.setAlpha(0.55);
      sprite.setTint(0x66aaff);

      const label = this.add.text(spawnPx, spawnPy - TILE_SIZE, opponent.username, {
        fontSize:   '10px',
        color:      '#99ccff',
        fontFamily: 'monospace',
      }).setOrigin(0.5, 1)
        .setDepth(depthForGridY(this.gridY) + LABEL_DEPTH_OFFSET)
        .setAlpha(0.85);

      (Object.entries(ANIM_FRAMES) as [Direction, { walk: number[]; idle: number }][])
        .forEach(([dir, { walk, idle }]) => {
          const walkKey = `remote_walk_${opponent.id}_${dir}`;
          const idleKey = `remote_idle_${opponent.id}_${dir}`;
          if (!this.anims.exists(walkKey)) {
            this.anims.create({
              key:       walkKey,
              frames:    this.anims.generateFrameNumbers(key, { frames: walk }),
              frameRate: FRAME_RATE,
              repeat:    -1,
            });
          }
          if (!this.anims.exists(idleKey)) {
            this.anims.create({
              key:       idleKey,
              frames:    this.anims.generateFrameNumbers(key, { frames: [idle] }),
              frameRate: 1,
              repeat:    0,
            });
          }
        });

      sprite.anims.play(`remote_idle_${opponent.id}_down`);
      this.remotes.set(opponent.id, {
        sprite, label,
        gridX: this.gridX, gridY: this.gridY,
        moving: false, lastDir: 'down',
      });
    }

    this.spawnEnemies(data.grid);

    // Camera follows the local player. Zoom first: the bounds clamping is
    // computed from the zoomed display size. Integer zoom only (cf. constants).
    this.cameras.main.setZoom(data.camera_zoom ?? 1);
    this.cameras.main.setBounds(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
    this.cameras.main.startFollow(this.localPlayer, true);

    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Listens for server updates (from React via game.events): opponent and
    // enemy positions, both driven by the server's authoritative tick
    // (cf. backend_doc/duel-server-authoritative-enemies.md).
    this.game.events.on('remote_states',  this.handleRemoteStates,  this);
    this.game.events.on('remote_enemies', this.handleRemoteEnemies, this);
    // Local movement is predictive (immediate tween, without waiting for
    // the server): without this explicit signal, the player keeps moving
    // visually after their server-side death even though their inputs are
    // already being ignored — cf. DuelGamePage.tsx `me.alive === false`.
    this.game.events.on('i_died', this.handleIDied, this);

    this.registerTouchInput();
    // Signals to React that the listeners above are ready: any game_state
    // emitted WHILE assets were still loading (preload) was silently lost
    // (no listener registered yet) — React then replays its last known
    // state to catch up. Without this, an opponent who finishes very fast
    // while this scene is still loading stays frozen at spawn forever on
    // this screen.
    this.game.events.emit('scene_ready');
  }

  // ── update ────────────────────────────────────────────────────────────────

  update(): void {
    if (this.finished || this.isMoving) return;

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown || this.touchState.left;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchState.right;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown || this.touchState.up;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown || this.touchState.down;

    if      (left)  this.tryMove(-1,  0, 'left');
    else if (right) this.tryMove( 1,  0, 'right');
    else if (up)    this.tryMove( 0, -1, 'up');
    else if (down)  this.tryMove( 0,  1, 'down');
    else {
      this.moveDuration = 150;
      const idleKey = `idle_${this.lastDirection}`;
      if (this.localPlayer.anims.currentAnim?.key !== idleKey) {
        this.localPlayer.anims.play(idleKey);
      }
    }
  }

  // ── tryMove ───────────────────────────────────────────────────────────────
  // Predictive client-side movement (immediate feedback); the server remains
  // the sole authority on enemy collision and actual EXIT arrival
  // (cf. duelHandler.ts `player_input`) — the client here only freezes its
  // own input once the EXIT tile is visually reached.

  private tryMove(dx: number, dy: number, dir: Direction): void {
    const nx = this.gridX + dx;
    const ny = this.gridY + dy;

    this.lastDirection = dir;
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
    if (this.grid[ny][nx] === TILE.WALL) return;

    this.isMoving = true;
    this.gridX    = nx;
    this.gridY    = ny;
    this.localPlayer.setDepth(depthForGridY(ny));

    this.localPlayer.anims.play(`walk_${dir}`, true);

    // Notify React to send it over the socket
    this.game.events.emit('emit_player_input', { direction: dir });

    this.tweens.add({
      targets:  this.localPlayer,
      x:        nx * TILE_SIZE + TILE_SIZE / 2,
      y:        ny * TILE_SIZE + TILE_SIZE / 2,
      duration: this.moveDuration,
      ease:     'Linear',
      onComplete: () => {
        this.isMoving = false;

        const stillPressed =
          (dir === 'left'  && (this.cursors.left.isDown  || this.wasd.left.isDown|| this.touchState.left))  ||
          (dir === 'right' && (this.cursors.right.isDown || this.wasd.right.isDown || this.touchState.right)) ||
          (dir === 'up'    && (this.cursors.up.isDown    || this.wasd.up.isDown || this.touchState.up))    ||
          (dir === 'down'  && (this.cursors.down.isDown  || this.wasd.down.isDown || this.touchState.down));
        if (stillPressed) this.moveDuration = Math.max(60, this.moveDuration - 15);

        if (this.grid[ny][nx] === TILE.EXIT && !this.finished) {
          this.finished = true;
        }
      },
    });
  }

  // ── handleIDied ───────────────────────────────────────────────────────────
  // Freezes local input: the server has already marked this player
  // `alive: false` (enemy collision or reconnection forfeit) and has been
  // ignoring their player_input since. Reuses the same gate as EXIT arrival
  // (`update()` ignores all input while `this.finished` is true).

  private handleIDied(): void {
    this.finished = true;
  }

  // ── handleRemoteStates ────────────────────────────────────────────────────
  // Receives each opponent's PlayerState from React and animates the
  // matching ghost toward its new position. A dead/finished opponent
  // naturally stops moving: the server no longer advances their position,
  // so no new value ever differs from the previous one.

  private handleRemoteStates(states: PlayerState[]): void {
    for (const state of states) {
      const ghost = this.remotes.get(state.id);
      if (!ghost) continue;

      const nx = state.position.x;
      const ny = state.position.y;

      ghost.lastDir = state.direction;

      if (nx === ghost.gridX && ny === ghost.gridY) continue;

      ghost.gridX = nx;
      ghost.gridY = ny;
      ghost.sprite.setDepth(depthForGridY(ny));
      ghost.label.setDepth(depthForGridY(ny) + LABEL_DEPTH_OFFSET);

      const targetX = nx * TILE_SIZE + TILE_SIZE / 2;
      const targetY = ny * TILE_SIZE + TILE_SIZE / 2;

      ghost.sprite.anims.play(`remote_walk_${state.id}_${state.direction}`, true);

      if (ghost.moving) {
        // Already moving: jump straight to the target
        ghost.sprite.setPosition(targetX, targetY);
        ghost.label.setPosition(targetX, targetY - TILE_SIZE);
        continue;
      }

      ghost.moving = true;
      this.tweens.add({
        targets:  [ghost.sprite, ghost.label],
        x: (target: Phaser.GameObjects.GameObject) => (target === ghost.label ? targetX : targetX),
        y: (target: Phaser.GameObjects.GameObject) => (target === ghost.label ? targetY - TILE_SIZE : targetY),
        duration: 140,
        ease:     'Linear',
        onComplete: () => {
          ghost.moving = false;
          ghost.sprite.anims.play(`remote_idle_${state.id}_${ghost.lastDir}`);
        },
      });
    }
  }

  // ── spawnEnemies ──────────────────────────────────────────────────────────
  // Creates only the visual sprites, at their spawn position defined by the
  // grid. Movement is no longer simulated locally: it's driven by the
  // server tick via handleRemoteEnemies() (cf. duelHandler.ts).

  private spawnEnemies(grid: Grid): void {
    this.enemySprites.clear();

    for (const enemy of extractEnemiesFromGrid(grid)) {
      const px  = enemy.x * TILE_SIZE + TILE_SIZE / 2;
      const py  = enemy.y * TILE_SIZE + TILE_SIZE / 2;
      const key = enemy.kind === 'horizontal' ? KEY_SPRITE_ENEMY_H : KEY_SPRITE_ENEMY_V;
      const fallbackColor = enemy.kind === 'horizontal' ? 0xe53935 : 0xff8c00;

      let obj: EnemyGameObject;

      if (this.textures.exists(key)) {
        const sprite = this.add.sprite(px, py, key)
          .setScale(0.2)
          .setCrop(15, 15, ENEMY_FRAME_W - 30, ENEMY_FRAME_H - 30)
          .setOrigin(0.5, 0.75)
          .setDepth(depthForGridY(enemy.y));

        (Object.entries(ENEMY_ANIM_FRAMES) as [Direction, number[]][]).forEach(([dir, frames]) => {
          const animKey = `${key}_walk_${dir}`;
          if (!this.anims.exists(animKey)) {
            this.anims.create({
              key:       animKey,
              frames:    this.anims.generateFrameNumbers(key, { frames }),
              frameRate: FRAME_RATE,
              repeat:    -1,
            });
          }
        });

        sprite.anims.play(`${key}_walk_down`);
        obj = sprite;
      } else {
        obj = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, fallbackColor)
          .setDepth(depthForGridY(enemy.y));
      }

      this.enemySprites.set(enemy.id, obj);
    }
  }

  // ── handleRemoteEnemies ───────────────────────────────────────────────────
  // Tweens each enemy sprite toward the position received from the server
  // (same cadence as the server tick, 400ms — cf. duelHandler.ts ENEMY_TICK_MS).

  private handleRemoteEnemies(enemies: EnemyState[]): void {
    for (const enemy of enemies) {
      const obj = this.enemySprites.get(enemy.id);
      if (!obj) continue;

      const targetX = enemy.position.x * TILE_SIZE + TILE_SIZE / 2;
      const targetY = enemy.position.y * TILE_SIZE + TILE_SIZE / 2;

      // The lower the Y row on screen, the more the sprite is drawn in front.
      // An enemy above the player therefore has a lower depth, while an
      // enemy below is drawn in front of the player.
      obj.setDepth(depthForGridY(enemy.position.y));

      if (obj instanceof Phaser.GameObjects.Sprite) {
        const key = enemy.kind === 'horizontal' ? KEY_SPRITE_ENEMY_H : KEY_SPRITE_ENEMY_V;
        const animKey = `${key}_walk_${enemy.direction}`;
        if (obj.anims.currentAnim?.key !== animKey) {
          obj.anims.play(animKey, true);
        }
      }

      this.tweens.add({
        targets:  obj,
        x:        targetX,
        y:        targetY,
        duration: 350,
        ease:     'Linear',
      });
    }
  }

  // ── shutdown ──────────────────────────────────────────────────────────────

  shutdown(): void {
    this.game.events.off('remote_states',  this.handleRemoteStates,  this);
    this.game.events.off('remote_enemies', this.handleRemoteEnemies, this);
    this.game.events.off('i_died',         this.handleIDied,         this);
    this.unregisterTouchInput();
  }
}