/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* tower.complete.test.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/17 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/17 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  adminMap: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

function makeLevel(order_index: number) {
  const SIZE = 25;
  const grid: number[][] = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (__, c) => {
      return r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1 ? 1 : 0;
    }),
  );
  grid[1][1] = 3;
  grid[SIZE - 2][SIZE - 2] = 2;
  return {
    id: `level-${order_index}`,
    order_index,
    name: `Niveau ${order_index}`,
    grid_json: JSON.stringify(grid),
    created_at: new Date('2026-01-01'),
  };
}

jest.mock('../lib/prisma', () => ({ __esModule: true, default: mockPrisma }));

import towerRouter from '../routes/tower.routes';

const SECRET = 'test_secret';

beforeAll(() => { process.env.JWT_SECRET = SECRET; });
beforeEach(() => { jest.clearAllMocks(); });

function makeUser(tower_progress: number, diamonds = 0) {
  return {
    id: 'user-uuid-1',
    email: 'alice@example.com',
    username: 'alice',
    password_hash: 'hash',
    avatar: null,
    diamonds,
    tower_progress,
    created_maps_count: 0,
    is_admin: false,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function token(_progress = 0): string {
  return jwt.sign({ id: 'user-uuid-1', email: 'alice@example.com', is_admin: false }, SECRET);
}

const app = express();
app.use(express.json());
app.use('/api/v1/tower', towerRouter);

// ─── GET /tower ──────────────────────────────────────────────────────────────

describe('GET /api/v1/tower', () => {
  it('returns public list of levels without grid_json', async () => {
    mockPrisma.adminMap.findMany.mockResolvedValue([
      { id: 'l1', order_index: 1, name: 'Les Catacombes' },
      { id: 'l2', order_index: 2, name: 'Salle du Trône' },
    ]);

    const res = await request(app).get('/api/v1/tower');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].order_index).toBe(1);
    expect(res.body.data[0].grid_json).toBeUndefined();
  });

  it('returns empty array when no levels are seeded', async () => {
    mockPrisma.adminMap.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/v1/tower');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('requires no authentication', async () => {
    mockPrisma.adminMap.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/v1/tower');
    expect(res.status).toBe(200);
  });
});

// ─── GET /tower/:order_index ──────────────────────────────────────────────────

describe('GET /api/v1/tower/:order_index', () => {
  it('returns level with grid for the current unlocked level (progress=0 → level 1)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser(0));
    mockPrisma.adminMap.findUnique.mockResolvedValue(makeLevel(1));

    const res = await request(app)
      .get('/api/v1/tower/1')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.order_index).toBe(1);
    expect(Array.isArray(res.body.data.grid_json)).toBe(true);
    expect(res.body.data.grid_json).toHaveLength(25);
  });

  it('allows re-accessing a previously completed level (progress=5, level=3)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser(5));
    mockPrisma.adminMap.findUnique.mockResolvedValue(makeLevel(3));

    const res = await request(app)
      .get('/api/v1/tower/3')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
  });

  it('returns 403 when trying to access a locked level (progress=0, level=2)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser(0));

    const res = await request(app)
      .get('/api/v1/tower/2')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/unlock/i);
  });

  it('returns 403 when trying to skip ahead by several levels', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser(2));

    const res = await request(app)
      .get('/api/v1/tower/5')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 when level exists in range but has not been seeded by admin', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser(8));
    mockPrisma.adminMap.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/v1/tower/7')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/tower/1');
    expect(res.status).toBe(401);
  });
});

// ─── POST /tower/:order_index/complete ───────────────────────────────────────

describe('POST /api/v1/tower/:order_index/complete', () => {
  it('completes level 1 from progress 0', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser(0));
    mockPrisma.user.update.mockResolvedValue(makeUser(1, 1));

    const res = await request(app)
      .post('/api/v1/tower/1/complete')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tower_progress).toBe(1);
    expect(res.body.data.diamonds).toBe(1);
  });

  it('returns 403 when trying to skip a level', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser(0));

    const res = await request(app)
      .post('/api/v1/tower/3/complete')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/order/i);
  });

  it('returns 403 when trying to re-complete a finished level', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser(3));

    const res = await request(app)
      .post('/api/v1/tower/1/complete')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(403);
  });

  it('returns 400 for order_index > 8', async () => {
    const res = await request(app)
      .post('/api/v1/tower/9/complete')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(400);
  });

  it('returns 400 for order_index 0', async () => {
    const res = await request(app)
      .post('/api/v1/tower/0/complete')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/v1/tower/1/complete');
    expect(res.status).toBe(401);
  });

  it('completes level 8 from progress 7', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser(7, 7));
    mockPrisma.user.update.mockResolvedValue(makeUser(8, 8));

    const res = await request(app)
      .post('/api/v1/tower/8/complete')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tower_progress).toBe(8);
    expect(res.body.data.diamonds).toBe(8);
  });
});
