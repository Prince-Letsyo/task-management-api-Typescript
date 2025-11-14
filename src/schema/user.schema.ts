import { z } from 'zod';

// export const UserBaseSchema = z.object({
//     id: z.number().int(),
//     username: z.string(),
//     email: z.email(),
//     hashedPassword: z.string(),
//     is_active: z.boolean().default(true),
// })

// export const UserCreateSchema = UserBaseSchema.pick({
//     username: true,
//     email: true,
//     hashedPassword: true,
//     is_active: true
// })

// export const UserUpdateSchema = UserCreateSchema.partial()

// export type UserBase = z.infer<typeof UserBaseSchema>;
// export type UserCreate = z.infer<typeof UserCreateSchema>;
// export type UserUpdate = z.infer<typeof UserUpdateSchema>;
