import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createSessionMiddleware } from './config/session.js';
import routes from './routes.js';
import env from './config/env.js';
import logger from './config/logger.js';
import csrfOrigin from './middleware/csrfOrigin.js';
import { corsOrigin } from './middleware/clientOrigins.js';
import { startReminderScheduler } from './modules/additions/n108-reminders/scheduler.js';

/**
 * Create and configure the Express app.
 * Accepts an optional mongoUri for tests.
 */
export function createApp(mongoUri) {
  startReminderScheduler();
  const app = express();
  // Configure before sessions read req.secure; never trust every proxy.
  app.set('trust proxy', env.TRUST_PROXY_HOPS);

  // Security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Session (S16)
  app.use(createSessionMiddleware(mongoUri));

  // API routes (state-changing requests from another site's page are refused first)
  app.use('/api/v1', csrfOrigin, routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err, req, res, _next) => {
    if (err.status === 403 && err.message === 'CORS_ORIGIN_MISMATCH') {
      return res.status(403).json({ error: err.message });
    }
    logger.error({ action: 'unhandled_error', message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
