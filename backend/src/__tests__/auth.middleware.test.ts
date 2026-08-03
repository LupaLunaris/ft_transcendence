
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.middleware';

const SECRET = 'test_secret';

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

function makeReqRes(authHeader?: string) {
  const req = { headers: { authorization: authHeader } } as unknown as Request;
  const body: Record<string, unknown> = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockImplementation((data) => { body.data = data; return res; }),
  } as unknown as Response;
  const next: NextFunction = jest.fn();
  return { req, res, next, body };
}

describe('authMiddleware', () => {
  it('calls next() with a valid Bearer token', () => {
    const token = jwt.sign({ id: 'u1', email: 'a@b.com', is_admin: false }, SECRET);
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as Request & { user: unknown }).user).toMatchObject({ id: 'u1', email: 'a@b.com' });
  });

  it('returns 401 when Authorization header is missing', () => {
    const { req, res, next } = makeReqRes(undefined);

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token is not prefixed with "Bearer "', () => {
    const token = jwt.sign({ id: 'u1' }, SECRET);
    const { req, res, next } = makeReqRes(token);

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token is signed with a different secret', () => {
    const token = jwt.sign({ id: 'u1' }, 'wrong_secret');
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token is expired', () => {
    const token = jwt.sign({ id: 'u1' }, SECRET, { expiresIn: -1 });
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
