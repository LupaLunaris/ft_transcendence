/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* admin.routes.test.ts                                 :+:      :+:    :+:   */
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

const mockAdminMap = {
  id: 'map-uuid-1',
  order_index: 1,
  name: 'Les Catacombes',
  grid_json: JSON.stringify(makeMinimalGrid()),
  created_at: new Date('2026-01-01'),
};

const mockPrisma = {
  adminMap: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => ({ __esModule: true, default: mockPrisma }));

import adminRouter from '../routes/admin.routes';

const SECRET = 'test_secret';

beforeAll(() => { process.env.JWT_SECRET = SECRET; });
beforeEach(() => { jest.clearAllMocks(); });

function makeMinimalGrid(): number[][] {
  const SIZE = 25;
  const g: number[][] = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (__, c) => {
      const border = r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1;
      return border ? 1 : 0;
    }),
  );
  g[1][1] = 3;
  g[SIZE - 2][SIZE - 2] = 2;
  return g;
}

function adminToken(): string {
  return jwt.sign({ id: 'u1', email: 'admin@example.com', is_admin: true }, SECRET);
}

function userToken(): string {
  return jwt.sign({ id: 'u2', email: 'user@example.com', is_admin: false }, SECRET);
}

const app = express();
app.use(express.json());
app.use('/api/v1/admin', adminRouter);

// ─── GET /tower ───────────────────────────────────────────────────────────────

describe('GET /api/v1/admin/tower', () => {
  it('returns 200 with levels for admin', async () => {
    mockPrisma.adminMap.findMany.mockResolvedValue([mockAdminMap]);

    const res = await request(app)
      .get('/api/v1/admin/tower')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].order_index).toBe(1);
    expect(Array.isArray(res.body.data[0].grid_json)).toBe(true);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/v1/admin/tower')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/admin/tower');
    expect(res.status).toBe(401);
  });
});

// ─── PUT /tower/:order_index ──────────────────────────────────────────────────

describe('PUT /api/v1/admin/tower/:order_index', () => {
  it('creates the map if it does not exist', async () => {
    mockPrisma.adminMap.findUnique.mockResolvedValue(null);
    mockPrisma.adminMap.create.mockResolvedValue({ ...mockAdminMap, order_index: 2 });

    const res = await request(app)
      .put('/api/v1/admin/tower/2')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'New Level' });

    expect(res.status).toBe(200);
    expect(mockPrisma.adminMap.create).toHaveBeenCalled();
  });

  it('updates the map if it exists', async () => {
    mockPrisma.adminMap.findUnique.mockResolvedValue(mockAdminMap);
    mockPrisma.adminMap.update.mockResolvedValue({ ...mockAdminMap, name: 'Renamed' });

    const res = await request(app)
      .put('/api/v1/admin/tower/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Renamed' });

    expect(res.status).toBe(200);
    expect(mockPrisma.adminMap.update).toHaveBeenCalled();
  });

  it('returns 400 for order_index 0', async () => {
    const res = await request(app)
      .put('/api/v1/admin/tower/0')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Bad' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for order_index 9', async () => {
    const res = await request(app)
      .put('/api/v1/admin/tower/9')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Bad' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid grid_json (not 25x25)', async () => {
    const badGrid = JSON.stringify([[1, 2], [3, 4]]);

    const res = await request(app)
      .put('/api/v1/admin/tower/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ grid_json: badGrid });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/grid/i);
  });

  it('returns 400 for grid_json that is not valid JSON', async () => {
    const res = await request(app)
      .put('/api/v1/admin/tower/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ grid_json: 'not-json' });

    expect(res.status).toBe(400);
  });

  it('accepts a valid 25x25 grid', async () => {
    mockPrisma.adminMap.findUnique.mockResolvedValue(mockAdminMap);
    mockPrisma.adminMap.update.mockResolvedValue(mockAdminMap);
    const validGrid = JSON.stringify(makeMinimalGrid());

    const res = await request(app)
      .put('/api/v1/admin/tower/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ grid_json: validGrid });

    expect(res.status).toBe(200);
  });
});
