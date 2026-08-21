export type User = {
	id: string;
	username: string;
	avatarUrl?: string;
};

export type GameMode = 'local' | 'online' | 'tournament';

export type MapSummary = {
	id: string;
	name: string;
	authorId: string;
};
