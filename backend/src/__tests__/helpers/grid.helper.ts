/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* grid.helper.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { TILE, GRID_SIZE, Grid } from '@ft/shared';

/**
 * Generates a minimal valid 25x25 grid:
 * - WALL borders
 * - EMPTY interior
 * - SPAWN at [1][1], EXIT at [1][GRID_SIZE-2]
 * - Clear horizontal path (row 1 is all EMPTY)
 */
export function makeValidGrid(): Grid {
  const grid: Grid = Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (__, c) => {
      if (r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1)
        return TILE.WALL;
      return TILE.EMPTY;
    }),
  );

  grid[1][1] = TILE.SPAWN;
  grid[1][GRID_SIZE - 2] = TILE.EXIT;

  return grid;
}
