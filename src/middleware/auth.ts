import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { UnauthorizedError } from '../lib/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedError('Missing bearer token');
  }
  const payload = verifyAccessToken(token);
  req.user = { id: payload.sub, email: payload.email };
  next();
}
