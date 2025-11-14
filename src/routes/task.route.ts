import { Request, Response, Router } from 'express';
import { authenticatedUser } from '../middlewares/request.middleware';
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
  .get('/', authenticatedUser(), async (req: Request, res: Response) => {
    const { username } = req.session;
    let tasks: TaskModel[] = [];
    if (username) {
      tasks = await taskController.getTasks(username);
      res.status(200).json({
        tasks,
      });
    }
  })
  .get('/:id', authenticatedUser(), async (req: Request, res: Response) => {
    const { session, params } = req;
    const { id } = params;
    const { username } = session;
    let task: Task;
    if (username) {
      task = await taskController.getTask(parseInt(id), username);
      res.status(200).json({
        task,
      });
    }
  })
  .post(
    '/',
    authenticatedUser(),
    validate(TaskCreateSchema),
    async (req: Request, res: Response) => {
      const taskCreate = req.validatedBody as TaskCreate;
      const { session } = req;
      const { username } = session;
      let task: Task;
      if (username) {
        task = await taskController.createTask(username, taskCreate);
        res.status(201).json({
          task,
        });
      }
    }
  )
  .put(
    '/:id',
    authenticatedUser(),
    validate(TaskUpdateSchema),
    async (req: Request, res: Response) => {
      const taskUpdate = req.validatedBody as TaskUpdate;
      const { session, params } = req;
      const { id } = params;
      const { username } = session;
      let task: Task;
      if (username) {
        task = await taskController.updateTask(
          parseInt(id),
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
    authenticatedUser(),
    validate(TaskStatusUpdateSchema),
    async (req: Request, res: Response) => {
      const taskStatusUpdate = req.validatedBody as TaskStatusUpdate;
      const { session, params } = req;
      const { id } = params;
      const { username } = session;
      let task: Task;
      if (username) {
        task = await taskController.updateTaskStatus(
          parseInt(id),
          username,
          taskStatusUpdate
        );
        res.status(200).json({
          task,
        });
      }
    }
  )
  .delete('/:id', authenticatedUser(), async (req: Request, res: Response) => {
    const { session, params } = req;
    const { id } = params;
    const { username } = session;
    let task: Task;
    if (username) {
      await taskController.deleteTask(parseInt(id), username);
      res.status(204).json({});
    }
  });
export default taskRouter;
