-- Score becomes one row per (user, map) — the player's personal best time —
-- instead of one row per attempt. Dedupe existing rows first, keeping only
-- the fastest (and, on a tie, the earliest) row per (user_id, map_id).
DELETE FROM "Score" s
USING "Score" s2
WHERE s.user_id = s2.user_id
  AND s.map_id = s2.map_id
  AND (s.completion_time_ms > s2.completion_time_ms
       OR (s.completion_time_ms = s2.completion_time_ms AND s.id > s2.id));

ALTER TABLE "Score" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Score" ADD CONSTRAINT "Score_user_id_map_id_key" UNIQUE ("user_id", "map_id");

-- Per-map speed-ranking points: 5/4/3/2/1 for the top 5 personal-best times
-- on a map, recalculated whenever a new personal best changes that top 5.
CREATE TABLE "MapRankingPoints" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapRankingPoints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MapRankingPoints_map_id_user_id_key" ON "MapRankingPoints"("map_id", "user_id");
CREATE INDEX "MapRankingPoints_user_id_idx" ON "MapRankingPoints"("user_id");
CREATE INDEX "MapRankingPoints_map_id_idx" ON "MapRankingPoints"("map_id");

ALTER TABLE "MapRankingPoints" ADD CONSTRAINT "MapRankingPoints_map_id_fkey"
FOREIGN KEY ("map_id") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MapRankingPoints" ADD CONSTRAINT "MapRankingPoints_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
