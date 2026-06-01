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

export interface ClientToServerEvents {
  player_input: (data: { direction: Direction }) => void;
  join_lobby: (data: { map_id: string }) => void;
  leave_lobby: () => void;
}

export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  race_finished: (result: RaceResult) => void;
  player_joined: (player: PlayerState) => void;
  player_left: (data: { player_id: string }) => void;
  error_event: (data: { message: string; code: number }) => void;
}
