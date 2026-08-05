import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}

const TOWER_RUN_EXPIRY = '30m';
const TOWER_RUN_MAX_AGE_MS = 30 * 60 * 1000;
const MIN_TOWER_RUN_TIME_MS = 3_000;

interface TowerRunPayload {
  user_id: string;
  order_index: number;
  started_at: number;
  nonce: string;
}

const usedTowerRunNonces = new Set<string>();

// GET /api/v1/tower — list of 8 admin maps (no grid)
router.get('/', async (_req: Request, res: Response) => {
  const levels = await prisma.adminMap.findMany({
    orderBy: { order_index: 'asc' },
    select: { id: true, order_index: true, name: true },
  });

  sendSuccess(res, levels);
});

// GET /api/v1/tower/:order_index — full admin map (protected, enforces progression)
router.get('/:order_index', authMiddleware, async (req: Request, res: Response) => {
  const orderIndex = parseInt(req.params.order_index, 10);

  if (isNaN(orderIndex) || orderIndex < 1) {
    sendError(res, 'Invalid level index', 400);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  // Player may only access levels up to tower_progress + 1 (no skipping)
  if (orderIndex > user.tower_progress + 1) {
    sendError(res, 'This level is not unlocked yet', 403);
    return;
  }

  const level = await prisma.adminMap.findUnique({ where: { order_index: orderIndex } });

  if (!level) {
    sendError(res, 'Level not found', 404);
    return;
  }

  sendSuccess(res, { ...level, grid_json: JSON.parse(level.grid_json) });
});

router.post('/:order_index/start', authMiddleware, async (req: Request, res: Response) => {
  const orderIndex = parseInt(req.params.order_index, 10);

  if (isNaN(orderIndex) || orderIndex < 1 || orderIndex > 8) {
    sendError(res, 'Invalid level index', 400);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      tower_progress: true,
    },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  if (orderIndex !== user.tower_progress + 1) {
    sendError(res, 'You must complete levels in order', 403);
    return;
  }

  const level = await prisma.adminMap.findUnique({
    where: { order_index: orderIndex },
    select: { id: true },
  });

  if (!level) {
    sendError(res, 'Level not found', 404);
    return;
  }

  const payload: TowerRunPayload = {
    user_id: user.id,
    order_index: orderIndex,
    started_at: Date.now(),
    nonce: crypto.randomUUID(),
  };

  const runToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOWER_RUN_EXPIRY,
  });

  sendSuccess(
    res,
    {
      run_token: runToken,
      started_at: payload.started_at,
    },
    201,
  );
});

// POST /api/v1/tower/:order_index/complete — validate level completion
router.post('/:order_index/complete', authMiddleware, async (req: Request, res: Response) => {
  const orderIndex = parseInt(req.params.order_index, 10);

  if (isNaN(orderIndex) || orderIndex < 1) {
    sendError(res, 'Invalid level index', 400);
    return;
  }

  if (orderIndex > 8) {
    sendError(res, 'Tower only has 8 levels', 400);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  if (orderIndex !== user.tower_progress + 1) {
    sendError(res, 'You must complete levels in order', 403);
    return;
  }

  const { run_token } = req.body as { run_token?: string };

  if (!run_token) {
    sendError(res, 'Run token is required', 400);
    return;
  }

  let payload: TowerRunPayload;

  try {
    payload = jwt.verify(run_token, JWT_SECRET) as TowerRunPayload;
  } catch {
    sendError(res, 'Invalid or expired run token', 401);
    return;
  }

  if (payload.user_id !== req.user!.id) {
    sendError(res, 'Run token does not belong to this user', 403);
    return;
  }

  if (payload.order_index !== orderIndex) {
    sendError(res, 'Run token does not match this level', 403);
    return;
  }

  if (usedTowerRunNonces.has(payload.nonce)) {
    sendError(res, 'Run token has already been used', 409);
    return;
  }

  const elapsed = Date.now() - payload.started_at;

  if (elapsed < MIN_TOWER_RUN_TIME_MS || elapsed > TOWER_RUN_MAX_AGE_MS) {
    sendError(res, 'Run duration is invalid', 400);
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      tower_progress: orderIndex,
      diamonds: { increment: 1 },
    },
  });

  usedTowerRunNonces.add(payload.nonce);

  setTimeout(() => {
    usedTowerRunNonces.delete(payload.nonce);
  }, TOWER_RUN_MAX_AGE_MS).unref();

  sendSuccess(res, { tower_progress: updated.tower_progress, diamonds: updated.diamonds });
});

export default router;
