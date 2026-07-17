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
import type { LeaderboardEntry } from '@ft/shared';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import { scoreSchema } from '../schemas/map.schemas';
import { rewardPublicMapCompletion } from '../services/gamification.service';
import { upsertBestScore, POINTS_BY_RANK } from '../services/scoring.service';

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
    // Score ne garde que le record personnel du joueur sur cette map : un
    // temps moins bon qu'un essai précédent ne remplace pas la ligne.
    await upsertBestScore(tx, req.user!.id, map_id, completion_time_ms);
    const score = await tx.score.findUniqueOrThrow({
      where: { user_id_map_id: { user_id: req.user!.id, map_id } },
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

// GET /api/v1/scores/leaderboard/global
// Classement toutes maps confondues, par somme des points de classement de
// vitesse (cf. scoring.service.ts) — tous les joueurs ayant au moins un
// point (pas de limite). Doit rester déclaré avant /leaderboard/:map_id
// pour ne pas être capturé par ce paramètre.
router.get('/leaderboard/global', async (_req: Request, res: Response) => {
  const totals = await prisma.mapRankingPoints.groupBy({
    by: ['user_id'],
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: totals.map((t) => t.user_id) } },
    select: { id: true, username: true, avatar: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  const leaderboard: LeaderboardEntry[] = totals.map((t, i) => {
    const user = userById.get(t.user_id)!;
    return {
      rank: i + 1,
      user_id: user.id,
      username: user.username,
      avatar: user.avatar,
      points: t._sum.points ?? 0,
    };
  });

  sendSuccess(res, leaderboard);
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

// GET /api/v1/scores/leaderboard/:map_id/points
// Top 5 de cette map par vitesse — mêmes joueurs que MapRankingPoints (même
// requête, même ordre), mais lu directement depuis Score pour renvoyer le
// meilleur temps de chacun (affiché à la place des points côté frontend).
router.get('/leaderboard/:map_id/points', async (req: Request, res: Response) => {
  const map = await prisma.map.findUnique({ where: { id: req.params.map_id } });
  if (!map) {
    sendError(res, 'Map not found', 404);
    return;
  }

  const scores = await prisma.score.findMany({
    where: { map_id: req.params.map_id },
    orderBy: { completion_time_ms: 'asc' },
    take: POINTS_BY_RANK.length,
    include: { user: { select: { id: true, username: true, avatar: true } } },
  });

  const leaderboard: LeaderboardEntry[] = scores.map((s, i) => ({
    rank: i + 1,
    user_id: s.user.id,
    username: s.user.username,
    avatar: s.user.avatar,
    points: POINTS_BY_RANK[i],
    completion_time_ms: s.completion_time_ms,
  }));

  sendSuccess(res, leaderboard);
});

export default router;
