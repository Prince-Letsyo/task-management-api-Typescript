import { NextFunction, Request, Response } from 'express';
import jwtAuthToken from '../utils/auth/token.auth';
import { UnauthorizedError } from '../core/error';

export const jwtDecoder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tokenHeader = req.headers.authorization;

  if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
    req.session.username = undefined;
    req.session.email = undefined;
    return next(new UnauthorizedError('Missing or invalid token'));
  }

  const token = tokenHeader.split(' ')[1];

  try {
    const payload = await jwtAuthToken.decodeToken(token);

    const { username, email } = payload as {
      username: string;
      email: string;
    };

    req.session.username = username;
    req.session.email = email;

    return next();
  } catch (err) {
    req.session.username = undefined;
    req.session.email = undefined;
    return next(err);
  }
};

export const authenticatedUser = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.username) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };
};
