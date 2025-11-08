import express, { Application, Request, Response } from 'express';
import { config } from "./config"
import cors from "cors";
import { loggingMiddleware } from './middlewares/logging.middleware';
import routes from './routes';
import errorHandler from './middlewares/errorHandler.middleware';

export const app: Application = express();

app.use(express.json())
if (config.enableCORS) {
  app.use(cors())
}

app.use(loggingMiddleware)
app.use(routes)

app.get('/', (req: Request, res: Response) => {
  res.json({
    app: config.appName,
    env: config.env.NODE_ENV,
    port: config.env.PORT,
    database: config.database.url,
    debugRoutes: config.features.enableDebugRoutes,
  });
});


app.use(errorHandler);