import { Cache, CacheTag } from '../cache';
import { Task } from '../generated/prisma/client';
import taskRepository from '../repositories/task.repository';
import userRepository from '../repositories/user.repository';
import {
  TaskCreate,
  TaskStatusUpdate,
  TaskUpdate,
} from '../schema/task.schema';

const TASK_CACHE_KEY = 'tasks';
const ALL_TASK_CACHE_KEY = 'tasks:all';

class Task_Controller {
  private listKey = (username: string) => {
    return `${TASK_CACHE_KEY}:${username}`;
  };

  private itemKey = (username: string, taskId: number) => {
    return `${TASK_CACHE_KEY}:${username}:${taskId}`;
  };

  private invalidateCacheAndSet = async (
    id: number,
    username: string,
    task: Task
  ) => {
    await CacheTag.invalidate(ALL_TASK_CACHE_KEY);
    await Cache.set(this.itemKey(username, id), task, {}, [
      ALL_TASK_CACHE_KEY,
      this.itemKey(username, task.id),
    ]);
    return task;
  };
  private getUserId = async (username: string) => {
    const user = await userRepository.getUserByUsername(username);
    return user.id;
  };
  getTasks = async (username: string) => {
    try {
      const key = this.listKey(username);
      let tasks = await Cache.get<Task[]>(key);

      if (!tasks) {
        tasks = await taskRepository.getAllTasks(
          await this.getUserId(username)
        );
        await Cache.set(key, tasks, {}, [ALL_TASK_CACHE_KEY, key]);

        tasks.forEach(async (task) => {
          await Cache.set(this.itemKey(username, task.id), task, {}, [
            ALL_TASK_CACHE_KEY,
            this.itemKey(username, task.id),
          ]);
        });
      }
      return tasks;
    } catch (err) {
      throw err;
    }
  };

  getTask = async (id: number, username: string) => {
    try {
      const key = this.itemKey(username, id);
      let task = await Cache.get<Task>(key);

      if (!task) {
        task = await taskRepository.getTask(id, await this.getUserId(username));
        await Cache.set(this.itemKey(username, id), task, {}, [
          ALL_TASK_CACHE_KEY,
          this.itemKey(username, task.id),
        ]);
      }
      return task;
    } catch (err) {
      throw err;
    }
  };
  createTask = async (username: string, input: TaskCreate) => {
    try {
      const task = await taskRepository.createTask(
        await this.getUserId(username),
        input
      );
      await Cache.set(this.itemKey(username, task.id), task, {}, [
        ALL_TASK_CACHE_KEY,
        this.itemKey(username, task.id),
      ]);
      return task;
    } catch (err) {
      throw err;
    }
  };
  updateTask = async (id: number, username: string, input: TaskUpdate) => {
    try {
      const task = await taskRepository.updateTask(
        id,
        await this.getUserId(username),
        input
      );
      return await this.invalidateCacheAndSet(id, username, task);
    } catch (err) {
      throw err;
    }
  };
  updateTaskStatus = async (
    id: number,
    username: string,
    input: TaskStatusUpdate
  ) => {
    try {
      const task = await taskRepository.updateTaskStatus(
        id,
        await this.getUserId(username),
        input
      );
      return await this.invalidateCacheAndSet(id, username, task);
    } catch (err) {
      throw err;
    }
  };
  deleteTask = async (id: number, username: string) => {
    try {
      const task = await taskRepository.deleteTask(
        id,
        await this.getUserId(username)
      );
      await CacheTag.invalidate(ALL_TASK_CACHE_KEY);
      return task;
    } catch (err) {
      throw err;
    }
  };
}

export const taskController = new Task_Controller();
