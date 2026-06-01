/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* socket.types.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42be                 +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis           #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jpaulis         ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Direction, GameState, PlayerState, RaceResult } from './game.types';
import { Grid } from './tiles.types';

export interface LobbyEntry {
  map_id: string;
  player: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export interface DuelStartPayload {
  race_id: string;
  map_id: string;
  grid: Grid;
  opponent: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export interface ClientToServerEvents {
  player_input: (data: { direction: Direction }) => void;
  join_lobby: (data: { map_id: string }) => void;
  leave_lobby: () => void;
  join_race: (data: { race_id: string }) => void;
  player_died: () => void;
}

export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  race_finished: (result: RaceResult) => void;
  player_joined: (player: PlayerState) => void;
  player_left: (data: { player_id: string }) => void;
  error_event: (data: { message: string; code: number }) => void;
  lobby_state: (data: { entries: LobbyEntry[] }) => void;
  duel_start: (payload: DuelStartPayload) => void;
}
