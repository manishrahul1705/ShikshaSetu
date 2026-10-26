import { runReminders } from './service.js';
import logger from '../../../config/logger.js';
let timer;
export function startReminderScheduler() {
  if (process.env.NODE_ENV === 'test' || process.env.REMINDERS_ENABLED !== 'true' || timer) return;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await runReminders(); }
    catch { logger.error({ action: 'reminders.scheduler.failed' }); }
    finally { running = false; }
  };
  timer = setInterval(run, 86400000);
  timer.unref();
  // Start only after the connection is ready; never race database startup.
  import('mongoose').then(({ default: mongoose }) => {
    if (mongoose.connection.readyState === 1) run();
    else mongoose.connection.once('open', run);
  });
}
