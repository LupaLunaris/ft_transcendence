import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import type {
  Grid,
  Direction,
  GameState,
  RaceResult,
  RaceRankingEntry,
  LobbyEntry,
  DuelStartPayload,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@ft/shared';
import { TILE, GRID_SIZE, extractEnemiesFromGrid, stepEnemy, type EnemyRuntimeState } from '@ft/shared';
import { setOnline, setInGame, setOffline } from '../state/online.state';
import { upsertBestScore } from '../services/scoring.service';
import { rewardDuelVictory } from '../services/gamification.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_RACE_PLAYERS = 2;
const MAX_RACE_PLAYERS = 4;
const LOBBY_COUNTDOWN_MS = 30_000;
const DISCONNECT_GRACE_MS = 10_000;
const ENEMY_TICK_MS = 400;
// Fastest a legitimate client ever moves (DuelScene.ts moveDuration floor).
// Rejects player_input spam faster than this instead of trusting the client
// to pace itself — a console socket.emit loop could otherwise move a player
// far faster than any real tween allows.
const MIN_INPUT_INTERVAL_MS = 60;

// ─── Internal types ────────────────────────────────────────────────────────────

interface SocketUser {
  id: string;
  username: string;
  avatar: string | null;
}

interface LobbyQueue {
  players: SocketUser[]; // 1 to MAX_RACE_PLAYERS, arrival order
  socket_ids: Map<string, string>; // user_id → socket_id (to remove a specific player)
  countdown_timer?: ReturnType<typeof setTimeout>;
  countdown_ends_at: number | null;
}

interface RacePlayer {
  user: SocketUser;
  socket_id: string;
  position: { x: number; y: number };
  direction: Direction;
  alive: boolean;
  finished: boolean;
  connected: boolean;
  start_time: number;
  finish_time?: number;
  death_time?: number;
  disconnect_timer?: ReturnType<typeof setTimeout>;
  last_input_at?: number;
}

interface ActiveRace {
  race_id: string;
  map_id: string;
  grid: Grid;
  players: Map<string, RacePlayer>; // user_id → RacePlayer
  enemies: EnemyRuntimeState[];
  enemy_tick_timer?: ReturnType<typeof setInterval>;
  started: boolean;
  finished: boolean;
  tick: number;
  created_at: number;
}

// ─── In-memory state ────────────────────────────────────────────────────────────

// map_id → queue
const lobbies = new Map<string, LobbyQueue>();
// socket_id → set of map_ids this player is registered on
const socketRegs = new Map<string, Set<string>>();
// race_id → race state
const activeRaces = new Map<string, ActiveRace>();
// socket_id → race_id (to find the race on player_input)
const socketRace = new Map<string, string>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLobbyEntries(): LobbyEntry[] {
  return Array.from(lobbies.entries()).map(([map_id, queue]) => ({
    map_id,
    players: queue.players.map(u => ({ id: u.id, username: u.username, avatar: u.avatar })),
    countdown_ends_at: queue.countdown_ends_at,
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
      finished:  p.finished,
    })),
    enemies: race.enemies.map(e => ({
      id:        e.id,
      kind:      e.kind,
      position:  { x: e.x, y: e.y },
      direction: e.direction,
    })),
    tick:     race.tick,
    started:  race.started,
    finished: race.finished,
  };
}

// A player is resolved once they've finished (EXIT) or are no longer racing (dead/forfeited).
function isRaceOver(race: ActiveRace): boolean {
  return Array.from(race.players.values()).every(p => p.finished || !p.alive);
}

function buildRanking(race: ActiveRace): RaceRankingEntry[] {
  const players = Array.from(race.players.values());

  const finishers = players
    .filter(p => p.finished)
    .sort((a, b) => (a.finish_time! - a.start_time) - (b.finish_time! - b.start_time));

  // Non-finishers ranked after, in descending order of survival time
  // (whoever lasted longest ranks better).
  const others = players
    .filter(p => !p.finished)
    .sort((a, b) => (b.death_time ?? Date.now()) - (a.death_time ?? Date.now()));

  return [...finishers, ...others].map((p, i) => ({
    user_id:     p.user.id,
    username:    p.user.username,
    rank:        i + 1,
    duration_ms: p.finished ? (p.finish_time! - p.start_time) : null,
    finished:    p.finished,
  }));
}

