
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
	x: number;
	y: number;
}

export interface PlayerState {
	id: string;
	username: string;
	avatar: string | null;
	position: Position;
	direction: Direction;
	alive: boolean;
	finished: boolean;
}

export type EnemyKind = 'horizontal' | 'vertical';

export interface EnemyState {
	id: string;
	kind: EnemyKind;
	position: Position;
	direction: Direction;
}

export interface GameState {
	race_id: string;
	map_id: string;
	players: PlayerState[];
	enemies: EnemyState[];
	tick: number;
	started: boolean;
	finished: boolean;
}

// Full ranking — 2 to 4 entries, sorted by ascending rank.
// duration_ms is null for a player who did not reach the EXIT (dead or forfeited).
export interface RaceRankingEntry {
	user_id: string;
	username: string;
	rank: number;
	duration_ms: number | null;
	finished: boolean;
}

export interface RaceResult {
	race_id: string;
	map_id: string;
	ranking: RaceRankingEntry[];
	created_at: string;
}
