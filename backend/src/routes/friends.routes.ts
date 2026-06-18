/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friends.routes.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: Jpaulis <Jpaulis@student.s19.be>           +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/12 11:31:40 by Jdebrull          #+#    #+#             */
/*   Updated: 2026/06/17 09:07:35 by Jpaulis          ###   ########.fr       */
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

	const friends: FriendPublic[] = friendships.map((f) => {
		const friend = f.requester_id === myId ? f.addressee : f.requester;
		return {
			id: friend.id,
			username: friend.username,
			avatar: friend.avatar,
			online_status: resolveStatus(friend.id),
			friendship_id: f.id,
			created_at: f.created_at.toISOString(),
		};
	});

	sendSuccess(res, friends);
}));

router.post('/:user_id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
	const myId = req.user!.id;
	const { user_id } = req.params;

	if (myId === user_id) {
		sendError(res, 'you cannot add yourself as a friend', 400);
		return ;
	}

	const target = await prisma.user.findUnique( { where: { id: user_id } })
	if (!target) {
		sendError(res, 'User not found', 404);
		return ;
	}

	const existing = await prisma.friendship.findFirst({
		where: {
			OR: [
				{ requester_id: myId, addressee_id: user_id },
				{ requester_id: user_id, addressee_id: myId },
			],
		},
	});

	if (existing) {
		sendError(res, 'Already friends', 409);
		return ;
	}

	const friendship = await prisma.friendship.create({
		data: { requester_id: myId, addressee_id: user_id },
	});
	
	const result: FriendPublic = {
		id: target.id,
		username: target.username,
		avatar: target.avatar,
		online_status: resolveStatus(target.id),
		friendship_id: friendship.id,
		created_at: friendship.created_at.toISOString(),
	};
	
	sendSuccess(res, result, 201);
}));

router.delete('/:user_id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
	const myId = req.user!.id;
	const {user_id } = req.params;

	const friendship = await prisma.friendship.findFirst({
		where: {
			OR: [
				{ requester_id: myId, addressee_id: user_id },
				{ requester_id: user_id, addressee_id: myId },
			],
		},
	});

	if (!friendship) {
		sendError(res, 'Friendship not found', 404);
		return ;
	}

	await prisma.friendship.delete({ where: { id: friendship.id } });

	sendSuccess(res, { message: 'Friend removed' });
}));

export default router;