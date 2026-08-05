
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  LobbyEntry,
  DuelStartPayload,
} from '@ft/shared';
import { useSocket } from '@/context/socket.context';

interface UseDuelLobbyOptions {
  userId:       string | null;
  onDuelStart:  (payload: DuelStartPayload) => void;
  onError?:     (message: string) => void;
}

interface UseDuelLobbyResult {
  lobbyEntries:   LobbyEntry[];
  myRegistrations: Set<string>;
  joinLobby:      (map_id: string) => void;
  leaveAll:       () => void;
  connected:      boolean;
}

export function useDuelLobby({
  userId,
  onDuelStart,
  onError,
}: UseDuelLobbyOptions): UseDuelLobbyResult {
  const { socket, connected } = useSocket();
  const [lobbyEntries, setLobbyEntries] = useState<LobbyEntry[]>([]);
  const onStartRef  = useRef(onDuelStart);
  useEffect(() => { onStartRef.current = onDuelStart; }, [onDuelStart]);
  const onErrorRef  = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!socket) return;

    socket.on('lobby_state',   ({ entries }) => setLobbyEntries(entries));
    socket.on('duel_start',    (payload)     => onStartRef.current(payload));
    socket.on('error_event',   ({ message }) => onErrorRef.current?.(message));

    return () => {
      socket.emit('leave_lobby');
      socket.off('lobby_state');
      socket.off('duel_start');
      socket.off('error_event');
    };
  }, [socket]);

  const myRegistrations = useMemo(
    () => new Set(
      lobbyEntries.filter(e => e.players.some(p => p.id === userId)).map(e => e.map_id),
    ),
    [lobbyEntries, userId],
  );

  function joinLobby(map_id: string) {
    socket?.emit('join_lobby', { map_id });
  }

  function leaveAll() {
    socket?.emit('leave_lobby');
  }

  return { lobbyEntries, myRegistrations, joinLobby, leaveAll, connected };
}
