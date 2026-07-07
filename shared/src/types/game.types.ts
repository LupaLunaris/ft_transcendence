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
  finished: boolean;
}

export type EnemyKind = 'horizontal' | 'vertical';

export interface EnemyState {
  id: string;
  kind: EnemyKind;
  position: Position;
  direction: Direction;
}

export interface GameState {
  race_id: string;
  map_id: string;
  players: PlayerState[];
  enemies: EnemyState[];
  tick: number;
  started: boolean;
  finished: boolean;
}

// Classement complet — 2 à 4 entrées, triées par rank croissant.
// duration_ms est null pour un joueur qui n'a pas atteint l'EXIT (mort ou forfait).
export interface RaceRankingEntry {
  user_id: string;
  username: string;
  rank: number;
  duration_ms: number | null;
  finished: boolean;
}

export interface RaceResult {
  race_id: string;
  map_id: string;
  ranking: RaceRankingEntry[];
  created_at: string;
}
