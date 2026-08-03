
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserPublic, AuthResponse } from '@ft/shared';
import { User, UserAchievement } from '@prisma/client';
import prisma from '../lib/prisma';
import { getLevelFromXp } from '../services/gamification.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import { NextFunction } from 'express';
import { AppError } from '../errors';
import { toUserPublic } from '../utils/user.serializer';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../schemas/auth.schemas';

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET)
  throw new Error('JWT_SECRET is not set');

const router = Router();

type UserWithAchievements = User & { achievements?: UserAchievement[] };

function toUserPublic(user: UserWithAchievements): UserPublic {
  const xp = user.xp ?? 0;

  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    xp,
    level: getLevelFromXp(xp),
    achievements: (user.achievements ?? []).map((achievement) => ({
      code: achievement.code as UserPublic['achievements'][number]['code'],
      unlocked_at: achievement.unlocked_at.toISOString(),
    })),
    diamonds: user.diamonds,
    tower_progress: user.tower_progress,
    created_maps_count: user.created_maps_count,
    is_admin: user.is_admin,
    created_at: user.created_at.toISOString(),
  };
}

function signToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] },
  );
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim());

// POST /api/v1/auth/register
router.post('/register', validateBody(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body as { email: string; username: string; password: string };

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    sendError(res, `This ${field} is already taken`, 409);
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const is_admin = ADMIN_EMAILS.includes(email);

  const user = await prisma.user.create({
    data: { email, username, password_hash, is_admin },
    include: { achievements: true },
  });

  const response: AuthResponse = { user: toUserPublic(user), token: signToken(user) };
  sendSuccess(res, response, 201);
}));

// POST /api/v1/auth/login
router.post('/login', validateBody(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body as {
    identifier: string;
    password: string;
  };

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier },
      ],
    },
    include: { achievements: true },
  });

  // Generic message prevents email/username enumeration
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const response: AuthResponse = { user: toUserPublic(user), token: signToken(user) };
  sendSuccess(res, response);
}));

// GET /api/v1/auth/me
router.get('/me', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { achievements: true },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, toUserPublic(user));
}));

// PUT /api/v1/auth/profile
router.put('/profile', authMiddleware, validateBody(updateProfileSchema), asyncHandler(async (req: Request, res: Response) => {
  const { username, avatar } = req.body as { username?: string; avatar?: string };

  if (username) {
    const taken = await prisma.user.findFirst({
      where: { username, NOT: { id: req.user!.id } },
    });
    if (taken) {
      sendError(res, 'This username is already taken', 409);
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(username !== undefined && { username }),
      ...(avatar !== undefined && { avatar }),
    },
    include: { achievements: true },
  });

  sendSuccess(res, toUserPublic(user));
}));

router.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
router.post( '/avatar', authMiddleware, avatarUpload.single('avatar'), asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      sendError(res, 'No file uploaded', 400);
      return;
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
      include: { achievements: true },
    });
    sendSuccess(res, toUserPublic(user));
  }),
);

router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }
  console.error(err);
  sendError(res, 'Internal server error', 500);
});

export default router;
