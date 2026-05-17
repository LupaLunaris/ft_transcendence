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

function token(progress = 0): string {
  return jwt.sign({ id: 'user-uuid-1', email: 'alice@example.com', is_admin: false }, SECRET);
}

const app = express();
app.use(express.json());
app.use('/api/v1/tower', towerRouter);

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
