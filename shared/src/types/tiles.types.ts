
export const TILE = { EMPTY: 0, WALL: 1, EXIT: 2, SPAWN: 3, ENEMY_H: 4, ENEMY_V: 5 } as const;
export type TileValue = typeof TILE[keyof typeof TILE];
export const GRID_SIZE = 25;
export type Grid = TileValue[][];
