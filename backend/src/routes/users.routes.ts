import { Router, Request, Response, NextFunction } from 'express';
import { UserProfile } from '@ft/shared';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import { getStatus } from '../state/online.state';
import { toUserPublic } from '../utils/user.serializer';
import { avatarUpload, validateAndSaveAvatar } from '../middleware/upload.middleware';
import { getLevelFromXp } from '../services/gamification.service';
import path from 'path';
import fs from 'fs';

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
        online_status: getStatus(user.id), 
        friends_count: user._count.friendships_sent + user._count.friendships_received,
    };
    
    sendSuccess(res, profile);
}));

router.post('/avatar', authMiddleware, avatarUpload, validateAndSaveAvatar, asyncHandler(async (req: Request, res: Response) => {
    const filename = (req as any).savedAvatarFilename;
    if (!filename) {
        sendError(res, 'No file uploaded', 400);
        return ;
    }
    
    const avatarUrl = `/uploads/avatars/${filename}`;
    
    const previousUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { avatar: true },
    });

    const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatar: avatarUrl },
    });

    if (
        previousUser?.avatar &&
        previousUser.avatar !== avatarUrl &&
        previousUser.avatar.startsWith('/uploads/avatars/')
    ) {
        const oldFilename = previousUser.avatar.replace('/uploads/avatars/', '');
        const oldFilePath = path.join(process.cwd(), 'uploads', 'avatars', oldFilename);
        fs.unlink(oldFilePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Failed to delete old avatar:', err);
            }
        });
    }

    sendSuccess(res, toUserPublic(user));
}));

export default router;
