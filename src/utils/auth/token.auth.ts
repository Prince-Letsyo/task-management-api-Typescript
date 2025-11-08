import { jwtVerify, SignJWT } from "jose";
import { config } from "../../config"

const SECRET_KEY = new TextEncoder().encode(config.env.SECRET_KEY)



class JWTAuthToken {
    private createToken = async (
        data: Record<string, any>,
        expiresInSeconds: number
    ): Promise<{ token: string; expire: Date }> => {
        const expire = new Date(Date.now() + expiresInSeconds * 1000)
        const token = await new SignJWT(data)
            .setProtectedHeader({ alg: config.env.ALGORITHM })
            .setExpirationTime(Math.floor(expire.getTime() / 1000))
            .sign(SECRET_KEY)
        return { token, expire }
    }

    activateToken = async (data: Record<string, any>): Promise<{ token: string; expire: Date }> => {
        const expiresInSeconds = 15 * 60
        return this.createToken(data, expiresInSeconds)
    }

    accessToken = async (data: Record<string, any>): Promise<{ token: string; expire: Date }> => {
        const expiresInSeconds = config.env.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return this.createToken(data, expiresInSeconds)
    }

    refreshToken = async (data: Record<string, any>): Promise<{ token: string; expire: Date }> => {
        const expiresInSeconds = config.env.REFRESH_TOKEN_EXPIRE_WEEKS * 7 * 24 * 60 * 60
        return this.createToken(data, expiresInSeconds)
    }

    decodeToken = async (token: string) => {
        try {
            const { payload } = await jwtVerify(token, SECRET_KEY, {
                algorithms: [config.env.ALGORITHM],
            });
            return payload;
        } catch (err) {
            throw err;
        }

    }
}


const jwtAuthToken = new JWTAuthToken()

export default jwtAuthToken;