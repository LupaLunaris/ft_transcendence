export type EnemySpeed = "slow" | "normal" | "fast";

export interface MapSettings {
  size: number;
  enemyCount: number;
  enemySpeed: EnemySpeed;
}