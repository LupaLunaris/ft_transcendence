import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) {
	fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

// Magic byte signatures for allowed image types.
// We check the real file content, never the client-supplied mimetype or filename.
const SIGNATURES: { ext: string; check: (buf: Buffer) => boolean }[] = [
	{
		ext: '.jpg',
		check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
	},
	{
		ext: '.png',
		check: (buf) =>
			buf.length >= 8 &&
			buf[0] === 0x89 &&
			buf[1] === 0x50 &&
			buf[2] === 0x4e &&
			buf[3] === 0x47 &&
			buf[4] === 0x0d &&
			buf[5] === 0x0a &&
			buf[6] === 0x1a &&
			buf[7] === 0x0a,
	},
	{
		ext: '.webp',
		check: (buf) =>
			buf.length >= 12 &&
			buf.toString('ascii', 0, 4) === 'RIFF' &&
			buf.toString('ascii', 8, 12) === 'WEBP',
	},
];

function detectImageType(buffer: Buffer): string | null {
	const match = SIGNATURES.find((sig) => sig.check(buffer));
	return match ? match.ext : null;
}

// Multer just buffers the upload in memory — no disk write, no filename/mimetype trust yet.
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 2 * 1024 * 1024 },
});

export const avatarUpload = upload.single('avatar');

// Run this AFTER avatarUpload in the route chain.
// It validates the real file content and writes it to disk itself.
export function validateAndSaveAvatar(req: Request, res: Response, next: NextFunction): void {
	const file = req.file;
	if (!file) {
		res.status(400).json({ error: 'No file uploaded' });
		return;
	}

	const detectedExt = detectImageType(file.buffer);
	if (!detectedExt) {
		res.status(400).json({ error: 'Only JPEG, PNG and WebP images are allowed' });
		return;
	}

	const filename = `${req.user!.id}${detectedExt}`;
	const filePath = path.join(AVATAR_DIR, filename);

	fs.writeFile(filePath, file.buffer, (err) => {
		if (err) {
			next(err);
			return;
		}
		(req as any).savedAvatarFilename = filename;
		next();
	});
}
