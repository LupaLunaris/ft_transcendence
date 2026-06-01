/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* admin.routes.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/17 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/17 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import { validateGrid } from '../utils/grid.utils';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// GET /api/v1/admin/tower — 8 AdminMap sorted by order_index with full grid_json
router.get('/tower', async (_req: Request, res: Response) => {
  const levels = await prisma.adminMap.findMany({
    orderBy: { order_index: 'asc' },
  });

  sendSuccess(res, levels.map((l) => ({ ...l, grid_json: JSON.parse(l.grid_json) })));
});

// PUT /api/v1/admin/tower/:order_index — upsert an AdminMap
router.put('/tower/:order_index', async (req: Request, res: Response) => {
  const orderIndex = parseInt(req.params.order_index, 10);

  if (isNaN(orderIndex) || orderIndex < 1 || orderIndex > 8) {
    sendError(res, 'order_index must be between 1 and 8', 400);
    return;
  }

  const { name, grid_json } = req.body as { name?: string; grid_json?: string };

  if (grid_json !== undefined) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(grid_json);
    } catch {
      sendError(res, 'grid_json is not valid JSON', 400);
      return;
    }
    if (!validateGrid(parsed)) {
      sendError(res, 'grid_json must be a valid 25x25 grid (valid tile values, borders WALL, 1 SPAWN, 1 EXIT)', 400);
      return;
    }
  }

  const existing = await prisma.adminMap.findUnique({ where: { order_index: orderIndex } });

  const level = existing
    ? await prisma.adminMap.update({
        where: { order_index: orderIndex },
        data: {
          ...(name !== undefined && { name }),
          ...(grid_json !== undefined && { grid_json }),
        },
      })
    : await prisma.adminMap.create({
        data: {
          order_index: orderIndex,
          name: name ?? `Niveau ${orderIndex}`,
          grid_json: grid_json ?? JSON.stringify(makeEmptyGrid()),
        },
      });

  sendSuccess(res, { ...level, grid_json: JSON.parse(level.grid_json) });
});

function makeEmptyGrid(): number[][] {
  const SIZE = 25;
  const grid: number[][] = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (__, c) => {
      const isBorder = r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1;
      return isBorder ? 1 : 0;
    }),
  );
  grid[1][1] = 3; // SPAWN
  grid[SIZE - 2][SIZE - 2] = 2; // EXIT
  return grid;
}

export default router;
