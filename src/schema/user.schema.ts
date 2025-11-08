import { z } from "zod";
import { passwordValidator } from "../utils/auth/password.auth";


export const UserBaseSchema = z.object({
    username: z
        .string()
        .min(1, "Username is required")
        .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, or underscores"),
    email: z.email("Invalid email address"),
});

// Create user schema (extends base)
export const UserCreateSchema = UserBaseSchema.extend({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
}).superRefine((data, ctx) => {
    const { password, username, email } = data;

    const result = passwordValidator.validate(password, username, email);
    if (!result.isValid) {
        for (const error of result.errors) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: error,
                path: ["password"]
            });
        }
    }
});


export type UserBase = z.infer<typeof UserBaseSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
