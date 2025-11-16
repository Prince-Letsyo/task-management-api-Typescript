import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from '../utils/rate-limiter';

export const rateLimit = (
  limit = 60,
  windowSeconds = 60,
  getKey: (req: Request) => string = (req) => req.ip || 'unknown'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);
    const result = await RateLimiter.consume(key, limit, windowSeconds);

    res.set({
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.reset,
    });

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: result.reset - Math.floor(Date.now() / 1000),
      });
    }

    next();
  };
};
