/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* BaseScene.ts                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import Phaser from 'phaser';
import { TILE, GRID_SIZE, type Grid } from '@ft/shared';

export const TILE_SIZE = 32;

// Tile color palette (MVP: colored squares, textures later)
const TILE_COLORS: Record<number, number> = {
  [TILE.EMPTY]: 0x2a2a3e,
  [TILE.WALL]:  0x5c3d8f,
  [TILE.EXIT]:  0x00e5a0,
  [TILE.SPAWN]: 0x2a2a3e, // invisible in-game (same as floor)
  [TILE.ENEMY]: 0xe53935,
};

export abstract class BaseScene extends Phaser.Scene {
  protected buildTilemap(grid: Grid): void {
    const graphics = this.add.graphics();

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = grid[row][col];
        const color = TILE_COLORS[tile] ?? TILE_COLORS[TILE.EMPTY];

        graphics.fillStyle(color, 1);
        graphics.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Subtle grid lines for readability
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
