
import { TILE, GRID_SIZE } from '@ft/shared';
import { validateGrid, hasPath } from '../utils/grid.utils';
import { makeValidGrid } from './helpers/grid.helper';

describe('validateGrid', () => {
  it('accepts a well-formed grid', () => {
    expect(validateGrid(makeValidGrid())).toBe(true);
  });

  it('rejects null', () => {
    expect(validateGrid(null)).toBe(false);
  });

  it('rejects a non-array', () => {
    expect(validateGrid({ length: 25 })).toBe(false);
  });

  it('rejects a grid with wrong number of rows', () => {
    const grid = makeValidGrid();
    grid.pop();
    expect(validateGrid(grid)).toBe(false);
  });

  it('rejects a grid with a row that has wrong length', () => {
    const grid = makeValidGrid();
    (grid[5] as unknown as number[]).pop();
    expect(validateGrid(grid)).toBe(false);
  });

  it('rejects a grid with an invalid tile value', () => {
    const grid = makeValidGrid();
    (grid[5][5] as unknown) = 99;
    expect(validateGrid(grid)).toBe(false);
  });

  it('rejects a grid with no SPAWN', () => {
    const grid = makeValidGrid();
    grid[1][1] = TILE.EMPTY;
    expect(validateGrid(grid)).toBe(false);
  });

  it('rejects a grid with no EXIT', () => {
    const grid = makeValidGrid();
    grid[1][GRID_SIZE - 2] = TILE.EMPTY;
    expect(validateGrid(grid)).toBe(false);
  });

  it('rejects a grid with two SPAWNs', () => {
    const grid = makeValidGrid();
    grid[2][2] = TILE.SPAWN;
    expect(validateGrid(grid)).toBe(false);
  });

  it('rejects a non-WALL border cell', () => {
    const grid = makeValidGrid();
    (grid[0][5] as unknown) = TILE.EMPTY;
    expect(validateGrid(grid)).toBe(false);
  });
});

describe('hasPath', () => {
  it('finds the path in a valid open grid', () => {
    expect(hasPath(makeValidGrid())).toBe(true);
  });

  it('returns false when EXIT is walled off', () => {
    const grid = makeValidGrid();
    // Surround EXIT with walls
    const exitCol = GRID_SIZE - 2;
    grid[1][exitCol - 1] = TILE.WALL;
    grid[2][exitCol] = TILE.WALL;
    expect(hasPath(grid)).toBe(false);
  });

  it('returns false when SPAWN is walled off', () => {
    const grid = makeValidGrid();
    grid[1][2] = TILE.WALL; // block right of SPAWN at [1][1]
    grid[2][1] = TILE.WALL; // block below SPAWN
    expect(hasPath(grid)).toBe(false);
  });

  it('finds path through ENEMY_H tiles', () => {
    const grid = makeValidGrid();
    // Place enemies on the path — should still be walkable
    grid[1][5] = TILE.ENEMY_H;
    grid[1][10] = TILE.ENEMY_H;
    expect(hasPath(grid)).toBe(true);
  });
});
