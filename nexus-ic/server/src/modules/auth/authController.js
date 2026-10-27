import User from './User.js';
import logger from '../../config/logger.js';
import { record } from '../audit/audit.js';
import { SESSION_COOKIE } from '../../config/session.js';

/**
 * Auth controller — login, logout, me.
 * No complainant text or identity ever logged.
 */
export async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = await User.findOne({ username, active: true });
  if (!user) {
    logger.warn({ action: 'login_failed', username: '[REDACTED]' });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    logger.warn({ action: 'login_failed' });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Store minimal session data
  req.session.user = {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    bureau: user.bureau,
    region: user.region,
  };

  await record({
    actorId: user._id.toString(),
    actorRole: user.role,
    action: 'auth.login',
    targetType: 'user',
    targetId: user._id.toString(),
    meta: {},
  });

  logger.info({ action: 'login_success', role: user.role });
  res.json({ user: req.session.user });
}

export async function logout(req, res) {
  if (req.session.user) {
    await record({
      actorId: req.session.user.id,
      actorRole: req.session.user.role,
      action: 'auth.logout',
      targetType: 'user',
      targetId: req.session.user.id,
      meta: {},
    });
  }
  req.session.destroy((err) => {
    if (err) {
      logger.error({ action: 'logout_error' });
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie(SESSION_COOKIE);
    res.json({ ok: true });
  });
}

export async function me(req, res) {
  res.json({ user: req.session.user });
}
