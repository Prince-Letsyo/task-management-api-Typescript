import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { config } from '../config';
import { RedisClientType } from 'redis'; // Import the type

// Change this file to export a function that CREATES the middleware
export function createSessionMiddleware(client: RedisClientType) {
  return session({
    store: new RedisStore({
      // Use the connected client passed to the function
      client: client, 
      prefix: 'sess:',
      ttl: 60 * 60 * 24 * 7,
    }),
    name: 'sid',
    secret: config.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: 'lax',
    },
  });
}