/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   upload.middleware.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: Jpaulis <Jpaulis@student.s19.be>           +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/11 15:23:49 by jdebrull          #+#    #+#             */
/*   Updated: 2026/06/17 08:54:40 by Jpaulis          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { sendError } from '../utils/response.utils';

const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');

if (!fs.existsSync(AVATAR_DIR)) {
	fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
	filename: (req: Request, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		const filename = `${req.user!.id}${ext}`;
		cb(null, filename);
	},
});

function fileFilter(
	_req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
): void {
	const allowed = ['image/jpeg', 'image/png', 'image/webp'];
	if (allowed.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error('Only JPEG, PNG and WebP images are allowed'));
	}
}

export const avatarUpload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 2 * 1024 * 1024 },
});

