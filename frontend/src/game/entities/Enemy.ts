/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* Enemy.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/21 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/21 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import Phaser from 'phaser';
import { TILE, GRID_SIZE, type Grid, type Direction } from '@ft/shared';
import { TILE_SIZE } from '../scenes/BaseScene';

// ─── Type alias ───────────────────────────────────────────────────────────────

// Sprite quand la texture est chargée, Rectangle en fallback.
// Les deux implémentent Transform → setPosition() sans cast.
export type EnemyGameObject = Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

// ─── Classe abstraite ─────────────────────────────────────────────────────────
//
// En C ce serait une struct + un pointeur de fonction :
//   typedef struct s_enemy {
//     int grid_x, grid_y;
//     t_pos (*compute_next)(struct s_enemy *, Grid);
//   } t_enemy;
//
// En TypeScript : classe abstraite avec une méthode abstraite.
// Chaque sous-classe DOIT implémenter computeNextPosition().
// GameScene n'a pas besoin de savoir quel type d'ennemi il manipule.

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

  // Appelée par GameScene à chaque tick du timer.
  // Retourne la prochaine position logique souhaitée par cet ennemi.
  // GameScene décide ensuite si la case est praticable et met à jour
  // gridX/gridY + rect.setPosition().
  //
  // Paramètres :
  //   grid — la grille complète, pour tester les murs
  // Retour :
  //   { x, y } — la case cible (peut être la case actuelle si bloqué)
  abstract computeNextPosition(grid: Grid): { x: number; y: number };

  // Utilitaire partagé entre toutes les sous-classes.
  // Vérifie qu'une case est dans la grille et n'est pas un mur.
  protected canStepOn(grid: Grid, x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return false;
    return grid[y][x] !== TILE.WALL;
  }

  // Met à jour la position graphique Phaser après un déplacement validé.
  // Appelée par GameScene une fois qu'il a confirmé le déplacement.
  applyPosition(): void {
    this.rect.setPosition(
      this.gridX * TILE_SIZE + TILE_SIZE / 2,
      this.gridY * TILE_SIZE + TILE_SIZE / 2,
    );
  }
}

// ─── Ennemi horizontal ────────────────────────────────────────────────────────
//
// Se déplace uniquement sur l'axe X (dx = ±1, dy = 0).
// Rebondit quand il rencontre un mur : inverse dx.
// Déterministe — pas de hasard.

export class HorizontalEnemy extends Enemy {
  private dx: 1 | -1;

  constructor(gridX: number, gridY: number, rect: EnemyGameObject) {
    super(gridX, gridY, rect);
    // Direction initiale : droite par défaut.
    // Si la case à droite est un mur dès le départ, on part à gauche.
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

// ─── Ennemi vertical ──────────────────────────────────────────────────────────
//
// Même logique que HorizontalEnemy mais sur l'axe Y (dx = 0, dy = ±1).

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
