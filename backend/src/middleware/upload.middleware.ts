
import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

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