function cleanupLobby(socket_id: string): void {
  const regs = socketRegs.get(socket_id);
  if (!regs) return;
  for (const map_id of regs) {
    const queue = lobbies.get(map_id);
    if (!queue) continue;
    const user_id = Array.from(queue.socket_ids.entries())
      .find(([, sid]) => sid === socket_id)?.[0];
    if (!user_id) continue;

    queue.players = queue.players.filter(u => u.id !== user_id);
    queue.socket_ids.delete(user_id);

    if (queue.players.length === 0) {
      if (queue.countdown_timer) clearTimeout(queue.countdown_timer);
      lobbies.delete(map_id);
    }
  }
  socketRegs.delete(socket_id);
}

function cleanupRace(race_id: string): void {
  const race = activeRaces.get(race_id);
  if (!race) return;
  if (race.enemy_tick_timer) clearInterval(race.enemy_tick_timer);
  for (const p of race.players.values()) {
    socketRace.delete(p.socket_id);
    if (p.disconnect_timer) clearTimeout(p.disconnect_timer);
  }
  activeRaces.delete(race_id);
}

async function finishRace(io: Server<ClientToServerEvents, ServerToClientEvents>, race: ActiveRace): Promise<void> {
  if (race.finished) return;
  race.finished = true;
  for (const p of race.players.values())
    setOnline(p.user.id);
  const ranking = buildRanking(race);
  const result: RaceResult = {
    race_id:    race.race_id,
    map_id:     race.map_id,
    ranking,
    created_at: new Date().toISOString(),
  };
  io.to(`race:${race.race_id}`).emit('race_finished', result);
  cleanupRace(race.race_id);

  // Every player who reached the EXIT counts as an attempt on this map,
  // just like a solo run (personal best + speed ranking points,
  // cf. backend_doc/duel-server-authoritative-enemies.md).
  // The winner (rank 1, must have finished) additionally receives the
  // duel victory reward.
  try {
    await prisma.$transaction(async (tx) => {
      for (const entry of ranking) {
        if (entry.finished && entry.duration_ms !== null) {
          await upsertBestScore(tx, entry.user_id, race.map_id, entry.duration_ms);
        }
      }

      const winner = ranking.find(e => e.rank === 1 && e.finished);
      if (!winner) return;

      const reward = await rewardDuelVictory(tx, winner.user_id, race.race_id);
      if (reward.xp_gained > 0 || reward.achievements_unlocked.length > 0) {
        const winnerPlayer = race.players.get(winner.user_id);
        if (winnerPlayer) io.to(winnerPlayer.socket_id).emit('reward_earned', reward);
      }
    });
  } catch (err) {
    console.error('[duel] failed to persist race scoring', err);
  }
}

// Marks a player as forfeited (death/resolved disconnection) and ends
// the race if they were the last unresolved player.
function resolvePlayerLoss(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  race: ActiveRace,
  user_id: string,
): void {
  if (race.finished) return;
  const player = race.players.get(user_id);
  if (!player || !player.alive) return;

  player.alive = false;
  player.death_time = Date.now();
  io.to(`race:${race.race_id}`).emit('game_state', buildGameState(race));

  if (isRaceOver(race)) void finishRace(io, race);
}

// ─── Handler registration ─────────────────────────────────────────────────────

