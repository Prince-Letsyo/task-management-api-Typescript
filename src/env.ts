// src/env.js
import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(1, 'API_KEY is required and cannot be empty'),
  DB_URL: z.url().optional(),
  ALGORITHM: z.string().default('HS256'),
  SECRET_KEY: z
    .string()
    .min(32, 'Secret key provided is less than 32 characters')
    .default(
      'c54e0c022aee46c6fd4c606dd133a3a30e36dcea7ce79107e85b99a248885d81'
    ),
  ACCESS_TOKEN_EXPIRE_MINUTES: z.coerce.number().int().positive().default(30),
  REFRESH_TOKEN_EXPIRE_WEEKS: z.coerce.number().int().positive().default(4),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.coerce.number().int().positive().default(25),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM: z.string().min(1, 'SMTP_FROM is required'),
});

export type Env = z.infer<typeof envSchema>;
