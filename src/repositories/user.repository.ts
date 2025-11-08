import prisma from "../core/db";
import { BadRequestError, NotFoundError } from "../core/error";
import { UserCreate } from "../schema/user.schema";
import { passwordValidator } from "../utils/auth/password.auth";

class UserRepository {

    getUserByUsername = async (userName: string) => {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    username: userName,
                }
            })
            if (user) {
                if (!user.is_active) {
                    throw new BadRequestError("User account is not active")
                }
                return user;
            }
            throw new NotFoundError("Incorrect username or password");
        } catch (error) {
            throw error;
        }
    }
    getUserByEmail = async (email: string) => {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    email,
                }
            })
            if (!user) {
                throw new NotFoundError("Incorrect username or password");
            }
            return user;
        } catch (error) {
            throw error;
        }
    }

    createUser = async (userCreate: UserCreate) => {
        try {
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: userCreate.username },
                        { email: userCreate.email }
                    ]
                }
            });
            if (existingUser) {
                throw new BadRequestError("Username or email already in use");
            }
            const hashedPassword = await passwordValidator.getPasswordHash(userCreate.password)
            const newUser = await prisma.user.create({
                data: {
                    username: userCreate.username,
                    email: userCreate.email,
                    hashedPassword,
                }
            });
            return newUser;
        } catch (error) {
            throw error;
        }
    }

    activateUserAccount = async (userName: string) => {
        try {
            const updatedUser = await prisma.user.updateMany({
                where: {
                    username: userName,
                    is_active: false,
                },
                data: {
                    is_active: true,
                }
            });
            if (updatedUser.count === 0) {
                throw new NotFoundError("User not found or already active");
            }
            return true;
        } catch (error) {
            throw error;
        }
    }

    authenticateUser = async (userName: string, password: string) => {
        try {
            const user = await this.getUserByUsername(userName);
            const isPasswordValid = await passwordValidator.verifyPassword(password, user.hashedPassword);
            if (!isPasswordValid) {
                throw new NotFoundError("Incorrect username or password");
            }
            return user;
        } catch (error) {
            throw error;
        }
    }

    updateUserPassword = async (
        email: string,
        newPassword: string
    ) => {

        try {
            const user = await this.getUserByEmail(email);
            const hashedPassword = await passwordValidator.getPasswordHash(newPassword);
            await prisma.user.update({
                where: { id: user.id },
                data: { hashedPassword },
            });
            return true;
        } catch (error) {
            throw error;
        }
    }
}

const userRepository = new UserRepository();

export default userRepository;