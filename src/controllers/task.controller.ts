import { Cache, CacheTag } from '../utils/cache';
import { Task } from '../generated/prisma/client';
import taskRepository from '../repositories/task.repository';
import {
  TaskCreate,
  TaskStatusUpdate,
  TaskUpdate,
} from '../schema/task.schema';

const TASK_CACHE_KEY = 'tasks';
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
    await CacheTag.invalidate(
      `${TASK_CACHE_KEY}:${username}:all`,
      this.listKey(username)
    );
    await Cache.set(this.itemKey(username, id), task, {}, [
      `${TASK_CACHE_KEY}:${username}:all`,
      this.itemKey(username, task.id),
    ]);
    return task;
  };

  getTasks = async (userId: number, username: string) => {
    try {
      const key = this.listKey(username);
      let tasks = await Cache.get<Task[]>(key);

      if (!tasks) {
        tasks = await taskRepository.getAllTasks(userId);
        await Cache.set(key, tasks, {}, [
          `${TASK_CACHE_KEY}:${username}:all`,
          key,
        ]);

        tasks.forEach(async (task) => {
          await Cache.set(this.itemKey(username, task.id), task, {}, [
            `${TASK_CACHE_KEY}:${username}:all`,
            this.itemKey(username, task.id),
          ]);
        });
      }
      return tasks;
    } catch (err) {
      throw err;
    }
  };

  getTask = async (id: number, userId: number, username: string) => {
    try {
      const key = this.itemKey(username, id);
      let task = await Cache.get<Task>(key);

      if (!task) {
        task = await taskRepository.getTask(id, userId);
        await Cache.set(this.itemKey(username, id), task, {}, [
          `${TASK_CACHE_KEY}:${username}:all`,
          this.itemKey(username, task.id),
        ]);
      }
      return task;
    } catch (err) {
      throw err;
    }
  };
  createTask = async (userId: number, username: string, input: TaskCreate) => {
    try {
      const task = await taskRepository.createTask(userId, input);
      await Cache.set(this.itemKey(username, task.id), task, {}, [
        `${TASK_CACHE_KEY}:${username}:all`,
        this.itemKey(username, task.id),
      ]);
      return task;
    } catch (err) {
      throw err;
    }
  };
  updateTask = async (
    id: number,
    userId: number,
    username: string,
    input: TaskUpdate
  ) => {
    try {
      const task = await taskRepository.updateTask(id, userId, input);
      return await this.invalidateCacheAndSet(id, username, task);
    } catch (err) {
      throw err;
    }
  };
  updateTaskStatus = async (
    id: number,
    userId: number,
    username: string,
    input: TaskStatusUpdate
  ) => {
    try {
      const task = await taskRepository.updateTaskStatus(id, userId, input);
      return await this.invalidateCacheAndSet(id, username, task);
    } catch (err) {
      throw err;
    }
  };
  deleteTask = async (id: number, userId: number, username: string) => {
    try {
      const task = await taskRepository.deleteTask(id, userId);
      await CacheTag.invalidate(
        `${TASK_CACHE_KEY}:${username}:all`,
        this.listKey(username),
        this.itemKey(username, task.id)
      );
      return task;
    } catch (err) {
      throw err;
    }
  };
}

export const taskController = new Task_Controller();
