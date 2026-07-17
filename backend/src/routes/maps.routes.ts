/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* maps.routes.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Router, Request, Response } from 'express';
import { Map as PrismaMap } from '@prisma/client';
import { MapData, MapSummary, Grid, Difficulty } from '@ft/shared';
import prisma from '../lib/prisma';
import { validateBody } from '../middleware/validate.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import { createMapSchema, updateMapSchema } from '../schemas/map.schemas';
import { NextFunction } from 'express';
import { AppError, ForbiddenError, NotFoundError } from '../errors';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import {
  rewardFirstMapPublication,
  rewardTestMapCompletion,
} from '../services/gamification.service';

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const router = Router();

const DIFFICULTY_TO_DB: Record<Difficulty, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

function toMapData(map: PrismaMap): MapData {
  return {
    id: map.id,
    name: map.name,
    grid: JSON.parse(map.grid_json) as Grid,
    creator_id: map.creator_id,
    published: map.published,
    creator_completed: map.creator_completed,
    difficulty: parseDifficulty(map.difficulty),
    play_count: map.play_count,
    created_at: map.created_at.toISOString(),
  };
}

function toMapSummary(map: PrismaMap): MapSummary {
  return {
    id: map.id,
    name: map.name,
    creator_id: map.creator_id,
    published: map.published,
    difficulty: parseDifficulty(map.difficulty),
    play_count: map.play_count,
  };
}

function parseDifficulty(value: string): Difficulty {
  const lower = value.toLowerCase();
  if (!(lower in DIFFICULTY_TO_DB)) {
    throw new Error(`Unexpected difficulty value: ${value}`);
  }
  return lower as Difficulty;
}

async function requireMapOwner(id: string, userId: string) {
  const map = await prisma.map.findUnique({ where: { id } });
  if (!map) 
    throw new NotFoundError('Map not found');
  if (map.creator_id !== userId)
    throw new ForbiddenError();
  return map;
}

// GET /api/v1/maps/my — must be defined BEFORE /:id
router.get('/my', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const maps = await prisma.map.findMany({
    where: { creator_id: req.user!.id },
    orderBy: { created_at: 'desc' },
  });

  sendSuccess(res, maps.map(toMapData));
}));

// GET /api/v1/maps
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const difficultyParam = req.query.difficulty as string | undefined;
  const difficultyFilter = difficultyParam && difficultyParam in DIFFICULTY_TO_DB ? { difficulty: DIFFICULTY_TO_DB[difficultyParam as Difficulty] } : {};

  const [maps, total] = await prisma.$transaction([
    prisma.map.findMany({
      where: { published: true, ...difficultyFilter },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.map.count({ where: { published: true, ...difficultyFilter } }),
  ]);

  res.json({ data: maps.map(toMapSummary), total, page, limit });
}));

// GET /api/v1/maps/:id — accessible by UUID (published or creator testing)
router.get('/:id', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const map = await prisma.map.findUnique({
    where: { id: req.params.id },
  });

  if (!map) {
    sendError(res, 'Map not found', 404);
    return;
  }

  if (!map.published && map.creator_id !== req.user?.id) {
    sendError(res, 'Map not found', 404);
    return;
  }

  sendSuccess(res, toMapData(map));
}));

// POST /api/v1/maps
router.post('/', authMiddleware, validateBody(createMapSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, grid } = req.body as { name: string; grid: Grid };

  const [map] = await prisma.$transaction([
    prisma.map.create({
      data: {
        name,
        grid_json: JSON.stringify(grid),
        creator_id: req.user!.id,
      },
    }),
    prisma.user.update({
      where: { id: req.user!.id },
      data: { created_maps_count: { increment: 1 } },
    }),
  ]);

  sendSuccess(res, toMapData(map), 201);
}));

// PUT /api/v1/maps/:id
router.put('/:id', authMiddleware, validateBody(updateMapSchema), asyncHandler(async (req: Request, res: Response) => {
  const { name, grid } = req.body as { name?: string; grid?: Grid };

  const map = await requireMapOwner(req.params.id, req.user!.id);
  
  if (map.published) {
    sendError(res, 'Published maps cannot be modified', 400);
    return;
  }

  const updated = await prisma.map.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(grid !== undefined && { grid_json: JSON.stringify(grid) }),
    },
  });

  sendSuccess(res, toMapData(updated));
}));

// DELETE /api/v1/maps/:id
router.delete('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  await requireMapOwner(req.params.id, req.user!.id);

  await prisma.$transaction([
  prisma.map.delete({ where: { id: req.params.id } }),
  prisma.user.update({
    where: { id: req.user!.id },
    data: { created_maps_count: { decrement: 1 } },
  }),
  ]);

  res.status(204).send();
}));

// POST /api/v1/maps/:id/complete
router.post('/:id/complete', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const map = await requireMapOwner(req.params.id, req.user!.id);

  const { updated, reward } = await prisma.$transaction(async (tx) => {
    const updated = map.creator_completed
      ? map
      : await tx.map.update({
        where: { id: req.params.id },
        data: { creator_completed: true },
      });

    const reward = map.creator_completed
      ? undefined
      : await rewardTestMapCompletion(tx, req.user!.id, req.params.id);

    return { updated, reward };
  });

  sendSuccess(res, { ...toMapData(updated), reward });
}));

// POST /api/v1/maps/:id/publish
router.post('/:id/publish', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const map = await requireMapOwner(req.params.id, req.user!.id);

  if (!map.creator_completed) {
    sendError(res, 'You must complete your own map before publishing it', 400);
    return;
  }

  const { updated, reward } = await prisma.$transaction(async (tx) => {
    const updated = await tx.map.update({
      where: { id: req.params.id },
      data: { published: true },
    });

    const reward = map.published
      ? undefined
      : await rewardFirstMapPublication(tx, req.user!.id);

    return { updated, reward };
  });

  sendSuccess(res, { ...toMapData(updated), reward });
}));

// POST /api/v1/maps/:id/unpublish
router.post('/:id/unpublish', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const map = await requireMapOwner(req.params.id, req.user!.id);

  if (!map.published) {
    sendError(res, 'Map is not published', 400);
    return;
  }

  const updated = await prisma.map.update({
    where: { id: req.params.id },
    data: { published: false },
  });

  sendSuccess(res, toMapData(updated));
}));

router.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }
  console.error(err);
  sendError(res, 'Internal server error', 500);
});

export default router;
