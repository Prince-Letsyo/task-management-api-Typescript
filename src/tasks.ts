export const taskHandlers = new Map<string, (data: any) => Promise<any>>();

export function BackgroundTask(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    taskHandlers.set(name, method.bind(target));
  };
}

(global as any).taskHandlers = taskHandlers;
