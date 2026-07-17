import { Prisma } from '@prisma/client';

// Points attribués au classement de vitesse d'une map : rang 1 → 5 points,
// rang 2 → 4, ... rang 5 → 1. Au-delà, aucun point.
export const POINTS_BY_RANK = [5, 4, 3, 2, 1];

export async function upsertBestScore(
  tx: Prisma.TransactionClient,
  userId: string,
  mapId: string,
  completionTimeMs: number,
): Promise<{ improved: boolean }> {
  const existing = await tx.score.findUnique({
    where: { user_id_map_id: { user_id: userId, map_id: mapId } },
  });

  if (existing && existing.completion_time_ms <= completionTimeMs) {
    return { improved: false };
  }

  await tx.score.upsert({
    where: { user_id_map_id: { user_id: userId, map_id: mapId } },
    update: { completion_time_ms: completionTimeMs },
    create: { user_id: userId, map_id: mapId, completion_time_ms: completionTimeMs },
  });

  await recalculateMapPoints(tx, mapId);

  return { improved: true };
}

// Recalcule le top 5 (temps le plus rapide en premier) d'une map et met à
// jour MapRankingPoints en conséquence : les joueurs qui sortent du top 5
// perdent leurs points, ceux qui y entrent/progressent sont mis à jour.
export async function recalculateMapPoints(tx: Prisma.TransactionClient, mapId: string): Promise<void> {
  const top = await tx.score.findMany({
    where: { map_id: mapId },
    orderBy: { completion_time_ms: 'asc' },
    take: POINTS_BY_RANK.length,
    select: { user_id: true },
  });

  const nextPoints = new Map(top.map((s, i) => [s.user_id, POINTS_BY_RANK[i]]));

  const current = await tx.mapRankingPoints.findMany({
    where: { map_id: mapId },
    select: { user_id: true },
  });

  const toRemove = current.filter((row) => !nextPoints.has(row.user_id));
  if (toRemove.length > 0) {
    await tx.mapRankingPoints.deleteMany({
      where: { map_id: mapId, user_id: { in: toRemove.map((row) => row.user_id) } },
    });
  }

  for (const [userId, points] of nextPoints) {
    await tx.mapRankingPoints.upsert({
      where: { map_id_user_id: { map_id: mapId, user_id: userId } },
      update: { points },
      create: { map_id: mapId, user_id: userId, points },
    });
  }
}
