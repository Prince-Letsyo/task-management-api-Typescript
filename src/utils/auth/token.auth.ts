import { jwtVerify, SignJWT, errors } from 'jose';
import { UnauthorizedError } from '../../core/error';
import { config } from '../../config/index';

const SECRET_KEY = new TextEncoder().encode(config.env.SECRET_KEY);

class JWTAuthToken {
  private createToken = async (
    data: Record<string, any>,
    expiresInSeconds: number
  ): Promise<{ token: string; expire: Date }> => {
    try {
      const expire = new Date(Date.now() + expiresInSeconds * 1000);
      const token = await new SignJWT(data)
        .setProtectedHeader({ alg: config.env.ALGORITHM })
        .setExpirationTime(Math.floor(expire.getTime() / 1000))
        .sign(SECRET_KEY);
      return { token, expire };
    } catch (err) {
      if (err instanceof Error) {
        throw new UnauthorizedError(`Token err: ${err.message}`);
      }
      throw new UnauthorizedError(`Token err: ${String(err)}`);
    }
  };

  activateToken = async (
    data: Record<string, any>
  ): Promise<{ token: string; expire: Date }> => {
    const expiresInSeconds = 15 * 60;
    return this.createToken(data, expiresInSeconds);
  };

  accessToken = async (
    data: Record<string, any>
  ): Promise<{ token: string; expire: Date }> => {
    const expiresInSeconds = config.env.ACCESS_TOKEN_EXPIRE_MINUTES * 60;
    return this.createToken(data, expiresInSeconds);
  };

  refreshToken = async (
    data: Record<string, any>
  ): Promise<{ token: string; expire: Date }> => {
    const expiresInSeconds =
      config.env.REFRESH_TOKEN_EXPIRE_WEEKS * 7 * 24 * 60 * 60;
    return this.createToken(data, expiresInSeconds);
  };

  decodeToken = async (token: string) => {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY, {
        algorithms: [config.env.ALGORITHM],
      });
      return payload;
    } catch (err) {
      if (err instanceof errors.JWTExpired) {
        throw new UnauthorizedError('Token has expired!');
      } else if (err instanceof errors.JWTInvalid) {
        throw new UnauthorizedError('Token is invalid!');
      } else if (err instanceof Error) {
        throw new UnauthorizedError(`Token err: ${err.message}`);
      }
      throw new UnauthorizedError(`Token err: ${String(err)}`);
    }
  };
}

const jwtAuthToken = new JWTAuthToken();

export default jwtAuthToken;
