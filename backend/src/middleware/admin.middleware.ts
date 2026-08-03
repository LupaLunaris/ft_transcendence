
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.utils';

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.is_admin) {
    sendError(res, 'Forbidden', 403);
    return;
  }
  next();
}
