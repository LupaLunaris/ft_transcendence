
import type { UserAchievement } from './gamification.types';

export interface UserPublic {
	id: string;
	username: string;
	avatar: string | null;
	xp: number;
	level: number;
	achievements: UserAchievement[];
	diamonds: number;
	tower_progress: number;
	created_maps_count: number;
	is_admin: boolean;
	created_at: string;
}

export interface UserProfile extends UserPublic {
	online_status: 'online' | 'offline' | 'in_game';
	friends_count: number;
}

export interface FriendPublic {
	id: string;
	username: string;
	avatar: string | null;
	online_status: 'online' | 'offline' | 'in_game';
	friendship_id: string;
	created_at: string;
}

export interface UpdateProfileRequest {
	username?: string;
	avatar?: string;
}
