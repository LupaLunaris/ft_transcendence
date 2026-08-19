// Shared types for XP rewards and achievements.
export type AchievementCode = 'FIRST_ESCAPE' | 'FIRST_CREATOR' | 'EXPLORER' | 'DUEL_CHAMPION';

export interface UserAchievement {
	code: AchievementCode;
	unlocked_at: string;
}

export interface RewardResult {
	xp_gained: number;
	xp_total: number;
	level: number;
	achievements_unlocked: UserAchievement[];
}
