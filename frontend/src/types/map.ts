import { Grid } from "@ft/shared/dist/types/tiles.types";

export type EnemySpeed = "slow" | "normal" | "fast";

export interface MapData {
  id: string;
  name: string;
  grid: Grid;
  settings: {
    size: number;
    enemyCount: number;
    enemySpeed: "slow" | "normal" | "fast";
  };
  creator_id: string;
  published: boolean;
  creator_completed: boolean;
  difficulty: Difficulty;
  play_count: number;
  created_at: string;
}
export interface MapSettings {
  size: number;
  enemyCount: number;
  enemySpeed: EnemySpeed;
}