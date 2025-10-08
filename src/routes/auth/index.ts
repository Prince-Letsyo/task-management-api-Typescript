import { Router, Request, Response } from "express";
import { ConfigService } from "../../config/service";

const config = ConfigService.getInstance()
const authRouter = Router();

authRouter.post("/sign_up", (req: Request, res: Response) => {
    res.status(201).json({
        app: config.get("appName"),
        apiKey: config.getEnv("API_KEY")
    })
})
    .post("/sign_in", (req: Request, res: Response) => {
        res.status(200).json({
            app: config.get("appName"),
            apiKey: config.getEnv("API_KEY")
        })
    })

export default authRouter