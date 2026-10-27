import mongoose from 'mongoose';
import crypto from 'node:crypto';
import User from '../auth/User.js';
import AuditEvent from '../audit/AuditEvent.js';
import { verifyChain } from '../audit/audit.js';
import { Fraud, LoginMetric, Reporter } from '../identity/models.js';
import { audit, fail } from '../identity/support.js';
import { BackupSimulator } from './BackupSimulator.js';
import { isLoginFeedHealthy } from '../identity/rateLimit.js';
const accountView = (row) => ({ id: row.id, username: row.username, role: row.role, active: row.active });
const roles = () => [...User.ROLES, 'other_stakeholder'];
export const accounts = async () => (await User.find().sort({ createdAt: 1 })).map(accountView);
export async function createAccount(actor, { role }) {
  if (!roles().includes(role)) throw fail(400, 'INVALID_ROLE');
  const username = `demo-${crypto.randomBytes(6).toString('hex')}`;
  const password = crypto.randomBytes(12).toString('base64url');
  const row = await User.create({ username, passwordHash: await User.hashPassword(password), role, displayName: 'User Account', synthetic: true });
  await audit(actor, 'sysadmin.account.created', 'user', row.id);
  return { ...accountView(row), initialPassword: password };
}
export async function updateAccount(actor, id, { role, active }) {
  if (!mongoose.isValidObjectId(id)) throw fail(404, 'ACCOUNT_NOT_FOUND');
  if ((role !== undefined && !roles().includes(role)) || (active !== undefined && typeof active !== 'boolean')) throw fail(400, 'INVALID_ACCOUNT_UPDATE');
  // Do not permit removing the administrator currently managing the system.
  if (id === actor.id && (active === false || (role && role !== 'system_admin'))) throw fail(409, 'SELF_LOCKOUT_FORBIDDEN');
  const row = await User.findById(id);
  if (!row) throw fail(404, 'ACCOUNT_NOT_FOUND');
  if (role !== undefined) row.role = role;
  if (active !== undefined) row.active = active;
  await row.save();
  // Revoke existing sessions so a role reduction applies immediately.
  await mongoose.connection.collection('sessions').deleteMany({ 'session': { $regex: `"id":"${id}"` } });
  await audit(actor, 'sysadmin.account.updated', 'user', row.id);
  return accountView(row);
}
export async function systemView() {
  const totalAttempts = await LoginMetric.countDocuments({ outcome: { $in: ['failed', 'succeeded'] } });
  const failures = await LoginMetric.countDocuments({ outcome: 'failed' });
  const signals = await Fraud.countDocuments();
  const reporters = await Reporter.countDocuments();
  return {
    health: { status: mongoose.connection.readyState === 1 ? 'ok' : 'UNKNOWN', uptimeSeconds: Math.floor(process.uptime()) },
    failedLogins: isLoginFeedHealthy() ? { numerator: failures, denominator: totalAttempts, scope: 'completed login attempts observed by S1a since reset' } : { status: 'UNKNOWN', reason: 'LOGIN_FEED_UNAVAILABLE' },
    fraudSignals: { numerator: signals, denominator: reporters, scope: 'signals per reporter since reset; multiple signals possible' },
    performance: { status: 'UNKNOWN', reason: 'PERFORMANCE_FEED_NOT_CONFIGURED' },
    chain: await verifyChain(),
    events: (await AuditEvent.find().sort({ seq: -1 }).limit(100)).map((row) => ({ seq: row.seq, at: row.at, action: row.action, actorRole: row.actorRole, targetType: row.targetType })),
    masterData: { status: 'PENDING_S1B' }, ruleChanges: 'RULEBOOK_ONLY',
  };
}
export async function backup(actor) {
  const result = await BackupSimulator.run();
  await audit(actor, 'sysadmin.backup.simulated', 'backup', result.id);
  return result;
}
