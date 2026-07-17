/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* map.types.ts                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42be                 +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis           #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jpaulis         ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Grid } from './tiles.types';
import type { RewardResult } from './gamification.types';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface MapData {
  id: string;
  name: string;
  grid: Grid;
  creator_id: string;
  published: boolean;
  creator_completed: boolean;
  difficulty: Difficulty;
  play_count: number;
  created_at: string;
  reward?: RewardResult;
}

export interface MapSummary {
  id: string;
  name: string;
  creator_id: string;
  published: boolean;
  difficulty: Difficulty;
  play_count: number;
}

export interface CreateMapRequest {
  name: string;
  grid: Grid;
}

export interface UpdateMapRequest {
  name?: string;
  grid?: Grid;
}
