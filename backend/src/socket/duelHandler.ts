/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   duelHandler.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: Jdebrull <jdebrull@student.s19.be>         +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/12 11:31:30 by Jdebrull          #+#    #+#             */
/*   Updated: 2026/06/12 11:31:34 by Jdebrull         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import type {
  Grid,
  Direction,
  GameState,
  RaceResult,
  LobbyEntry,
  DuelStartPayload,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@ft/shared';
import { TILE, GRID_SIZE } from '@ft/shared';
import { onlineUsers } from '../state/online.state';

// ─── Types internes ───────────────────────────────────────────────────────────

interface SocketUser {
  id: string;
  username: string;
  avatar: string | null;
}

interface LobbyRegistration {
  user: SocketUser;
  socket_id: string;
}

interface RacePlayer {
  user: SocketUser;
  socket_id: string;
  position: { x: number; y: number };
  direction: Direction;
  alive: boolean;
  finished: boolean;
  start_time: number;
}

interface ActiveRace {
  race_id: string;
  map_id: string;
  grid: Grid;
  players: Map<string, RacePlayer>;
  started: boolean;
  finished: boolean;
  tick: number;
  created_at: number;
}

// ─── État en mémoire ──────────────────────────────────────────────────────────

// map_id → joueur en attente
const lobbies = new Map<string, LobbyRegistration>();
// socket_id → ensemble de map_ids où ce joueur est inscrit
const socketRegs = new Map<string, Set<string>>();
// race_id → état de la course
const activeRaces = new Map<string, ActiveRace>();
// socket_id → race_id (pour retrouver la course sur player_input)
const socketRace = new Map<string, string>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLobbyEntries(): LobbyEntry[] {
  return Array.from(lobbies.entries()).map(([map_id, reg]) => ({
    map_id,
    player: { id: reg.user.id, username: reg.user.username, avatar: reg.user.avatar },
  }));
}

function findSpawn(grid: Grid): { x: number; y: number } {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === TILE.SPAWN) return { x: col, y: row };
    }
  }
  return { x: 1, y: 1 };
}

function buildGameState(race: ActiveRace): GameState {
  return {
    race_id: race.race_id,
    map_id:  race.map_id,
    players: Array.from(race.players.values()).map(p => ({
      id:        p.user.id,
      username:  p.user.username,
      avatar:    p.user.avatar,
      position:  p.position,
      direction: p.direction,
      alive:     p.alive,
    })),
    tick:     race.tick,
    started:  race.started,
    finished: race.finished,
  };
}

function cleanupLobby(socket_id: string): void {
  const regs = socketRegs.get(socket_id);
  if (!regs) return;
  for (const map_id of regs) {
    const entry = lobbies.get(map_id);
    if (entry?.socket_id === socket_id) lobbies.delete(map_id);
  }
  socketRegs.delete(socket_id);
}

function cleanupRace(race_id: string): void {
  const race = activeRaces.get(race_id);
  if (!race) return;
  for (const p of race.players.values()) socketRace.delete(p.socket_id);
  activeRaces.delete(race_id);
}

// ─── Enregistrement des handlers ─────────────────────────────────────────────

export function registerDuelHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void {

  // Authentification JWT sur chaque connexion socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await prisma.user.findUnique({
        where:  { id: payload.id },
        select: { id: true, username: true, avatar: true },
      });
      if (!user) return next(new Error('User not found'));
      socket.data.user = user as SocketUser;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const user = socket.data.user as SocketUser;
    onlineUsers.add(user.id);
    console.log(`[duel] ${user.username} connected (${socket.id})`);

    // Envoie l'état courant du lobby au nouveau connecté
    socket.emit('lobby_state', { entries: getLobbyEntries() });

    // ── join_lobby ────────────────────────────────────────────────────────────
    socket.on('join_lobby', async ({ map_id }) => {
      const myRegs = socketRegs.get(socket.id) ?? new Set<string>();

      if (myRegs.size >= 3 && !myRegs.has(map_id)) {
        socket.emit('error_event', { message: 'Maximum 3 maps simultanément', code: 400 });
        return;
      }
      if (myRegs.has(map_id)) {
        socket.emit('error_event', { message: 'Déjà inscrit sur cette map', code: 400 });
        return;
      }

      const existing = lobbies.get(map_id);

      if (existing && existing.user.id !== user.id) {
        // Match trouvé — lancer la course
        lobbies.delete(map_id);
        const prevRegs = socketRegs.get(existing.socket_id);
        if (prevRegs) {
          prevRegs.delete(map_id);
          if (prevRegs.size === 0) socketRegs.delete(existing.socket_id);
        }

        const map = await prisma.map.findUnique({ where: { id: map_id } });
        if (!map) {
          socket.emit('error_event', { message: 'Map introuvable', code: 404 });
          return;
        }
        const grid: Grid = JSON.parse(map.grid_json);
        const spawn = findSpawn(grid);
        const race_id = crypto.randomUUID();

        const race: ActiveRace = {
          race_id,
          map_id,
          grid,
          players: new Map([
            [existing.user.id, {
              user: existing.user, socket_id: existing.socket_id,
              position: { ...spawn }, direction: 'down',
              alive: true, finished: false, start_time: 0,
            }],
            [user.id, {
              user, socket_id: socket.id,
              position: { ...spawn }, direction: 'down',
              alive: true, finished: false, start_time: 0,
            }],
          ]),
          started: false, finished: false, tick: 0, created_at: Date.now(),
        };
        activeRaces.set(race_id, race);

        const p1: DuelStartPayload = {
          race_id, map_id, grid,
          opponent: { id: user.id, username: user.username, avatar: user.avatar },
        };
        const p2: DuelStartPayload = {
          race_id, map_id, grid,
          opponent: { id: existing.user.id, username: existing.user.username, avatar: existing.user.avatar },
        };
        io.to(existing.socket_id).emit('duel_start', p1);
        socket.emit('duel_start', p2);
        io.emit('lobby_state', { entries: getLobbyEntries() });

      } else if (!existing) {
        // Inscription en attente
        lobbies.set(map_id, { user, socket_id: socket.id });
        myRegs.add(map_id);
        socketRegs.set(socket.id, myRegs);
        io.emit('lobby_state', { entries: getLobbyEntries() });
      } else {
        socket.emit('error_event', { message: 'Déjà inscrit', code: 400 });
      }
    });

    // ── leave_lobby ──────────────────────────────────────────────────────────
    socket.on('leave_lobby', () => {
      cleanupLobby(socket.id);
      io.emit('lobby_state', { entries: getLobbyEntries() });
    });

    // ── join_race ────────────────────────────────────────────────────────────
    socket.on('join_race', ({ race_id }) => {
      const race = activeRaces.get(race_id);
      if (!race) {
        socket.emit('error_event', { message: 'Course introuvable', code: 404 });
        return;
      }
      socket.join(`race:${race_id}`);
      socketRace.set(socket.id, race_id);

      // Mise à jour socket_id : le game socket ≠ lobby socket
      const player = race.players.get(user.id);
      if (player) player.socket_id = socket.id;

      const room = io.sockets.adapter.rooms.get(`race:${race_id}`);
      if (room && room.size === 2 && !race.started) {
        race.started = true;
        const now = Date.now();
        for (const p of race.players.values()) p.start_time = now;
        io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
      }
    });

    // ── player_input ─────────────────────────────────────────────────────────
    socket.on('player_input', ({ direction }) => {
      const race_id = socketRace.get(socket.id);
      if (!race_id) return;
      const race = activeRaces.get(race_id);
      if (!race || !race.started || race.finished) return;

      const player = race.players.get(user.id);
      if (!player || !player.alive || player.finished) return;

      const { x, y } = player.position;
      const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
      const dy = direction === 'up'   ? -1 : direction === 'down'  ? 1 : 0;
      const nx = x + dx;
      const ny = y + dy;

      if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
      if (race.grid[ny][nx] === TILE.WALL) return;

      player.position  = { x: nx, y: ny };
      player.direction = direction;
      race.tick++;

      if (race.grid[ny][nx] === TILE.EXIT) {
        player.finished = true;
        race.finished   = true;
        const elapsed   = Date.now() - player.start_time;
        const loser     = Array.from(race.players.values()).find(p => p.user.id !== user.id);
        const result: RaceResult = {
          winner_id:   user.id,
          loser_id:    loser?.user.id ?? '',
          duration_ms: elapsed,
          map_id:      race.map_id,
          created_at:  new Date().toISOString(),
        };
        io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
        io.to(`race:${race_id}`).emit('race_finished', result);
        cleanupRace(race_id);
        return;
      }

      io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
    });

    // ── player_died ──────────────────────────────────────────────────────────
    socket.on('player_died', () => {
      const race_id = socketRace.get(socket.id);
      if (!race_id) return;
      const race = activeRaces.get(race_id);
      if (!race || race.finished) return;

      const player = race.players.get(user.id);
      if (!player) return;
      player.alive  = false;
      race.finished = true;

      const winner  = Array.from(race.players.values()).find(p => p.user.id !== user.id);
      const result: RaceResult = {
        winner_id:   winner?.user.id ?? '',
        loser_id:    user.id,
        duration_ms: Date.now() - (player.start_time || race.created_at),
        map_id:      race.map_id,
        created_at:  new Date().toISOString(),
      };
      io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
      io.to(`race:${race_id}`).emit('race_finished', result);
      cleanupRace(race_id);
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(user.id);
      console.log(`[duel] ${user.username} disconnected`);
      cleanupLobby(socket.id);

      const race_id = socketRace.get(socket.id);
      if (race_id) {
        const race = activeRaces.get(race_id);
        if (race && !race.finished) {
          race.finished = true;
          const player = race.players.get(user.id);
          if (player) player.alive = false;
          const winner = Array.from(race.players.values()).find(p => p.user.id !== user.id);
          const result: RaceResult = {
            winner_id:   winner?.user.id ?? '',
            loser_id:    user.id,
            duration_ms: Date.now() - race.created_at,
            map_id:      race.map_id,
            created_at:  new Date().toISOString(),
          };
          io.to(`race:${race_id}`).emit('race_finished', result);
          cleanupRace(race_id);
        }
      }

      io.emit('lobby_state', { entries: getLobbyEntries() });
    });
  });
}
