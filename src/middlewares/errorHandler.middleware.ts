import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '../generated/prisma/internal/prismaNamespace';

// Types
interface ValidationErrorDetail {
  field: string;
  message: string;
}

interface AppError extends Error {
  statusCode?: number;
  errors?: any[];
  code?: string;
}

// Helper: Format Zod or other validation errors
const formatValidationErrors = (errors: any[]): ValidationErrorDetail[] => {
  return errors.map((err) => ({
    field: err.path?.[0] ?? 'unknown',
    message: err.message ?? 'Validation failed',
  }));
};

// Global Error Handler (FastAPI-style in TypeScript)
const errorHandler = (
  err: AppError | ZodError | PrismaClientKnownRequestError | any,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // 1. Custom App Errors (ConflictError, NotFoundError, etc.)
  if (err.statusCode && typeof err.message === 'string') {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.statusCode,
        message: err.message,
      },
    });
  }

  // 2. Validation Errors (Zod, express-validator, Joi, etc.)
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      errors: formatValidationErrors(err.issues),
    });
  }

  if (err.name === 'ValidationError' || Array.isArray(err.errors)) {
    return res.status(422).json({
      success: false,
      errors: formatValidationErrors(err.errors || []),
    });
  }

  // 3. Prisma Known Errors
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      // Record not found
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: 'Resource not found',
        },
      });
    }

    if (err.code === 'P2002') {
      // Unique constraint violation
      const field = (err.meta?.target as string[])?.[0] || 'field';
      return res.status(409).json({
        success: false,
        error: {
          code: 409,
          message: `Duplicate ${field}. Already exists.`,
        },
      });
    }
  }

  // 4. Unexpected Errors (500)
  console.error('UNHANDLED ERROR:', {
    message: err.message,
    stack: err.stack,
    url: req.method + ' ' + req.originalUrl,
    body: req.body,
  });

  return res.status(500).json({
    success: false,
    error: 'Internal server error. Please contact support.',
  });
};

export default errorHandler;
