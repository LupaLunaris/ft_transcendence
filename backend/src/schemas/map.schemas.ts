
import { z } from 'zod';
import { Grid } from '@ft/shared';
import { validateGrid, hasPath } from '../utils/grid.utils';

const gridSchema = z
  .custom<Grid>(
    validateGrid,
    'Invalid grid: must be 25x25 with WALL borders, valid tile values, exactly 1 SPAWN and 1 EXIT',
  )
  .refine(
    (val) => !validateGrid(val) || hasPath(val as Grid),
    'No clear path from SPAWN to EXIT',
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
