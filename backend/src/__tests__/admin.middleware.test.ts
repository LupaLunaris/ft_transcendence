/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* admin.middleware.test.ts                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jdebrull <jdebrull@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/17 00:00:00 by jdebrull        #+#    #+#               */
/* Updated: 2026/05/17 00:00:00 by jdebrull       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Request, Response, NextFunction } from 'express';
import { adminMiddleware } from '../middleware/admin.middleware';

function makeReqRes(user?: { id: string; email: string; is_admin: boolean }) {
  const req = { user } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next: NextFunction = jest.fn();
  return { req, res, next };
}

describe('adminMiddleware', () => {
  it('calls next() when user is admin', () => {
    const { req, res, next } = makeReqRes({ id: 'u1', email: 'a@b.com', is_admin: true });
    adminMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not admin', () => {
    const { req, res, next } = makeReqRes({ id: 'u1', email: 'a@b.com', is_admin: false });
    adminMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Forbidden', code: 403 }));
  });

  it('returns 403 when req.user is undefined', () => {
    const { req, res, next } = makeReqRes(undefined);
    adminMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
