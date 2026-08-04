
//set of user ids currently connected via socket.io
export type PresenceStatus = 'online' | 'in_game';

export const onlineUsers = new Map<string, PresenceStatus>();

export function setOnline(user_id: string): void {
    onlineUsers.set(user_id, 'online');
}

export function setInGame(user_id: string): void {
    onlineUsers.set(user_id, 'in_game');
}

export function setOffline(user_id: string): void {
    onlineUsers.delete(user_id);
}

export function getStatus(user_id: string): 'online' | 'offline' | 'in_game' {
    return (onlineUsers.get(user_id) ?? 'offline');
}