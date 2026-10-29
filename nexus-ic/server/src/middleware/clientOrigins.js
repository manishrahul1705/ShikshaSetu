import env from '../config/env.js';

export const isAllowedOrigin = (origin) => env.CLIENT_ORIGINS.includes(origin);

export function corsOrigin(origin, callback) {
  if (!origin || isAllowedOrigin(origin)) return callback(null, true);
  const error = new Error('CORS_ORIGIN_MISMATCH');
  error.status = 403;
  return callback(error);
}
