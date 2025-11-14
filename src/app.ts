import { config } from './config/index';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { jwtDecoder } from './middlewares/request.middleware';
import routes from './routes';
import errorHandler from './middlewares/errorHandler.middleware';
import { unconnectedRedisClient, connectedRedisClient } from './redis';
import { createSessionMiddleware } from './middlewares/session.middleware';

export const app: Application = express();

async function startServer() {
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
  app.use('/api', routes);

  app.use(errorHandler);


  const PORT: number = config.env.PORT;

  app.listen(PORT, () => {
    console.log(`🚀 ${config.appName} running on port ${config.env.PORT}`);
  });

}


export default startServer