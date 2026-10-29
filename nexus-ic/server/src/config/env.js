import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { parseClientOrigins, parseTrustProxyHops } from './hosting.js';
dotenv.config();

// No shared fallback secret (S7 hardening): production refuses to start without SESSION_SECRET;
// demo and test use a random per-process secret, so a known default can never sign a session.
function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if ((process.env.APP_MODE || 'demo') === 'production') throw new Error('SESSION_SECRET is required in production mode');
  return crypto.randomBytes(32).toString('hex');
}

const env = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/awaaz_dastak_demo',
  SESSION_SECRET: sessionSecret(),
  APP_MODE: process.env.APP_MODE || 'demo',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

env.CLIENT_ORIGINS = parseClientOrigins(process.env.CLIENT_ORIGINS, env.CLIENT_ORIGIN);
env.TRUST_PROXY_HOPS = parseTrustProxyHops(process.env.TRUST_PROXY_HOPS);

export default env;
