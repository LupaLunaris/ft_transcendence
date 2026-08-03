
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-uuid-1',
  email: 'alice@example.com',
  username: 'alice',
  password_hash: bcrypt.hashSync('password123', 1),
  avatar: null,
  xp: 0,
  achievements: [],
  diamonds: 0,
  tower_progress: 0,
  created_maps_count: 0,
  is_admin: false,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../lib/prisma', () => ({ __esModule: true, default: mockPrisma }));

// ─── App setup ───────────────────────────────────────────────────────────────

import authRouter from '../routes/auth.routes';

const SECRET = 'test_jwt_secret';

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
  process.env.JWT_EXPIRES_IN = '7d';
});

beforeEach(() => {
  jest.clearAllMocks();
});

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);

// ─── POST /register ───────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  it('creates a user and returns 201 with token', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'alice@example.com',
      username: 'alice',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('alice');
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('returns 409 when email is already taken', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'alice@example.com',
      username: 'bob',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/);
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      username: 'alice',
      password: 'password123',
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for username shorter than 3 chars', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'alice@example.com',
      username: 'ab',
      password: 'password123',
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for password shorter than 8 chars', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'alice@example.com',
      username: 'alice',
      password: 'short',
    });

    expect(res.status).toBe(400);
  });
});

// ─── POST /login ──────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with token on valid credentials', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/v1/auth/login').send({
      identifier: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    const payload = jwt.decode(res.body.data.token) as Record<string, unknown>;
    expect(payload.id).toBe(mockUser.id);
  });

  it('returns 401 when user does not exist', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const res = await request(app).post('/api/v1/auth/login').send({
      identifier: 'ghost@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 on wrong password', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/v1/auth/login').send({
      identifier: 'alice@example.com',
      password: 'wrong_password',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});

// ─── GET /me ─────────────────────────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  it('returns the current user when authenticated', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    const token = jwt.sign({ id: mockUser.id, email: mockUser.email, is_admin: false }, SECRET);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(mockUser.id);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
