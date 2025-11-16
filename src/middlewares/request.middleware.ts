import { NextFunction, Request, Response } from 'express';
import jwtAuthToken from '../utils/auth/token.auth';
import { UnauthorizedError } from '../core/error';
import { SessionUser } from '../types/session-user';

export const jwtDecoder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tokenHeader = req.headers.authorization;

  if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
    req.session.username = undefined;
    req.session.email = undefined;
    req.session.userId = undefined;
    return next(new UnauthorizedError('Token not provided'));
  }

  const token = tokenHeader.split(' ')[1];

  try {
    const payload = await jwtAuthToken.decodeToken(token);

    const { username, email, userId } = payload as unknown as SessionUser;

    req.session.username = username;
    req.session.email = email;
    req.session.userId = userId;

    return next();
  } catch (err) {
    req.session.username = undefined;
    req.session.userId = undefined;
    req.session.email = undefined;
    return next(err);
  }
};
