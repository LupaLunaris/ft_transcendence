// Handles XP rewards, level calculation, and achievement unlocking while preventing duplicate rewards.
import { Prisma } from '@prisma/client';
import type { AchievementCode, RewardResult } from '@ft/shared';

const XP_PER_LEVEL = 100;

// Calculates the user's level from their total XP.
export function getLevelFromXp(xp: number): number {
	return Math.floor(xp / XP_PER_LEVEL) + 1;
}

// Returns the user's current reward state without granting a new reward
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

// Unlocks an achievement only if the user has not already earned it
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

// Grants XP and achievements once for a unique action and returns the updated reward state
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

// Rewards the first completion of a public map and checks the Explorer achievement
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

// Rewards the first successful test completion of a map.
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

// Rewards the user's first map publication and unlocks the First Creator achievement.
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

// Rewards a duel victory and unlocks the Duel Champion achievement
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
