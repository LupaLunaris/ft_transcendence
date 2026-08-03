export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar: string | null;
  points: number;
  // Présent uniquement sur le classement d'une map précise (meilleur temps
  // du joueur sur cette map) — absent sur le classement global.
  completion_time_ms?: number;
}
