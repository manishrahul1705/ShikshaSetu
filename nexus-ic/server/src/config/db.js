import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Connect to MongoDB. Accepts an optional URI override (used by tests).
 */
export async function connectDB(uri) {
  const target = uri || (await import('./env.js')).default.MONGODB_URI;
  await mongoose.connect(target);
  logger.info('MongoDB connected');
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
