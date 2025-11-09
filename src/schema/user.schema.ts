import { z } from 'zod';
import { passwordValidator } from '../utils/auth/password.auth';

const userNameField = z
  .string()
  .min(1, 'Username is required')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username must contain only letters, numbers, or underscores'
  );
const userPasswordField = z
  .string()
  .min(8, 'Password must be at least 8 characters long');
const userEmailField = z.email('Invalid email address');

const ComparePasswordSchema = z
  .object({
    password1: userPasswordField,
    password2: userPasswordField,
  })
  .superRefine((data, ctx) => {
    const { password1, password2 } = data;
    if (password1 !== password2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['password2'],
      });
    }
  });

export const UserBaseSchema = z.object({
  username: userNameField,
  email: userEmailField,
});

export const UserCreateSchema = UserBaseSchema.extend({
  ...ComparePasswordSchema.shape,
}).superRefine((data, ctx) => {
  const { password1, password2, username, email } = data;
  if (password1 !== password2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['password2'],
    });
  }
  const result = passwordValidator.validate(password1, username, email);
  if (!result.isValid) {
    for (const error of result.errors) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error,
        path: ['password1'],
      });
    }
  }
});

export const UserLoginSchema = z.object({
  username: userNameField,
  password: userPasswordField,
});
export const UserPasswordRequestRestSchema = z.object({
  email: userEmailField,
});
export const ActivateAccountRequestSchema =
  UserPasswordRequestRestSchema.extend({});
export const UserPasswordRestSchema = UserPasswordRequestRestSchema.extend({
  ...ComparePasswordSchema.shape,
}).superRefine((data, ctx) => {
  const { password1, password2 } = data;
  if (password1 !== password2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['password2'],
    });
  }
});
export const AccessTokenRequestSchema = z.object({ token: z.string() });

export type UserBase = z.infer<typeof UserBaseSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserPasswordRest = z.infer<typeof UserPasswordRestSchema>;
export type UserPasswordRequestRest = z.infer<
  typeof UserPasswordRequestRestSchema
>;
export type ActivateAccountRequest = z.infer<
  typeof ActivateAccountRequestSchema
>;
export type AccessTokenRequest = z.infer<typeof AccessTokenRequestSchema>;
