import userRepository from "../repositories/user.repository";
import { UserCreate } from "../schema/user.schema";
import jwtAuthToken from "../utils/auth/token.auth";

class AuthController {

    signUp = async (userCreate: UserCreate) => {
        try {
            const newUser = await userRepository.createUser(userCreate)
            const accessToken = await jwtAuthToken.accessToken({
                username: newUser.username,
                email: newUser.email,
            })
            return {
                username: newUser.username,
                email: newUser.email,
                token: accessToken,
            }
        } catch (error) {
            throw error;
        }
    }
}

export const authController = new AuthController(); 
