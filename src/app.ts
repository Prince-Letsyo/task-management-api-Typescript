import express, { Application, Request, Response } from 'express';
import { config } from "./config"
import cors from "cors";
import authRouter from './routes/auth';

export const app: Application = express();

app.use(express.json())
if (config.enableCORS) {
  app.use(cors())
}

app.use("/auth", authRouter)

app.get('/', (req: Request, res: Response) => {
  res.json({
    app: config.appName,
    env: config.env.NODE_ENV,
    port: config.env.PORT,
    database: config.database.url,
    debugRoutes: config.features.enableDebugRoutes,
  });
});


app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: `Cannot find ${req.originalUrl} on this server.`,
  })
})