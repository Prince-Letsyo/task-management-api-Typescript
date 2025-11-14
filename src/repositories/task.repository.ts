import prisma from '../core/db';
import { NotFoundError } from '../core/error';
import {
  TaskCreate,
  TaskStatusUpdate,
  TaskUpdate,
} from '../schema/task.schema';

class TaskRepository {
  getAllTasks = async (userId: number) => {
    try {
      const tasks = await prisma.task.findMany({
        where: {
          user_id: userId,
        },
      });
      return tasks;
    } catch (err) {
      throw err;
    }
  };
  getTask = async (id: number, userId: number) => {
    try {
      const task = await prisma.task.findFirst({
        where: {
          user_id: userId,
          id,
        },
      });
      if (task) return task;
      throw new NotFoundError('Task not found');
    } catch (err) {
      throw err;
    }
  };

  createTask = async (userId: number, taskCreate: TaskCreate) => {
    try {
      const { description, title, status } = taskCreate;
      const newTask = await prisma.task.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          title,
          description,
          status,
        },
      });

      return newTask;
    } catch (err) {
      throw err;
    }
  };

  updateTask = async (id: number, userId: number, taskUpdate: TaskUpdate) => {
    try {
      const { description, title, status } = taskUpdate;
      await this.getTask(id, userId);
      const updatedTask = await prisma.task.update({
        where: {
          id,
          user_id: userId,
        },
        data: {
          description,
          title,
          status,
        },
      });
      return updatedTask;
    } catch (err) {
      throw err;
    }
  };
  updateTaskStatus = async (
    id: number,
    userId: number,
    taskStatusUpdate: TaskStatusUpdate
  ) => {
    try {
      const { status } = taskStatusUpdate;
      await this.getTask(id, userId);
      const updatedTask = await prisma.task.update({
        where: {
          id,
          user_id: userId,
        },
        data: {
          status,
        },
      });
      return updatedTask;
    } catch (err) {
      throw err;
    }
  };
  deleteTask = async (id: number, userId: number) => {
    try {
      await this.getTask(id, userId);
      const deletedTask = await prisma.task.delete({
        where: {
          id: id,
          user_id: userId,
        },
      });
      return deletedTask;
    } catch (err) {
      throw err;
    }
  };
}

const taskRepository = new TaskRepository();
export default taskRepository;
