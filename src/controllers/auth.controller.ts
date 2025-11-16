import AppError from '../core/error';
import userRepository from '../repositories/user.repository';
import {
  AccessTokenRequest,
  AuthCreate,
  AuthLogin,
  AuthPasswordReset,
} from '../schema/auth.schema';
import { SessionUser } from '../types/session-user';
import { passwordValidator } from '../utils/auth/password.auth';
import jwtAuthToken from '../utils/auth/token.auth';

class AuthController {
  signUp = async (userCreate: AuthCreate) => {
    try {
      await userRepository.getUserByUsernameOREmail(
        userCreate.username,
        userCreate.email
      );
      const hashedPassword = await passwordValidator.getPasswordHash(
        userCreate.password1
      );
      const newUser = await userRepository.createUser({
        email: userCreate.email,
        username: userCreate.username,
        hashedPassword,
      });
      const activateToken = await jwtAuthToken.activateToken({
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
      });
      return {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        activateToken,
      };
    } catch (error) {
      throw error;
    }
  };

  activateAccount = async (token: string) => {
    try {
      const payload = await jwtAuthToken.decodeToken(token);
      if (payload) {
        const { username, email, userId } = payload as unknown as SessionUser;
        await userRepository.activateUserAccount(username);
        return {
          userId,
          username,
          email,
        };
      }
    } catch (error) {
      throw error;
    }
  };
  activateAccountRequest = async (email: string) => {
    const user = await userRepository.getUserByEmail(email);
    const activateToken = await jwtAuthToken.activateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      activateToken,
    };
  };
  logIn = async (userLogin: AuthLogin) => {
    try {
      const activeUser = await userRepository.getUserByUsername(
        userLogin.username
      );
      const passwordVerified = await passwordValidator.verifyPassword(
        userLogin.password,
        activeUser.hashedPassword
      );
      if (!passwordVerified) {
        throw new AppError('Incorrect username or password');
      }
      const payload = {
        userId: activeUser.id,
        username: activeUser.username,
        email: activeUser.email,
      };
      const accessToken = await jwtAuthToken.accessToken(payload);
      const refreshToken = await jwtAuthToken.refreshToken(payload);
      return { accessToken, refreshToken };
    } catch (err) {
      throw err;
    }
  };

  passwordRest = async (userPasswordRest: AuthPasswordReset) => {
    const user = await userRepository.getUserByEmail(userPasswordRest.email);
    const hashedPassword = await passwordValidator.getPasswordHash(
      userPasswordRest.password1
    );
    return await userRepository.updateUserPassword(user.email, hashedPassword);
  };
  passwordRequestRest = async (email: string) => {
    const user = await userRepository.getUserByEmail(email);
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };
    const activateToken = await jwtAuthToken.activateToken(payload);
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      activateToken,
    };
  };

  getAccessToken = async (accessRequestRest: AccessTokenRequest) => {
    try {
      const payload = await jwtAuthToken.decodeToken(accessRequestRest.token);
      if (payload) {
        const { username, email, userId } = payload as unknown as SessionUser;
        const accessToken = await jwtAuthToken.accessToken({
          username,
          email,
          userId,
        });
        return accessToken;
      }
    } catch (err) {
      throw err;
    }
  };
}

export const authController = new AuthController();