export function registerDuelHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
): void {

  // JWT authentication on every socket connection
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

  // ── Actually starting a race from a queue ─────────────────────────────────
  async function tryStartRace(map_id: string): Promise<void> {
    const queue = lobbies.get(map_id);
    if (!queue) return;

    if (queue.players.length < MIN_RACE_PLAYERS) {
      // Nobody else registered in time: restart the wait
      // instead of canceling the already-present player's registration.
      queue.countdown_ends_at = Date.now() + LOBBY_COUNTDOWN_MS;
      queue.countdown_timer = setTimeout(() => void tryStartRace(map_id), LOBBY_COUNTDOWN_MS);
      io.emit('lobby_state', { entries: getLobbyEntries() });
      return;
    }

    if (queue.countdown_timer) clearTimeout(queue.countdown_timer);
    lobbies.delete(map_id);

    const map = await prisma.map.findUnique({ where: { id: map_id } });
    if (!map) {
      for (const socket_id of queue.socket_ids.values()) {
        io.to(socket_id).emit('error_event', { message: 'Map introuvable', code: 404 });
      }
      return;
    }

    const grid: Grid = JSON.parse(map.grid_json);
    const spawn = findSpawn(grid);
    const race_id = crypto.randomUUID();

    const players = new Map<string, RacePlayer>();
    for (const user of queue.players) {
      players.set(user.id, {
        user,
        socket_id: queue.socket_ids.get(user.id)!,
        position:  { ...spawn },
        direction: 'down',
        alive:     true,
        finished:  false,
        connected: true,
        start_time: 0,
      });
    }

    const race: ActiveRace = {
      race_id, map_id, grid, players,
      enemies:  extractEnemiesFromGrid(grid),
      started:  false, finished: false, tick: 0, created_at: Date.now(),
    };
    activeRaces.set(race_id, race);

    for (const user of queue.players) {
      const payload: DuelStartPayload = {
        race_id, map_id, grid,
        opponents: queue.players
          .filter(u => u.id !== user.id)
          .map(u => ({ id: u.id, username: u.username, avatar: u.avatar })),
      };
      io.to(queue.socket_ids.get(user.id)!).emit('duel_start', payload);
    }

    io.emit('lobby_state', { entries: getLobbyEntries() });
  }

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const user = socket.data.user as SocketUser;
    setOnline(user.id);
    console.log(`[duel] ${user.username} connected (${socket.id})`);

    // Send the current lobby state to the newly connected client
    socket.emit('lobby_state', { entries: getLobbyEntries() });

    // ── join_lobby ────────────────────────────────────────────────────────────
    socket.on('join_lobby', async ({ map_id }) => {
      try {
        const map = await prisma.map.findUnique({
          where: { id: map_id },
          select: {
            id: true,
            published: true,
          },
        });

        if (!map) {
          socket.emit('error_event', {
            message: 'Map introuvable',
            code: 404,
          });
          return;
        }

        if (!map.published) {
          socket.emit('error_event', {
            message: 'Cette map n’est pas disponible',
            code: 403,
          });
          return;
        }

      const myRegs = socketRegs.get(socket.id) ?? new Set<string>();

      if (myRegs.size >= 3 && !myRegs.has(map_id)) {
        socket.emit('error_event', { message: 'Maximum 3 maps simultanément', code: 400 });
        return;
      }
      if (myRegs.has(map_id)) {
        socket.emit('error_event', { message: 'Déjà inscrit sur cette map', code: 400 });
        return;
      }

      let queue = lobbies.get(map_id);

      if (queue && queue.players.length >= MAX_RACE_PLAYERS) {
        socket.emit('error_event', { message: 'Lobby complet', code: 400 });
        return;
      }

      if (!queue) {
        queue = { players: [], socket_ids: new Map(), countdown_ends_at: null };
        lobbies.set(map_id, queue);
      }

      queue.players.push(user);
      queue.socket_ids.set(user.id, socket.id);
      myRegs.add(map_id);
      socketRegs.set(socket.id, myRegs);

      if (queue.players.length >= MAX_RACE_PLAYERS) {
        void tryStartRace(map_id);
        return;
      }

      // The countdown starts as soon as the first player registers on this
      // map; tryStartRace() restarts it on its own if <2 players at expiry.
      if (!queue.countdown_timer) {
        queue.countdown_ends_at = Date.now() + LOBBY_COUNTDOWN_MS;
        queue.countdown_timer = setTimeout(() => void tryStartRace(map_id), LOBBY_COUNTDOWN_MS);
      }

      io.emit('lobby_state', { entries: getLobbyEntries() });
    } catch (error) {
      console.error('[duel] failed to join lobby', error);
      socket.emit('error_event', {
        message: 'Impossible de rejoindre le lobby',
        code: 500,
      });
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

      const player = race.players.get(user.id);

      if (!player) {
        socket.emit('error_event', {
          message: 'Accès refusé à cette course',
          code: 403,
        });
        return;
      }

      if (race.finished) {
        socket.emit('error_event', {
          message: 'Cette course est terminée',
          code: 409,
        });
        return;
      }

      const existingRaceId = socketRace.get(socket.id);

      if (existingRaceId && existingRaceId !== race_id) {
        socket.emit('error_event', {
          message: 'Vous participez déjà à une autre course',
          code: 409,
        });
        return;
      }

      socket.join(`race:${race_id}`);
      socketRace.set(socket.id, race_id);

      // Update socket_id: the game socket ≠ the lobby socket; this also
      // handles reconnection (same user_id, new socket).
      player.socket_id = socket.id;
      player.connected = true;

      if (player.disconnect_timer) {
        clearTimeout(player.disconnect_timer);
        player.disconnect_timer = undefined;
      }

      setInGame(user.id);

      const room = io.sockets.adapter.rooms.get(`race:${race_id}`);
      if (room && room.size === race.players.size && !race.started) {
        race.started = true;
        const now = Date.now();
        for (const p of race.players.values()) 
          p.start_time = now;

        race.enemy_tick_timer = setInterval(() => {
          race.enemies = race.enemies.map(e => stepEnemy(e, race.grid));

          for (const p of race.players.values()) {
            if (!p.alive || p.finished) continue;
            const hit = race.enemies.some(e => e.x === p.position.x && e.y === p.position.y);
            if (hit) resolvePlayerLoss(io, race, p.user.id);
          }

          if (!race.finished) io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
        }, ENEMY_TICK_MS);

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

      const now = Date.now();
      if (player.last_input_at !== undefined && now - player.last_input_at < MIN_INPUT_INTERVAL_MS) return;
      player.last_input_at = now;

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

      // Also check collision here (in addition to the enemy tick): otherwise a
      // player who steps onto an enemy's tile between two ticks (400ms)
      // is never detected if the enemy has already moved by the next tick —
      // cf. backend_doc/duel-server-authoritative-enemies.md.
      const hitEnemy = race.enemies.some(e => e.x === nx && e.y === ny);
      if (hitEnemy) {
        resolvePlayerLoss(io, race, user.id);
        return;
      }

      if (race.grid[ny][nx] === TILE.EXIT) {
        player.finished    = true;
        player.finish_time = Date.now();

        io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
        if (isRaceOver(race)) void finishRace(io, race);
        return;
      }

      io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      setOffline(user.id);
      console.log(`[duel] ${user.username} disconnected`);
      // Immediate deregistration from pending lobbies — no grace
      // period outside of an active race.
      cleanupLobby(socket.id);

      const race_id = socketRace.get(socket.id);
      socketRace.delete(socket.id);

      if (race_id) {
        const race = activeRaces.get(race_id);
        const player = race?.players.get(user.id);

        // Ignore if another socket has already taken over this player (reconnection
        // faster than the propagation of the old socket's 'disconnect' event).
        if (race && !race.finished && player && player.socket_id === socket.id && player.alive && !player.finished) {
          player.connected = false;
          player.disconnect_timer = setTimeout(() => {
            const stillDisconnected = race.players.get(user.id);
            if (stillDisconnected && !stillDisconnected.connected) {
              resolvePlayerLoss(io, race, user.id);
            }
          }, DISCONNECT_GRACE_MS);
        }
      }

      io.emit('lobby_state', { entries: getLobbyEntries() });
    });
  });
}
