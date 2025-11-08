import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';


export const validate = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.body);
      req.validatedBody = data; 
      next();
    } catch (error) {
      next(error);
    }
  };
};