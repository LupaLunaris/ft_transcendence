/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* map.schemas.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { z } from 'zod';
import { Grid } from '@ft/shared';
import { validateGrid, hasPath } from '../utils/grid.utils';

const gridSchema = z.custom<Grid>(
  (val) => validateGrid(val) && hasPath(val as Grid),
  'Grid must be a valid 25x25 map with WALL borders, exactly one SPAWN and one EXIT, and a clear path between them',
);

export const createMapSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  grid: gridSchema,
});

export const updateMapSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters').optional(),
  grid: gridSchema.optional(),
});

export const scoreSchema = z.object({
  map_id: z.string().uuid('Invalid map id'),
  completion_time_ms: z.number().int().positive('Completion time must be a positive integer'),
});

export type CreateMapInput = z.infer<typeof createMapSchema>;
export type UpdateMapInput = z.infer<typeof updateMapSchema>;
export type ScoreInput = z.infer<typeof scoreSchema>;
