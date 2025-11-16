import { config } from './config/index';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { jwtDecoder } from './middlewares/request.middleware';
import routes from './routes';
import errorHandler from './middlewares/errorHandler.middleware';
import { unconnectedRedisClient, connectedRedisClient } from './utils/redis';
import { createSessionMiddleware } from './middlewares/session.middleware';
import { rateLimit } from './middlewares/rate-limit.middleware';
import { eventBus } from './utils/events/event-bus';
import { connection } from './utils/queue';

async function startServer() {
  const app: Application = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (config.enableCORS) {
    app.use(cors());
  }
  const connectedClient = await connectedRedisClient;
  const sessionMiddleware = createSessionMiddleware(unconnectedRedisClient);

  app.use(sessionMiddleware);
  app.use(jwtDecoder);
  app.use(loggingMiddleware);

  app.get('/', (req: Request, res: Response) => {
    res.json({
      app: config.appName,
      env: config.env.NODE_ENV,
      port: config.env.PORT,
      database: config.database.url,
      debugRoutes: config.features.enableDebugRoutes,
    });
  });
  app.use('/api', rateLimit(100, 60), routes);

  app.use(errorHandler);

  const PORT: number = config.env.PORT;

  app.listen(PORT, () => {
    console.log(`🚀 ${config.appName} running on port ${config.env.PORT}`);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await eventBus.close();
    await connection.quit();
    process.exit(0);
  });
}

export default startServer;
