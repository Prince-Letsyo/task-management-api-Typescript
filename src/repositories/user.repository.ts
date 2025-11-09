import prisma from "../core/db";
import { BadRequestError, NotFoundError } from "../core/error";
import { passwordValidator } from "../utils/auth/password.auth";

class UserRepository {
  getUserByUsernameOREmail = async (userName: string, email: string) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            {
              email,
            },
            {
              username: userName,
            },
          ],
        },
      });
      if (user) {
        throw new BadRequestError('Username or email already in use');
      }
    } catch (error) {
      throw error;
    }
  };
  getUserByUsername = async (userName: string) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          username: userName,
        },
      });
      if (user) {
        if (!user.is_active) {
          throw new BadRequestError('User account is not active');
        }
        return user;
      }
      throw new NotFoundError('Incorrect username or password');
    } catch (error) {
      throw error;
    }
  };
  getUserByEmail = async (email: string) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          email,
        },
      });
      if (!user) {
        throw new NotFoundError('Email does not exists');
      }
      return user;
    } catch (error) {
      throw error;
    }
  };

  createUser = async (userCreate: {
    username: string;
    email: string;
    hashedPassword: string;
  }) => {
    const { email, hashedPassword, username } = userCreate;
    try {
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          hashedPassword,
        },
      });
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  activateUserAccount = async (userName: string) => {
    try {
      const updatedUser = await prisma.user.updateMany({
        where: {
          username: userName,
          is_active: false,
        },
        data: {
          is_active: true,
        },
      });
      if (updatedUser.count === 0) {
        throw new NotFoundError('User not found or already active');
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  authenticateUser = async (userName: string, password: string) => {
    try {
      const user = await this.getUserByUsername(userName);
      const isPasswordValid = await passwordValidator.verifyPassword(
        password,
        user.hashedPassword
      );
      if (!isPasswordValid) {
        throw new NotFoundError('Incorrect username or password');
      }
      return user;
    } catch (error) {
      throw error;
    }
  };

  updateUserPassword = async (email: string, hashedPassword: string) => {
    try {
      await prisma.user.update({
        where: { email },
        data: { hashedPassword },
      });
      return true;
    } catch (error) {
      throw error;
    }
  };
}

const userRepository = new UserRepository();

export default userRepository;
