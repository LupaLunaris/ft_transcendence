/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* admin.middleware.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/17 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/17 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.utils';

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.is_admin) {
    sendError(res, 'Forbidden', 403);
    return;
  }
  next();
}
