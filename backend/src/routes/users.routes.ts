/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   users.routes.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: Jdebrull <jdebrull@student.s19.be>         +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/12 11:31:42 by Jdebrull          #+#    #+#             */
/*   Updated: 2026/06/12 11:31:42 by Jdebrull         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Router, Request, Response, NextFunction } from 'express';
import { UserProfile } from '@ft/shared';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import { onlineUsers } from '../state/online.state';
import { getLevelFromXp } from '../services/gamification.service';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) =>
        fn(req, res).catch(next);

router.get('/search', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const query = String(req.query.query ?? '').trim();

    if (!query) {
        sendSuccess(res, []);
        return;
    }

    const users = await prisma.user.findMany({
        where: {
            username: {
                contains: query,
                mode: 'insensitive',
            },
        },
        select: {
            id: true,
            username: true,
            avatar: true,
        },
        take: 10,
    });

    sendSuccess(res, users);
}));

router.get('/:user_id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { user_id } = req.params;
    
    const user = await prisma.user.findUnique({
        where: { id: user_id },
        include: {
            achievements: true,
            _count: {
                select: {
                    friendships_sent: true,
                    friendships_received: true,
                },
            },
        },
    });
    if (!user) {
        sendError(res, 'User not found', 404);
        return ;
    }
    
    const profile: UserProfile = {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        xp: user.xp,
        level: getLevelFromXp(user.xp),
        achievements: user.achievements.map((achievement) => ({
            code: achievement.code as UserProfile['achievements'][number]['code'],
            unlocked_at: achievement.unlocked_at.toISOString(),
        })),
        diamonds: user.diamonds,
        tower_progress: user.tower_progress,
        created_maps_count: user.created_maps_count,
        is_admin: user.is_admin,
        created_at: user.created_at.toISOString(),
        online_status: onlineUsers.has(user.id) ? 'online' : 'offline', 
        friends_count: user._count.friendships_sent + user._count.friendships_received,
    };
    
    sendSuccess(res, profile);
}));

export default router;
