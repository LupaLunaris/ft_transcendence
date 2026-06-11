/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friends.routes.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jdebrull <jdebrull@students.s42.be>        +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/11 17:00:15 by jdebrull          #+#    #+#             */
/*   Updated: 2026/06/11 17:31:05 by jdebrull         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Router, Request, Response, NextFunction } from 'express';
import { FriendPublic } from '@ft/shared';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.utils';
import { onlineUsers } from '../state/online.state';


const router = Router();

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
	(req: Request, res: Response, next: NextFunction) =>
		fn(req, res).catch(next);

function resolveStatus(userId: string): 'online' | 'offline' | 'in_game' {
	return (onlineUsers.has(userId) ? 'online' : 'offline'); 
}

router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
	const myId = req.user!.id;
	
	const friendships = await prisma.friendship.findMany({
		where: {
			OR: [{ requester_id: myId }, { addressee_id: myId }],
		},
		include: {
			requester: { select: {id: true, username: true, avatar: true } },
			addressee: { select: {id: true, username: true, avatar: true } },
		},
		orderBy: { created_at: 'desc' },
	});
	
	




	
}))