/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* GameScene.ts                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import Phaser from 'phaser';
import { TILE, GRID_SIZE, type Grid } from '@ft/shared';
import { BaseScene, TILE_SIZE } from './BaseScene';

export interface GameSceneData {
  grid: Grid;
  player_id: string;
}

export class GameScene extends BaseScene {
  private grid: Grid = [];
  private gridX = 0;
  private gridY = 0;
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private startTime = 0;
  private moved = false;
  private finished = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Placeholder — real assets loaded here in future sprints
  }

  create(data: GameSceneData): void {
    this.grid = data.grid;
    this.finished = false;
    this.moved = false;

    this.buildTilemap(data.grid);

    // Locate SPAWN cell
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (data.grid[row][col] === TILE.SPAWN) {
          this.gridX = col;
          this.gridY = row;
        }
      }
    }

    // Player as colored rectangle
    this.player = this.add.rectangle(
      this.gridX * TILE_SIZE + TILE_SIZE / 2,
      this.gridY * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE - 8,
      TILE_SIZE - 8,
      0xf4511e,
    );

    // Camera follows player, bounded to the map
    this.cameras.main.setBounds(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.startTime = this.time.now;
  }

  update(): void {
    if (this.finished) return;

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;

    const anyKey = left || right || up || down;
    if (!anyKey) {
      this.moved = false;
      return;
    }

    // One move per key press (no auto-repeat)
    if (this.moved) return;
    this.moved = true;

    if (left)       this.tryMove(-1,  0);
    else if (right) this.tryMove( 1,  0);
    else if (up)    this.tryMove( 0, -1);
    else if (down)  this.tryMove( 0,  1);
  }

  private tryMove(dx: number, dy: number): void {
    const nx = this.gridX + dx;
    const ny = this.gridY + dy;

    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
    if (this.grid[ny][nx] === TILE.WALL) return;

    this.gridX = nx;
    this.gridY = ny;
    this.player.setPosition(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE + TILE_SIZE / 2);

    if (this.grid[ny][nx] === TILE.EXIT) {
      this.finished = true;
      const elapsed = Math.floor(this.time.now - this.startTime);
      // Emit on global game events so GameCanvas can listen before scene starts
      this.game.events.emit('player_reached_exit', elapsed);
    }
  }
}
