/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* DuelScene.ts                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/27 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/27 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import Phaser from 'phaser';
import { TILE, GRID_SIZE, type Grid, type Direction, type PlayerState } from '@ft/shared';
import { BaseScene, TILE_SIZE } from './BaseScene';
import {
  KEY_SPRITE_PLAYER,
  KEY_SPRITE_ENEMY_H, ASSET_SPRITE_ENEMY_H,
  KEY_SPRITE_ENEMY_V, ASSET_SPRITE_ENEMY_V,
  DEFAULT_PLAYER_SPRITE,
} from '../assets';
import { type Enemy, HorizontalEnemy, VerticalEnemy, type EnemyGameObject } from '../entities/Enemy';

// ─── Constantes ───────────────────────────────────────────────────────────────

const FRAME_RATE = 8;
const FRAME_W    = 200;
const FRAME_H    = 320;

const ANIM_FRAMES: Record<Direction, { walk: number[]; idle: number }> = {
  down:  { walk: [0, 2],    idle: 1  },
  left:  { walk: [6, 7, 8], idle: 7  },
  right: { walk: [3, 5],    idle: 4  },
  up:    { walk: [9, 10],   idle: 10 },
};

const ENEMY_FRAME_W = 240;
const ENEMY_FRAME_H = 343;

const ENEMY_ANIM_FRAMES: Record<Direction, number[]> = {
  down:  [0,  1,  2,  3],
  left:  [8,  9, 10, 11],
  right: [4,  5,  6,  7],
  up:    [12, 13, 14, 15],
};

// Clé locale à la scène : texture du sprite adverse, distincte de KEY_SPRITE_PLAYER
// pour que le fantôme affiche le skin de l'adversaire et non celui du joueur local.
const KEY_SPRITE_OPPONENT = 'sprite_opponent';

// ─── Data passée à la scène ───────────────────────────────────────────────────

export interface DuelSceneData {
  grid:            Grid;
  my_id:           string;
  my_username:     string;
  my_sprite?:      string;
  opponent_sprite?: string;
  opponent:        { id: string; username: string; avatar: string | null };
}

// ─── DuelScene ────────────────────────────────────────────────────────────────

export class DuelScene extends BaseScene {

  // ── Sprite URL résolue depuis l'avatar du joueur local / de l'adversaire ──
  private playerSpriteUrl = DEFAULT_PLAYER_SPRITE;
  private opponentSpriteUrl = DEFAULT_PLAYER_SPRITE;

  // ── Joueur local ──────────────────────────────────────────────────────────
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

  // ── Joueur distant ────────────────────────────────────────────────────────
  private remotePlayer!:  Phaser.GameObjects.Sprite;
  private remoteGridX    = 0;
  private remoteGridY    = 0;
  private remoteMoving   = false;
  private remoteLastDir: Direction = 'down';

  // ── Label pseudo adversaire ───────────────────────────────────────────────
  private remoteLabel!: Phaser.GameObjects.Text;

  // ── Ennemis ───────────────────────────────────────────────────────────────
  private enemies: Enemy[] = [];

  constructor() {
    super({ key: 'DuelScene' });
  }

  // ── init ──────────────────────────────────────────────────────────────────

  init(data: DuelSceneData): void {
    if (data.my_sprite) this.playerSpriteUrl = data.my_sprite;
    if (data.opponent_sprite) this.opponentSpriteUrl = data.opponent_sprite;
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
    if (!this.textures.exists(KEY_SPRITE_OPPONENT)) {
      this.load.spritesheet(KEY_SPRITE_OPPONENT, this.opponentSpriteUrl, {
        frameWidth:  FRAME_W,
        frameHeight: FRAME_H,
      });
    }
  }

  // ── create ────────────────────────────────────────────────────────────────

