import {
  AccessTokenRequest,
  AccessTokenRequestSchema,
  ActivateAccountRequest,
  ActivateAccountRequestSchema,
  AuthCreate,
  AuthCreateSchema,
  AuthLogin,
  AuthLoginSchema,
  AuthPasswordRequest,
  AuthPasswordRequestSchema,
  AuthPasswordReset,
  AuthPasswordResetSchema,
} from '../schema/auth.schema';
import { Router, Request, Response } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { taskQueue } from '../utils/queue';
import '../jobs/email.job';
import { BadRequestError } from '../core/error';
import { rateLimit } from '../middlewares/rate-limit.middleware';

const authRouter = Router();

authRouter
  .post(
    '/sign-up',
    validate(AuthCreateSchema),
    async (req: Request, res: Response) => {
      const userCreate = req.validatedBody as AuthCreate;
      const newUserPayload = await authController.signUp(userCreate);
      const activationUrl = `${req.protocol}://${req.get('host')}/auth/activate?token=${newUserPayload.activateToken.token}`;
      await taskQueue.add(
        'send-activation-email',
        {
          name: newUserPayload.username,
          email: newUserPayload.email,
          activationUrl,
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        }
      );
      res.status(201).json({
        message:
          'User created successfully. Please check your email to activate your account.',
      });
    }
  )
  .get('/activate', async (req: Request, res: Response) => {
    const { token } = req.query;
    if (!token) {
      throw new BadRequestError('Token is missing');
    }
    const activeAccountPayload = await authController.activateAccount(
      token as string
    );
    if (activeAccountPayload) {
      const { username, email } = activeAccountPayload;
      const loginUrl = `${req.protocol}://${req.get('host')}/auth/login`;
      await taskQueue.add(
        'send-welcome-email',
        {
          name: username,
          email,
          loginUrl,
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        }
      );
    }
    res.status(200).json({
      message: 'Account activated successfully. You can now log in.',
    });
  })
  .post(
    '/send-activation-email',
    validate(ActivateAccountRequestSchema),
    async (req: Request, res: Response) => {
      const activateAccountRequest =
        req.validatedBody as ActivateAccountRequest;
      const user = await authController.activateAccountRequest(
        activateAccountRequest.email
      );
      const activationUrl = `${req.protocol}://${req.get('host')}/auth/activate?token=${user.activateToken.token}`;
      await taskQueue.add(
        'send-activation-email',
        {
          name: user.username,
          email: user.email,
          activationUrl,
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        }
      );
      res.status(200).json({
        message: 'Activation email sent successfully. Please check your email.',
      });
    }
  )
  .post(
    '/sign-in',
    validate(AuthLoginSchema),
    rateLimit(
      10,
      60 * 15,
      (req: Request) =>
        `sign-in:${(req.validatedBody as AuthLogin).username}:${req.ip}`
    ),
    async (req: Request, res: Response) => {
      const userLogin = req.validatedBody as AuthLogin;
      const userToken = await authController.logIn(userLogin);
      res.status(200).json({ token: userToken });
    }
  )
  .post(
    '/request-password-reset',
    validate(AuthPasswordRequestSchema),
    async (req: Request, res: Response) => {
      const userPasswordRequestRest = req.validatedBody as AuthPasswordRequest;
      const { username, email, activateToken } =
        await authController.passwordRequestRest(userPasswordRequestRest.email);
      const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${activateToken.token}`;
      await taskQueue.add(
        'send-password-reset',
        {
          name: username,
          email,
          resetUrl,
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        }
      );
      res.status(200).json({
        message: 'A password reset link has been sent to your email.',
      });
    }
  )
  .post(
    '/reset-password',
    validate(AuthPasswordResetSchema),
    async (req: Request, res: Response) => {
      const userPasswordRest = req.validatedBody as AuthPasswordReset;
      await authController.passwordRest(userPasswordRest);
      res.status(200).json({
        message: 'Password has been reset successfully.',
      });
    }
  )
  .post(
    '/access',
    validate(AccessTokenRequestSchema),
    async (req: Request, res: Response) => {
      const accessRequestRest = req.validatedBody as AccessTokenRequest;
      const userAccess = await authController.getAccessToken(accessRequestRest);
      if (userAccess) {
        res.status(200).json({
          ...userAccess,
        });
      }
    }
  );

export default authRouter;
