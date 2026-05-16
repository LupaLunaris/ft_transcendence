/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* auth.routes.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserPublic, AuthResponse } from '@ft/shared';
import { User } from '@prisma/client';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../schemas/auth.schemas';

const router = Router();

function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    diamonds: user.diamonds,
    tower_progress: user.tower_progress,
    created_maps_count: user.created_maps_count,
    created_at: user.created_at.toISOString(),
  };
}

function signToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] },
  );
}

// POST /api/v1/auth/register
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
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

  const user = await prisma.user.create({
    data: { email, username, password_hash },
  });

  const response: AuthResponse = { user: toUserPublic(user), token: signToken(user) };
  sendSuccess(res, response, 201);
});

// POST /api/v1/auth/login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email } });

  // Generic message prevents email enumeration
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const response: AuthResponse = { user: toUserPublic(user), token: signToken(user) };
  sendSuccess(res, response);
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, toUserPublic(user));
});

// PUT /api/v1/auth/profile
router.put('/profile', authMiddleware, validateBody(updateProfileSchema), async (req: Request, res: Response) => {
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
  });

  sendSuccess(res, toUserPublic(user));
});

export default router;
