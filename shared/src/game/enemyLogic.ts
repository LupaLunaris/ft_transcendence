/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* enemyLogic.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/07/07 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/07/07 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

// Logique de déplacement des ennemis, partagée entre le serveur (tick
// autoritaire du mode duel) et le client (mode solo). Portage 1:1 de
// frontend/src/game/entities/Enemy.ts — ne pas modifier le comportement
// sans mettre à jour les deux côtés, sous peine de changer la difficulté
// perçue des maps déjà publiées.

import { TILE, GRID_SIZE, type Grid } from '../types/tiles.types';
import type { Direction, EnemyKind } from '../types/game.types';

export interface EnemyRuntimeState {
  id: string;   // stable, dérivé de la position de spawn : `enemy_${row}_${col}`
  kind: EnemyKind;
  x: number;
  y: number;
  dx: 1 | -1;   // pertinent seulement si kind === 'horizontal'
  dy: 1 | -1;   // pertinent seulement si kind === 'vertical'
  direction: Direction;
}

export function canStepOn(grid: Grid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return false;
  return grid[y][x] !== TILE.WALL;
}

// Fonction pure : (état actuel, grille) → nouvel état. Rebond déterministe
// sur les murs, direction initiale droite/bas — voir HorizontalEnemy /
// VerticalEnemy dans entities/Enemy.ts pour la version historique.
export function stepEnemy(state: EnemyRuntimeState, grid: Grid): EnemyRuntimeState {
  if (state.kind === 'horizontal') {
    const nx = state.x + state.dx;
    if (canStepOn(grid, nx, state.y)) {
      return { ...state, x: nx, direction: state.dx === 1 ? 'right' : 'left' };
    }

    const flipped: 1 | -1 = state.dx === 1 ? -1 : 1;
    const nx2 = state.x + flipped;
    if (canStepOn(grid, nx2, state.y)) {
      return { ...state, x: nx2, dx: flipped, direction: flipped === 1 ? 'right' : 'left' };
    }

    // Bloqué des deux côtés : la direction inversée est conservée pour la
    // prochaine tentative, position et lastDirection inchangées.
    return { ...state, dx: flipped };
  }

  // ── vertical ──
  const ny = state.y + state.dy;
  if (canStepOn(grid, state.x, ny)) {
    return { ...state, y: ny, direction: state.dy === 1 ? 'down' : 'up' };
  }

  const flipped: 1 | -1 = state.dy === 1 ? -1 : 1;
  const ny2 = state.y + flipped;
  if (canStepOn(grid, state.x, ny2)) {
    return { ...state, y: ny2, dy: flipped, direction: flipped === 1 ? 'down' : 'up' };
  }

  return { ...state, dy: flipped };
}

// Parcourt la grille dans l'ordre row puis col — l'ordre doit rester
// identique entre le serveur (état initial de la course) et le client
// (création des sprites visuels) pour que les id générés correspondent.
export function extractEnemiesFromGrid(grid: Grid): EnemyRuntimeState[] {
  const enemies: EnemyRuntimeState[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = grid[row][col];
      if (tile !== TILE.ENEMY_H && tile !== TILE.ENEMY_V) continue;

      enemies.push({
        id:        `enemy_${row}_${col}`,
        kind:      tile === TILE.ENEMY_H ? 'horizontal' : 'vertical',
        x:         col,
        y:         row,
        dx:        1,
        dy:        1,
        direction: 'down',
      });
    }
  }

  return enemies;
}
