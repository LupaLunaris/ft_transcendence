
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';

const router = Router();

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

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      tower_progress: orderIndex,
      diamonds: { increment: 1 },
    },
  });

  sendSuccess(res, { tower_progress: updated.tower_progress, diamonds: updated.diamonds });
});

export default router;
