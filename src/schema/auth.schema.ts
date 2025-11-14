import { z } from 'zod';
import { passwordValidator } from '../utils/auth/password.auth';

// --- Base fields ---
const usernameField = z
  .string()
  .min(1, 'Username is required')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username must contain only letters, numbers, or underscores'
  );

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters long');

const emailField = z.email('Invalid email address');

// --- Password confirmation schema ---
const PasswordConfirmSchema = z
  .object({
    password1: passwordField,
    password2: passwordField,
  })
  .superRefine((data, ctx) => {
    if (data.password1 !== data.password2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['password2'],
      });
    }
  });

// --- Base auth schema ---
export const AuthBaseSchema = z.object({
  username: usernameField,
  email: emailField,
});

// --- Create user schema ---
export const AuthCreateSchema = AuthBaseSchema.extend({
  ...PasswordConfirmSchema.shape,
}).superRefine((data, ctx) => {
  const { password1, username, email } = data;
  const result = passwordValidator.validate(password1, username, email);
  if (!result.isValid) {
    result.errors.forEach((error) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error,
        path: ['password1'],
      });
    });
  }
});

// --- Login schema ---
export const AuthLoginSchema = z.object({
  username: usernameField,
  password: passwordField,
});

// --- Password reset/request schemas ---
export const AuthPasswordRequestSchema = z.object({ email: emailField });

export const AuthPasswordResetSchema = AuthPasswordRequestSchema.extend({
  ...PasswordConfirmSchema.shape,
});

// --- Activate account schema (alias) ---
export const ActivateAccountRequestSchema = AuthPasswordRequestSchema;

// --- Access token schema ---
export const AccessTokenRequestSchema = z.object({ token: z.string() });

// --- Type inference ---
export type AuthBase = z.infer<typeof AuthBaseSchema>;
export type AuthCreate = z.infer<typeof AuthCreateSchema>;
export type AuthLogin = z.infer<typeof AuthLoginSchema>;
export type AuthPasswordRequest = z.infer<typeof AuthPasswordRequestSchema>;
export type AuthPasswordReset = z.infer<typeof AuthPasswordResetSchema>;
export type ActivateAccountRequest = z.infer<
  typeof ActivateAccountRequestSchema
>;
export type AccessTokenRequest = z.infer<typeof AccessTokenRequestSchema>;
