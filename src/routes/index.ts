import { Router } from 'express';
import authRouter from './auth.route';
import taskRouter from './task.route';
import { jwtDecoder } from '../middlewares/request.middleware';

const routes = Router()
  .use('/auth', authRouter)
  .use('/tasks', jwtDecoder, taskRouter);

export default routes;