  create(data: DuelSceneData): void {
    this.grid     = data.grid;
    this.finished = false;
    this.isMoving = false;
    this.lastDirection = 'down';

    this.buildTilemap(data.grid);

    // Cherche le SPAWN
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (data.grid[row][col] === TILE.SPAWN) {
          this.gridX = col;
          this.gridY = row;
        }
      }
    }
    this.remoteGridX = this.gridX;
    this.remoteGridY = this.gridY;

    const spawnPx = this.gridX * TILE_SIZE + TILE_SIZE / 2;
    const spawnPy = this.gridY * TILE_SIZE + TILE_SIZE / 2;

    // ── Sprite joueur distant (fantôme bleuté, légèrement transparent) ──────
    this.remotePlayer = this.add.sprite(spawnPx, spawnPy, KEY_SPRITE_OPPONENT);
    this.remotePlayer.setScale(0.20);
    this.remotePlayer.setOrigin(0.5, 0.75);
    this.remotePlayer.setDepth(1);
    this.remotePlayer.setAlpha(0.55);
    this.remotePlayer.setTint(0x66aaff);

    this.remoteLabel = this.add.text(spawnPx, spawnPy - TILE_SIZE, data.opponent.username, {
      fontSize:   '10px',
      color:      '#99ccff',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(3).setAlpha(0.85);

    // ── Sprite joueur local ──────────────────────────────────────────────────
    this.localPlayer = this.add.sprite(spawnPx, spawnPy, KEY_SPRITE_PLAYER);
    this.localPlayer.setScale(0.20);
    this.localPlayer.setOrigin(0.5, 0.75);
    this.localPlayer.setDepth(2);

    // ── Animations (walk + idle × 4 directions) ──────────────────────────────
    // Une animation Phaser porte sa propre référence de texture (fixée à la
    // création) : il faut donc un jeu d'anims distinct par texture, sinon le
    // fantôme adverse affiche les frames du sprite local dès qu'on joue l'anim.
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
        if (!this.anims.exists(`remote_walk_${dir}`)) {
          this.anims.create({
            key:       `remote_walk_${dir}`,
            frames:    this.anims.generateFrameNumbers(KEY_SPRITE_OPPONENT, { frames: walk }),
            frameRate: FRAME_RATE,
            repeat:    -1,
          });
        }
        if (!this.anims.exists(`remote_idle_${dir}`)) {
          this.anims.create({
            key:       `remote_idle_${dir}`,
            frames:    this.anims.generateFrameNumbers(KEY_SPRITE_OPPONENT, { frames: [idle] }),
            frameRate: 1,
            repeat:    0,
          });
        }
      });

    this.localPlayer.anims.play('idle_down');
    this.remotePlayer.anims.play('remote_idle_down');

    this.spawnEnemies(data.grid);

    // Caméra suit le joueur local
    this.cameras.main.setBounds(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
    this.cameras.main.startFollow(this.localPlayer, true);

    // Clavier
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Écoute les mises à jour du joueur distant (depuis React via game.events)
    this.game.events.on('remote_state', this.handleRemoteState, this);
  }

  // ── update ────────────────────────────────────────────────────────────────

  update(): void {
    if (this.finished || this.isMoving) return;

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;

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

  private tryMove(dx: number, dy: number, dir: Direction): void {
    const nx = this.gridX + dx;
    const ny = this.gridY + dy;

    this.lastDirection = dir;
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
    if (this.grid[ny][nx] === TILE.WALL) return;

    this.isMoving = true;
    this.gridX    = nx;
    this.gridY    = ny;

    this.localPlayer.anims.play(`walk_${dir}`, true);

    // Notifie React pour l'envoi socket
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
          (dir === 'left'  && (this.cursors.left.isDown  || this.wasd.left.isDown))  ||
          (dir === 'right' && (this.cursors.right.isDown || this.wasd.right.isDown)) ||
          (dir === 'up'    && (this.cursors.up.isDown    || this.wasd.up.isDown))    ||
          (dir === 'down'  && (this.cursors.down.isDown  || this.wasd.down.isDown));
        if (stillPressed) this.moveDuration = Math.max(60, this.moveDuration - 15);

        const hitEnemy = this.enemies.some(
          e => e.gridX === this.gridX && e.gridY === this.gridY,
        );
        if (hitEnemy && !this.finished) {
          this.finished = true;
          this.game.events.emit('player_caught');
        }

        if (this.grid[ny][nx] === TILE.EXIT && !this.finished) {
          this.finished = true;
          this.game.events.emit('player_reached_exit');
        }
      },
    });
  }

  // ── handleRemoteState ─────────────────────────────────────────────────────
  // Reçoit le PlayerState de l'adversaire depuis React et l'anime vers sa
  // nouvelle position sur la grille.

  private handleRemoteState(state: PlayerState): void {
    const nx = state.position.x;
    const ny = state.position.y;

    this.remoteLastDir = state.direction;

    if (nx === this.remoteGridX && ny === this.remoteGridY) return;

    this.remoteGridX = nx;
    this.remoteGridY = ny;

    const targetX = nx * TILE_SIZE + TILE_SIZE / 2;
    const targetY = ny * TILE_SIZE + TILE_SIZE / 2;

    this.remotePlayer.anims.play(`remote_walk_${state.direction}`, true);

    if (this.remoteMoving) {
      // Déjà en mouvement : on saute directement à la cible
      this.remotePlayer.setPosition(targetX, targetY);
      this.remoteLabel.setPosition(targetX, targetY - TILE_SIZE);
      return;
    }

    this.remoteMoving = true;
    this.tweens.add({
      targets:  [this.remotePlayer, this.remoteLabel],
      x: (target: Phaser.GameObjects.GameObject) => {
        return target === this.remoteLabel ? targetX : targetX;
      },
      y: (target: Phaser.GameObjects.GameObject) => {
        return target === this.remoteLabel ? targetY - TILE_SIZE : targetY;
      },
      duration: 140,
      ease:     'Linear',
      onComplete: () => {
        this.remoteMoving = false;
        this.remotePlayer.anims.play(`remote_idle_${this.remoteLastDir}`);
      },
    });
  }

  // ── spawnEnemies ──────────────────────────────────────────────────────────

  private spawnEnemies(grid: Grid): void {
    this.enemies = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = grid[row][col];
        if (tile !== TILE.ENEMY_H && tile !== TILE.ENEMY_V) continue;

        const px           = col * TILE_SIZE + TILE_SIZE / 2;
        const py           = row * TILE_SIZE + TILE_SIZE / 2;
        const key          = tile === TILE.ENEMY_H ? KEY_SPRITE_ENEMY_H : KEY_SPRITE_ENEMY_V;
        const fallbackColor = tile === TILE.ENEMY_H ? 0xe53935 : 0xff8c00;

        let obj: EnemyGameObject;

        if (this.textures.exists(key)) {
          const sprite = this.add.sprite(px, py, key)
            .setScale(0.2)
            .setCrop(15, 15, ENEMY_FRAME_W - 30, ENEMY_FRAME_H - 30)
            .setOrigin(0.5, 0.75)
            .setDepth(2);

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
          obj = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, fallbackColor).setDepth(2);
        }

        this.enemies.push(
          tile === TILE.ENEMY_H
            ? new HorizontalEnemy(col, row, obj)
            : new VerticalEnemy(col, row, obj),
        );
      }
    }

    this.time.addEvent({
      delay:         400,
      loop:          true,
      callback:      this.moveEnemies,
      callbackScope: this,
    });
  }

  // ── moveEnemies ───────────────────────────────────────────────────────────

  private moveEnemies(): void {
    for (const enemy of this.enemies) {
      const next  = enemy.computeNextPosition(this.grid);
      enemy.gridX = next.x;
      enemy.gridY = next.y;
      enemy.applyPosition();

      if (enemy.rect instanceof Phaser.GameObjects.Sprite) {
        const key     = enemy instanceof HorizontalEnemy ? KEY_SPRITE_ENEMY_H : KEY_SPRITE_ENEMY_V;
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

  // ── shutdown ──────────────────────────────────────────────────────────────

  shutdown(): void {
    this.game.events.off('remote_state', this.handleRemoteState, this);
  }
}
