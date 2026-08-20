
import { Router, Request, Response } from 'express';
import type { LeaderboardEntry } from '@ft/shared';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import { startScoreRunSchema, finishScoreRunSchema } from '../schemas/map.schemas';
import { rewardPublicMapCompletion } from '../services/gamification.service';
import { upsertBestScore, POINTS_BY_RANK } from '../services/scoring.service';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const RUN_TOKEN_EXPIRY = '30m';
const RUN_TOKEN_MAX_AGE_MS = 30 * 60 * 1000;
const ALLOWED_TIME_DIFFERENCE_MS = 2_000;
// Same floor as tower.routes.ts's MIN_TOWER_RUN_TIME_MS: without it, a
// start -> immediate submit script nets a near-zero record without ever
// playing the map (the server only checked that completion_time_ms matched
// elapsed time, not that elapsed time was plausible for a real run).
const MIN_SCORE_RUN_TIME_MS = 3_000;

interface ScoreRunPayload {
  user_id: string;
  map_id: string;
  started_at: number;
  nonce: string;
}

const usedRunNonces = new Set<string>();

// POST /api/v1/scores/start
router.post(
  '/start',
  authMiddleware,
  validateBody(startScoreRunSchema),
  async (req: Request, res: Response) => {
    const { map_id } = req.body as { map_id: string };

    const map = await prisma.map.findUnique({
      where: { id: map_id },
      select: {
        id: true,
        published: true,
        creator_id: true,
      },
    });

    if (!map) {
      sendError(res, 'Map not found', 404);
      return;
    }

    const canPlay = map.published || map.creator_id === req.user!.id;

    if (!canPlay) {
      sendError(res, 'Map is not available', 403);
      return;
    }

    const payload: ScoreRunPayload = {
      user_id: req.user!.id,
      map_id,
      started_at: Date.now(),
      nonce: crypto.randomUUID(),
    };

    const runToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: RUN_TOKEN_EXPIRY,
    });

    sendSuccess(
      res,
      {
        run_token: runToken,
        started_at: payload.started_at,
      },
      201,
    );
  },
);

// POST /api/v1/scores
router.post(
  '/',
  authMiddleware,
  validateBody(finishScoreRunSchema),
  async (req: Request, res: Response) => {
    const { run_token, completion_time_ms } = req.body as {
      run_token: string;
      completion_time_ms: number;
    };

    let payload: ScoreRunPayload;

    try {
      payload = jwt.verify(run_token, JWT_SECRET) as ScoreRunPayload;
    } catch {
      sendError(res, 'Invalid or expired run token', 401);
      return;
    }

    if (payload.user_id !== req.user!.id) {
      sendError(res, 'Run token does not belong to this user', 403);
      return;
    }

    if (usedRunNonces.has(payload.nonce)) {
      sendError(res, 'Run token has already been used', 409);
      return;
    }

    const serverElapsed = Date.now() - payload.started_at;

    if (serverElapsed < MIN_SCORE_RUN_TIME_MS || serverElapsed > RUN_TOKEN_MAX_AGE_MS) {
      sendError(res, 'Run duration is invalid or expired', 400);
      return;
    }

    const timeDifference = Math.abs(serverElapsed - completion_time_ms);

    if (timeDifference > ALLOWED_TIME_DIFFERENCE_MS) {
      sendError(res, 'Submitted completion time does not match the server timer', 400);
      return;
    }

    const map = await prisma.map.findUnique({
      where: { id: payload.map_id },
    });

    if (!map) {
      sendError(res, 'Map not found', 404);
      return;
    }

    if (!map.published) {
      sendError(res, 'Map is not available', 403);
      return;
    }

    const { score, reward } = await prisma.$transaction(async (tx) => {
      await upsertBestScore(
        tx,
        req.user!.id,
        payload.map_id,
        serverElapsed,
      );

      const score = await tx.score.findUniqueOrThrow({
        where: {
          user_id_map_id: {
            user_id: req.user!.id,
            map_id: payload.map_id,
          },
        },
      });

      await tx.map.update({
        where: { id: payload.map_id },
        data: {
          play_count: {
            increment: 1,
          },
        },
      });

      const reward = await rewardPublicMapCompletion(
        tx,
        req.user!.id,
        payload.map_id,
      );

      return { score, reward };
    });

    usedRunNonces.add(payload.nonce);
    setTimeout(() => {
      usedRunNonces.delete(payload.nonce);
    }, RUN_TOKEN_MAX_AGE_MS).unref();

    sendSuccess(
      res,
      {
        id: score.id,
        map_id: score.map_id,
        user_id: score.user_id,
        completion_time_ms: score.completion_time_ms,
        created_at: score.created_at.toISOString(),
        reward,
      },
      201,
    );
  },
);

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
