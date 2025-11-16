import { Request, Response, Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { TaskModel } from '../generated/prisma/models';
import {
  TaskCreate,
  TaskCreateSchema,
  TaskStatusUpdate,
  TaskStatusUpdateSchema,
  TaskUpdate,
  TaskUpdateSchema,
} from '../schema/task.schema';
import { validate } from '../middlewares/validate.middleware';
import { Task } from '../generated/prisma/client';

const taskRouter = Router();
taskRouter
  .get('/', async (req: Request, res: Response) => {
    const { userId, username } = req.session;
    let tasks: TaskModel[] = [];
    if (userId && username) {
      tasks = await taskController.getTasks(userId, username);
      res.status(200).json({
        tasks,
      });
    }
  })
  .get('/:id', async (req: Request, res: Response) => {
    const { session, params } = req;
    const { id } = params;
    const { userId, username } = session;
    let task: Task;
    if (userId && username) {
      task = await taskController.getTask(parseInt(id), userId, username);
      res.status(200).json({
        task,
      });
    }
  })
  .post(
    '/',

    validate(TaskCreateSchema),
    async (req: Request, res: Response) => {
      const taskCreate = req.validatedBody as TaskCreate;
      const { session } = req;
      const { userId, username } = session;
      let task: Task;
      if (userId && username) {
        task = await taskController.createTask(userId, username, taskCreate);
        res.status(201).json({
          task,
        });
      }
    }
  )
  .put(
    '/:id',

    validate(TaskUpdateSchema),
    async (req: Request, res: Response) => {
      const taskUpdate = req.validatedBody as TaskUpdate;
      const { session, params } = req;
      const { id } = params;
      const { userId, username } = session;
      let task: Task;
      if (userId && username) {
        task = await taskController.updateTask(
          parseInt(id),
          userId,
          username,
          taskUpdate
        );
        res.status(200).json({
          task,
        });
      }
    }
  )
  .patch(
    '/:id',

    validate(TaskStatusUpdateSchema),
    async (req: Request, res: Response) => {
      const taskStatusUpdate = req.validatedBody as TaskStatusUpdate;
      const { session, params } = req;
      const { id } = params;
      const { userId, username } = session;
      let task: Task;
      if (userId && username) {
        task = await taskController.updateTaskStatus(
          parseInt(id),
          userId,
          username,
          taskStatusUpdate
        );
        res.status(200).json({
          task,
        });
      }
    }
  )
  .delete('/:id', async (req: Request, res: Response) => {
    const { session, params } = req;
    const { id } = params;
    const { userId, username } = session;
    if (userId && username) {
      await taskController.deleteTask(parseInt(id), userId, username);
      res.status(204).json({});
    }
  });
export default taskRouter;
