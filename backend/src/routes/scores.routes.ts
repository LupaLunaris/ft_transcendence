/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* scores.routes.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import { scoreSchema } from '../schemas/map.schemas';
import { rewardPublicMapCompletion } from '../services/gamification.service';

const router = Router();

// POST /api/v1/scores
router.post('/', authMiddleware, validateBody(scoreSchema), async (req: Request, res: Response) => {
  const { map_id, completion_time_ms } = req.body as {
    map_id: string;
    completion_time_ms: number;
  };

  const map = await prisma.map.findUnique({ where: { id: map_id } });
  if (!map) {
    sendError(res, 'Map not found', 404);
    return;
  }

  const { score, reward } = await prisma.$transaction(async (tx) => {
    const score = await tx.score.create({
      data: {
        map_id,
        user_id: req.user!.id,
        completion_time_ms,
      },
    });

    const reward = map.published
      ? await rewardPublicMapCompletion(tx, req.user!.id, map_id)
      : undefined;

    return { score, reward };
  });

  sendSuccess(res, {
    id: score.id,
    map_id: score.map_id,
    user_id: score.user_id,
    completion_time_ms: score.completion_time_ms,
    created_at: score.created_at.toISOString(),
    reward,
  }, 201);
});

// GET /api/v1/scores/leaderboard/:map_id
router.get('/leaderboard/:map_id', async (req: Request, res: Response) => {
  const map = await prisma.map.findUnique({ where: { id: req.params.map_id } });
  if (!map) {
    sendError(res, 'Map not found', 404);
    return;
  }

  const scores = await prisma.score.findMany({
    where: { map_id: req.params.map_id },
    orderBy: { completion_time_ms: 'asc' },
    take: 10,
    include: {
      user: { select: { username: true } },
    },
  });

  const leaderboard = scores.map((s) => ({
    id: s.id,
    completion_time_ms: s.completion_time_ms,
    created_at: s.created_at.toISOString(),
    username: s.user.username,
  }));

  sendSuccess(res, leaderboard);
});

export default router;
