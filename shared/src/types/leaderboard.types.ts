export interface LeaderboardEntry {
	rank: number;
	user_id: string;
	username: string;
	avatar: string | null;
	points: number;
	// Present only on a specific map's leaderboard (the player's best time
	// on that map) — absent on the global leaderboard.
	completion_time_ms?: number;
}
