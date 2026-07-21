
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  LobbyEntry,
  DuelStartPayload,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@ft/shared';

type DuelSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseDuelLobbyOptions {
  token:        string | null;
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
  token,
  userId,
  onDuelStart,
  onError,
}: UseDuelLobbyOptions): UseDuelLobbyResult {
  const [lobbyEntries, setLobbyEntries] = useState<LobbyEntry[]>([]);
  const [connected,    setConnected]    = useState(false);
  const socketRef   = useRef<DuelSocket | null>(null);
  const onStartRef  = useRef(onDuelStart);
  useEffect(() => { onStartRef.current = onDuelStart; }, [onDuelStart]);
  const onErrorRef  = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!token) return;

    const socket: DuelSocket = io({ auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect',       ()  => setConnected(true));
    socket.on('disconnect',    ()  => setConnected(false));
    socket.on('lobby_state',   ({ entries }) => setLobbyEntries(entries));
    socket.on('duel_start',    (payload)     => onStartRef.current(payload));
    socket.on('error_event',   ({ message }) => onErrorRef.current?.(message));

    return () => {
      socket.emit('leave_lobby');
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const myRegistrations = useMemo(
    () => new Set(
      lobbyEntries.filter(e => e.players.some(p => p.id === userId)).map(e => e.map_id),
    ),
    [lobbyEntries, userId],
  );

  function joinLobby(map_id: string) {
    socketRef.current?.emit('join_lobby', { map_id });
  }

  function leaveAll() {
    socketRef.current?.emit('leave_lobby');
  }

  return { lobbyEntries, myRegistrations, joinLobby, leaveAll, connected };
}
