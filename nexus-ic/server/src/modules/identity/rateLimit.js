import crypto from 'node:crypto';
import { config } from './config.js';
import { RateBucket, LoginMetric } from './models.js';
import { audit, serial } from './support.js';
import logger from '../../config/logger.js';
const system = { id: 'identity-rate-limiter', role: 'system' };
let loginFeedHealthy = true;
export const isLoginFeedHealthy = () => loginFeedHealthy;
export function limiter(kind) {
  return async (req, res, next) => {
    try {
      const key = crypto.createHash('sha256').update(`${kind}:${req.session?.user?.id || req.ip}`).digest('hex');
      const now = new Date();
      await RateBucket.updateOne({ key, expiresAt: { $lte: now } }, { $set: { count: 0, expiresAt: new Date(Date.now() + config.rateWindowMs) } });
      const row = await RateBucket.findOneAndUpdate({ key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + config.rateWindowMs) } }, { upsert: true, new: true });
      await serial(() => audit(req.session?.user || system, 'identity.rate.counted', 'rate_bucket', row.id));
      const limit = kind === 'login' ? config.loginLimit : kind === 'otp' ? config.otpLimit : config.verificationLimit;
      if (row.count > limit) return res.status(429).json({ error: 'RATE_LIMITED' });
      if (kind === 'login') {
        const metric = await LoginMetric.create({ outcome: 'pending' });
        await serial(() => audit(system, 'identity.login.attempted', 'login_metric', metric.id));
        res.once('finish', () => {
          serial(async () => {
            await LoginMetric.updateOne({ _id: metric._id }, { $set: { outcome: res.statusCode === 200 ? 'succeeded' : 'failed' } });
            await audit(system, 'identity.login.completed', 'login_metric', metric.id);
          }).catch(() => { loginFeedHealthy = false; logger.warn({ action: 'identity.login.feed_unavailable' }); });
        });
      }
      next();
    } catch (_err) { res.status(503).json({ error: 'RATE_LIMIT_UNAVAILABLE' }); }
  };
}
export const loginLimiter = limiter('login');
