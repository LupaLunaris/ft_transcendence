/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* maps.routes.test.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { TILE, GRID_SIZE } from '@ft/shared';
import { makeValidGrid } from './helpers/grid.helper';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const mockPrisma = {
  map: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
  score: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('../lib/prisma', () => ({ __esModule: true, default: mockPrisma }));

// ─── App setup ───────────────────────────────────────────────────────────────

import mapsRouter from '../routes/maps.routes';

const SECRET = 'test_jwt_secret';

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

beforeEach(() => {
  jest.clearAllMocks();
});

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use('/api/v1/maps', mapsRouter);

const USER_ID = 'creator-uuid';
const authHeader = `Bearer ${jwt.sign({ id: USER_ID, email: 'creator@example.com', is_admin: false }, SECRET)}`;

const baseMap = {
  id: 'map-uuid-1',
  name: 'Test Map',
  grid_json: JSON.stringify(makeValidGrid()),
  creator_id: USER_ID,
  published: true,
  creator_completed: true,
  difficulty: 'EASY' as const,
  play_count: 0,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

// ─── GET /api/v1/maps ────────────────────────────────────────────────────────

describe('GET /api/v1/maps', () => {
  it('returns paginated published maps', async () => {
    mockPrisma.$transaction.mockResolvedValue([[baseMap], 1]);

    const res = await request(app).get('/api/v1/maps');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].difficulty).toBe('easy');
  });
});

// ─── GET /api/v1/maps/my ─────────────────────────────────────────────────────

describe('GET /api/v1/maps/my', () => {
  it('returns all maps for authenticated user', async () => {
    mockPrisma.map.findMany.mockResolvedValue([{ ...baseMap, published: false }]);

    const res = await request(app)
      .get('/api/v1/maps/my')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/maps/my');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/v1/maps/:id ────────────────────────────────────────────────────

describe('GET /api/v1/maps/:id', () => {
  it('returns map data for a published map', async () => {
    mockPrisma.map.findUnique.mockResolvedValue(baseMap);

    const res = await request(app).get('/api/v1/maps/map-uuid-1');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('map-uuid-1');
    expect(res.body.data.difficulty).toBe('easy');
  });

  it('returns 404 for an unknown map', async () => {
    mockPrisma.map.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/maps/unknown');
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/v1/maps ───────────────────────────────────────────────────────

describe('POST /api/v1/maps', () => {
  it('creates a map and returns 201', async () => {
    const createdMap = { ...baseMap, published: false };
    mockPrisma.$transaction.mockResolvedValue([createdMap, {}]);

    const res = await request(app)
      .post('/api/v1/maps')
      .set('Authorization', authHeader)
      .send({ name: 'Test Map', grid: makeValidGrid() });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Map');
  });

  it('returns 400 for an invalid grid (wrong size)', async () => {
    const res = await request(app)
      .post('/api/v1/maps')
      .set('Authorization', authHeader)
      .send({ name: 'Bad Map', grid: [[0, 1], [1, 0]] });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a grid without path', async () => {
    const grid = makeValidGrid();
    // Wall off EXIT completely
    const exitCol = GRID_SIZE - 2;
    grid[1][exitCol - 1] = TILE.WALL;
    grid[2][exitCol] = TILE.WALL;

    const res = await request(app)
      .post('/api/v1/maps')
      .set('Authorization', authHeader)
      .send({ name: 'No Path Map', grid });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/maps')
      .send({ name: 'Test Map', grid: makeValidGrid() });
    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/v1/maps/:id ────────────────────────────────────────────────────

describe('PUT /api/v1/maps/:id', () => {
  it('resets creator_completed when the grid is updated', async () => {
    mockPrisma.map.findUnique.mockResolvedValue({
      ...baseMap,
      published: false,
      creator_completed: true,
    });
    mockPrisma.map.update.mockResolvedValue({
      ...baseMap,
      published: false,
      creator_completed: false,
    });

    const res = await request(app)
      .put('/api/v1/maps/map-uuid-1')
      .set('Authorization', authHeader)
      .send({ grid: makeValidGrid() });

    expect(res.status).toBe(200);
    expect(mockPrisma.map.update).toHaveBeenCalledWith({
      where: { id: 'map-uuid-1' },
      data: expect.objectContaining({ creator_completed: false }),
    });
    expect(res.body.data.creator_completed).toBe(false);
  });

  it('does not touch creator_completed when only the name is updated', async () => {
    mockPrisma.map.findUnique.mockResolvedValue({
      ...baseMap,
      published: false,
      creator_completed: true,
    });
    mockPrisma.map.update.mockResolvedValue({
      ...baseMap,
      published: false,
      name: 'Renamed',
    });

    const res = await request(app)
      .put('/api/v1/maps/map-uuid-1')
      .set('Authorization', authHeader)
      .send({ name: 'Renamed' });

    expect(res.status).toBe(200);
    const updateData = mockPrisma.map.update.mock.calls[0][0].data;
    expect(updateData).not.toHaveProperty('creator_completed');
  });

  it('returns 400 when the map is currently published', async () => {
    mockPrisma.map.findUnique.mockResolvedValue({
      ...baseMap,
      published: true,
    });

    const res = await request(app)
      .put('/api/v1/maps/map-uuid-1')
      .set('Authorization', authHeader)
      .send({ grid: makeValidGrid() });

    expect(res.status).toBe(400);
  });
});

// ─── POST /api/v1/maps/:id/publish ───────────────────────────────────────────

describe('POST /api/v1/maps/:id/publish', () => {
  it('publishes a completed map', async () => {
    mockPrisma.map.findUnique.mockResolvedValue({
      ...baseMap,
      published: false,
      creator_completed: true,
    });
    mockPrisma.map.update.mockResolvedValue({ ...baseMap, published: true });

    const res = await request(app)
      .post('/api/v1/maps/map-uuid-1/publish')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.published).toBe(true);
  });

  it('returns 400 when creator has not completed the map', async () => {
    mockPrisma.map.findUnique.mockResolvedValue({
      ...baseMap,
      published: false,
      creator_completed: false,
    });

    const res = await request(app)
      .post('/api/v1/maps/map-uuid-1/publish')
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
  });

  it('returns 403 when user is not the creator', async () => {
    mockPrisma.map.findUnique.mockResolvedValue({
      ...baseMap,
      creator_id: 'someone-else',
    });

    const res = await request(app)
      .post('/api/v1/maps/map-uuid-1/publish')
      .set('Authorization', authHeader);

    expect(res.status).toBe(403);
  });
});
