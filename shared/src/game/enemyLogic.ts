
// Enemy movement logic, shared between the server (authoritative tick
// of duel mode) and the client (solo mode). 1:1 port of
// frontend/src/game/entities/Enemy.ts — do not change the behavior
// without updating both sides, or the perceived difficulty of already
// published maps will change.

import { TILE, GRID_SIZE, type Grid } from '../types/tiles.types';
import type { Direction, EnemyKind } from '../types/game.types';

export interface EnemyRuntimeState {
	id: string;   // stable, derived from spawn position: `enemy_${row}_${col}`
	kind: EnemyKind;
	x: number;
	y: number;
	dx: 1 | -1;   // relevant only if kind === 'horizontal'
	dy: 1 | -1;   // relevant only if kind === 'vertical'
	direction: Direction;
}

export function canStepOn(grid: Grid, x: number, y: number): boolean {
	if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return false;
	return grid[y][x] !== TILE.WALL;
}

// Pure function: (current state, grid) → new state. Deterministic bounce
// off walls, initial direction right/down — see HorizontalEnemy /
// VerticalEnemy in entities/Enemy.ts for the historical version.
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

		// Blocked on both sides: the flipped direction is kept for the
		// next attempt, position and lastDirection unchanged.
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

// Walks the grid in row-then-col order — the order must stay identical
// between the server (initial race state) and the client (visual sprite
// creation) so that the generated ids match.
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
