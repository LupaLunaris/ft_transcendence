
import { TILE, GRID_SIZE, TileValue, Grid } from '@ft/shared';

const VALID_TILES = new Set<number>(Object.values(TILE));

export function validateGrid(grid: unknown): grid is Grid {
  if (!Array.isArray(grid) || grid.length !== GRID_SIZE) return false;

  let spawnCount = 0;
  let exitCount = 0;

  for (let row = 0; row < GRID_SIZE; row++) {
    if (!Array.isArray(grid[row]) || (grid[row] as unknown[]).length !== GRID_SIZE)
      return false;

    for (let col = 0; col < GRID_SIZE; col++) {
      const val = (grid[row] as unknown[])[col];
      if (typeof val !== 'number' || !VALID_TILES.has(val)) return false;

      const tile = val as TileValue;
      if (tile === TILE.SPAWN) spawnCount++;
      if (tile === TILE.EXIT) exitCount++;

      const isBorder = row === 0 || row === GRID_SIZE - 1 || col === 0 || col === GRID_SIZE - 1;
      if (isBorder && tile !== TILE.WALL) return false;
    }
  }

  return spawnCount === 1 && exitCount === 1;
}

export function hasPath(grid: Grid): boolean {
  let start: [number, number] | null = null;
  let end: [number, number] | null = null;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === TILE.SPAWN) start = [r, c];
      if (grid[r][c] === TILE.EXIT) end = [r, c];
    }
  }

  if (!start || !end) return false;

  const visited: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
    new Array<boolean>(GRID_SIZE).fill(false),
  );
  const queue: [number, number][] = [start];
  visited[start[0]][start[1]] = true;

  const dirs: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === end[0] && c === end[1]) return true;

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 && nr < GRID_SIZE &&
        nc >= 0 && nc < GRID_SIZE &&
        !visited[nr][nc] &&
        grid[nr][nc] !== TILE.WALL
      ) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }

  return false;
}
