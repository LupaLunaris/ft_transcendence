/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* game.types.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42be                 +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis           #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jpaulis         ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface PlayerState {
  id: string;
  username: string;
  avatar: string | null;
  position: Position;
  direction: Direction;
  alive: boolean;
}

export interface GameState {
  race_id: string;
  map_id: string;
  players: PlayerState[];
  tick: number;
  started: boolean;
  finished: boolean;
}

export interface RaceResult {
  winner_id: string;
  loser_id: string;
  duration_ms: number;
  map_id: string;
  created_at: string;
}
