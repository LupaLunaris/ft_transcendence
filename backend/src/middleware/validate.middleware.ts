/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* validate.middleware.ts                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response.utils';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      sendError(res, result.error.issues[0].message, 400);
      return;
    }

    req.body = result.data;
    next();
  };
}
