import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import env from './config/env.js';
import logger from './config/logger.js';
import { seedDemoAccounts } from './modules/auth/seed.js';

async function start() {
  await connectDB();
  if (env.APP_MODE === 'demo') {
    await seedDemoAccounts();
  }
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info({ action: 'server_started', port: env.PORT, mode: env.APP_MODE });
    console.log(`AWAAZ DASTAK server listening on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  logger.error({ action: 'startup_failed', message: err.message });
  process.exit(1);
});
