import { z } from 'zod';
// import { UserBaseSchema } from './user.schema';

export const TaskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);

const TaskId = z.number().int();
export const TaskBaseSchema = z.object({
  id: TaskId,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: TaskStatusEnum.default('PENDING'),
});

export const TaskCreateSchema = TaskBaseSchema.extend({
  id: TaskId.optional(),
});

export const TaskUpdateSchema = TaskBaseSchema.extend({
  user_id: z.number().int(),
});

export const TaskStatusUpdateSchema = TaskBaseSchema.pick({
  id: true,
  status: true,
});

export type TaskBase = z.infer<typeof TaskBaseSchema>;
export type TaskCreate = z.infer<typeof TaskCreateSchema>;
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;
export type TaskStatusUpdate = z.infer<typeof TaskStatusUpdateSchema>;
