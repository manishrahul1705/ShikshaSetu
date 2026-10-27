import session from 'express-session';
import MongoStore from 'connect-mongo';
import env from './env.js';

/**
 * Session configuration (S16).
 *
 * - HttpOnly: true (always)
 * - Secure: true in production; relaxed to false on localhost in demo mode
 *   (documented: demo mode runs on HTTP, so Secure=true would break cookies)
 * - SameSite: lax
 * - No tokens in localStorage anywhere.
 */
export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'awaaz.sid';

export function createSessionMiddleware(mongoUri) {
  const uri = mongoUri || env.MONGODB_URI;
  const isDemo = env.APP_MODE === 'demo';
  const isLocalhost = env.CLIENT_ORIGIN.includes('localhost') || env.CLIENT_ORIGIN.includes('127.0.0.1');

  return session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: uri,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 1 day
    }),
    cookie: {
      httpOnly: true,
      secure: !(isDemo && isLocalhost),
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
    // A second local instance (npm run dev:showcase) uses its own cookie name, so the two
    // instances on localhost do not sign each other out.
    name: SESSION_COOKIE,
  });
}
