import { Router } from 'express';
import authRouter from './auth.route';
import taskRouter from './task.route';

const routes = Router();

routes.use('/auth', authRouter).use('/tasks', taskRouter);

export default routes;
