import { UserCreate, UserCreateSchema } from './../schema/user.schema';
import { Router, Request, Response } from "express";
import { ConfigService } from "../config/service";
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';

const config = ConfigService.getInstance()
const authRouter = Router();

authRouter.post("/sign_up", validate(UserCreateSchema), async (req: Request, res: Response) => {
    const userCreate = req.validatedBody as UserCreate;
    const newUserPayload = await authController.signUp(userCreate)


    res.status(201).json({
        message: "User created successfully. Please check your email to activate your account.",
        data: newUserPayload

    })
})
    .post("/sign_in", (req: Request, res: Response) => {
        res.status(200).json({
            app: config.get("appName"),
            apiKey: config.getEnv("API_KEY")
        })
    })

export default authRouter;