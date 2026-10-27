import crypto from 'node:crypto';
import User from '../auth/User.js';
import { record } from '../audit/audit.js';
import { isVerified, getReporterId } from '../identity/index.js';
export const fail = (status, code) => Object.assign(new Error(code), { status, code });
export const uid = user => String(user.id || user._id);
export const digest = value => crypto.createHash('sha256').update(value).digest('hex');
export async function audit(user, action, targetId, meta = {}) {
  return record({ actorId: uid(user), actorRole: user.role, action: `channels.${action}`, targetType: 'channel', targetId: String(targetId), meta });
}
export async function verified(user) {
  if (!await isVerified(uid(user))) throw fail(403, 'VERIFICATION_REQUIRED');
  const reporterId = await getReporterId(uid(user));
  if (!reporterId) throw fail(403, 'VERIFICATION_REQUIRED');
  return reporterId;
}
export function demoOnly() {
  if ((process.env.APP_MODE || 'demo') !== 'demo') throw fail(503, 'SIMULATOR_ONLY');
}
export const handle = work => async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const live = await User.findById(uid(req.user)).lean();
    if (!live?.active || live.role !== req.user.role) throw fail(403, 'SESSION_REVOKED');
    req.user = { ...live, id: String(live._id) };
    res.json(await work(req));
  } catch (error) {
    // Never serialize submitted CSV, sender, body, schema errors or provider messages.
    try { await audit(req.user, 'request.denied', 'request'); }
    catch { return res.status(503).json({ error: 'AUDIT_UNAVAILABLE' }); }
    res.status(error.status || 503).json({ error: error.code || 'CHANNEL_UNAVAILABLE' });
  }
};
