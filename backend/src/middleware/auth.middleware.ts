
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.utils';

export interface JwtUser {
  id: string;
  email: string;
  is_admin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Unauthorized', 401);
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtUser;
    req.user = payload;
    next();
  } catch {
    sendError(res, 'Unauthorized', 401);
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtUser;
    req.user = payload;
  } catch {
    // invalid token — just ignore it
  }
  next();
}
