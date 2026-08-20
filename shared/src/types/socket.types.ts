
import { Direction, GameState, PlayerState, RaceResult } from './game.types';
import { Grid } from './tiles.types';
import { RewardResult } from './gamification.types';

export interface LobbyEntry {
  map_id: string;
  // Queue for this map — 1 to 4 players (MAX_LOBBY_PLAYERS server-side).
  players: {
    id: string;
    username: string;
    avatar: string | null;
  }[];
  // Race start timestamp (ms), or null while only one player is waiting
  // (the countdown only starts once 2 players are registered).
  countdown_ends_at: number | null;
}

export interface DuelStartPayload {
  race_id: string;
  map_id: string;
  grid: Grid;
  // 1 to 3 opponents (race of 2 to 4 players).
  opponents: {
    id: string;
    username: string;
    avatar: string | null;
  }[];
}

export interface ClientToServerEvents {
  player_input: (data: { direction: Direction }) => void;
  join_lobby: (data: { map_id: string }) => void;
  leave_lobby: () => void;
  join_race: (data: { race_id: string }) => void;
}

export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  race_finished: (result: RaceResult) => void;
  player_joined: (player: PlayerState) => void;
  player_left: (data: { player_id: string }) => void;
  error_event: (data: { message: string; code: number }) => void;
  lobby_state: (data: { entries: LobbyEntry[] }) => void;
  duel_start: (payload: DuelStartPayload) => void;
  // Emitted only to the winner of a race (rank 1, cf. duelHandler.ts#finishRace)
  reward_earned: (reward: RewardResult) => void;
}
