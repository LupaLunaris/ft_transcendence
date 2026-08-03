import { Prisma } from '@prisma/client';
import type { AchievementCode, RewardResult } from '@ft/shared';

const XP_PER_LEVEL = 100;

export function getLevelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

async function getCurrentRewardState(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<RewardResult> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { xp: true },
  });

  const xp = user?.xp ?? 0;
  return {
    xp_gained: 0,
    xp_total: xp,
    level: getLevelFromXp(xp),
    achievements_unlocked: [],
  };
}

// Vérifie l'existence avant d'insérer plutôt que d'intercepter une violation
// de contrainte unique : une fois qu'une requête échoue à l'intérieur d'une
// transaction Postgres, la transaction entière passe en état "aborted" et
// toute requête suivante sur ce même tx échoue (25P02), même si l'erreur a
// été catchée côté JS — il n'y a pas de savepoint implicite. Continuer à
// interroger `tx` après un P2002 catché faisait donc échouer (et rollback)
// toute la transaction englobante, y compris les écritures déjà réussies
// avant (ex: l'upsert du meilleur score), dès qu'un joueur rejouait une map
// déjà complétée — cf. history_debug pour l'incident correspondant.
async function unlockAchievement(
  tx: Prisma.TransactionClient,
  userId: string,
  code: AchievementCode,
): Promise<RewardResult['achievements_unlocked'][number] | null> {
  const already = await tx.userAchievement.findUnique({
    where: { user_id_code: { user_id: userId, code } },
  });
  if (already) return null;

  const achievement = await tx.userAchievement.create({
    data: { user_id: userId, code },
  });
  return {
    code: achievement.code as AchievementCode,
    unlocked_at: achievement.unlocked_at.toISOString(),
  };
}

async function awardXpOnce(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    action: string;
    key: string;
    xp: number;
    achievements?: AchievementCode[];
  },
): Promise<RewardResult> {
  const already = await tx.xpEvent.findUnique({
    where: { action_key: { action: params.action, key: params.key } },
  });
  if (already) {
    return getCurrentRewardState(tx, params.userId);
  }

  await tx.xpEvent.create({
    data: {
      user_id: params.userId,
      action: params.action,
      key: params.key,
      xp: params.xp,
    },
  });

  const user = await tx.user.update({
    where: { id: params.userId },
    data: { xp: { increment: params.xp } },
    select: { xp: true },
  });

  const achievements = (
    await Promise.all(
      (params.achievements ?? []).map((code) => unlockAchievement(tx, params.userId, code)),
    )
  ).filter((achievement): achievement is NonNullable<typeof achievement> => achievement !== null);

  return {
    xp_gained: params.xp,
    xp_total: user.xp,
    level: getLevelFromXp(user.xp),
    achievements_unlocked: achievements,
  };
}

export async function rewardPublicMapCompletion(
  tx: Prisma.TransactionClient,
  userId: string,
  mapId: string,
): Promise<RewardResult> {
  const reward = await awardXpOnce(tx, {
    userId,
    action: 'PUBLIC_MAP_COMPLETION',
    key: `${userId}:${mapId}`,
    xp: 20,
    achievements: ['FIRST_ESCAPE'],
  });

  const completedMaps = await tx.score.groupBy({
    by: ['map_id'],
    where: {
      user_id: userId,
      map: { published: true },
    },
  });

  if (completedMaps.length >= 5) {
    const explorer = await unlockAchievement(tx, userId, 'EXPLORER');
    if (explorer) reward.achievements_unlocked.push(explorer);
  }

  return reward;
}

export async function rewardTestMapCompletion(
  tx: Prisma.TransactionClient,
  userId: string,
  mapId: string,
): Promise<RewardResult> {
  return awardXpOnce(tx, {
    userId,
    action: 'TEST_MAP_COMPLETION',
    key: `${userId}:${mapId}`,
    xp: 10,
  });
}

export async function rewardFirstMapPublication(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<RewardResult> {
  return awardXpOnce(tx, {
    userId,
    action: 'FIRST_MAP_PUBLICATION',
    key: userId,
    xp: 15,
    achievements: ['FIRST_CREATOR'],
  });
}

export async function rewardDuelVictory(
  tx: Prisma.TransactionClient,
  userId: string,
  raceId: string,
): Promise<RewardResult> {
  return awardXpOnce(tx, {
    userId,
    action: 'DUEL_VICTORY',
    key: `${userId}:${raceId}`,
    xp: 25,
    achievements: ['DUEL_CHAMPION'],
  });
}
