// src/env.js
import "dotenv/config"
import { z } from "zod";

export const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    API_KEY: z.string().min(1, "API_KEY is required and cannot be empty"),
    DB_URL: z.string().url().optional(),
});



export type Env = z.infer<typeof envSchema>