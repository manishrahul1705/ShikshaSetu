import mongoose from 'mongoose';
import { Reveal, Vault } from './models.js';
import { seal, open } from './crypto.js';
import { config } from '../identity/config.js';
import { Reporter } from '../identity/models.js';
import { toOfficerView } from '../identity/reporters.js';
import { audit, fail, text } from '../identity/support.js';
import { hasConsent } from '../consent/service.js';

// Bureau/region authorization comes from the future case owner, never a
// client-supplied bureau. Until wired, these officers fail closed.
let scopeResolver = async () => false;
export function setRevealScopeResolver(resolver) { scopeResolver = resolver; }
async function canRequest(user, reporterId) {
  if (config.revealApproverRoles.includes(user.role)) return true;
  if (!['bureau_officer', 'regional_officer'].includes(user.role)) return false;
  return (await scopeResolver(user, reporterId)) === true;
}
const summary = (row) => ({ ...toOfficerView(row), id: row.id, state: row.state, purposeRecorded: true, expiresAt: row.expiresAt || null });
async function expire(user) {
  const rows = await Reveal.find({ state: 'approved', expiresAt: { $lte: new Date() } });
  for (const row of rows) {
    const updated = await Reveal.updateOne({ _id: row._id, state: 'approved' }, { $set: { state: 'expired' } });
    if (updated.modifiedCount) await audit(user, 'identity.reveal.expired', 'reveal', row.id);
  }
}
export async function requestReveal(user, reporterId, purpose) {
  text(purpose, 500);
  if (!/^RP-[A-Z0-9]{4}$/.test(reporterId || '')) throw fail(400, 'INVALID_REPORTER');
  if (!await canRequest(user, reporterId)) throw fail(403, 'REVEAL_SCOPE_DENIED');
  const reporter = await Reporter.findOne({ pseudonymousReporterId: reporterId });
  const vault = await Vault.findOne({ reporterId });
  if (!reporter || !vault) throw fail(404, 'REPORTER_NOT_FOUND');
  const id = new mongoose.Types.ObjectId();
  const payload = open(vault, reporterId);
  await Vault.updateOne({ _id: vault._id }, { $set: seal({ ...payload, revealPurposes: { ...(payload.revealPurposes || {}), [String(id)]: purpose.trim() } }, reporterId) });
  const row = await Reveal.create({ _id: id, reporterId, purposeRecorded: true, requesterId: user.id, requesterRole: user.role, bureau: user.bureau || null, region: user.region || null });
  await audit(user, 'identity.reveal.requested', 'reveal', row.id);
  return summary(row);
}
export async function listReveals(user) {
  await expire(user);
  const filter = config.revealApproverRoles.includes(user.role) ? {} : { requesterId: user.id };
  return (await Reveal.find(filter).sort({ createdAt: -1 })).map(row => ({ ...summary(row),
    canApprove: row.state === 'pending' && config.revealApproverRoles.includes(user.role) && row.requesterId !== user.id,
    canView: row.state === 'approved' && row.requesterId === user.id,
  }));
}
async function find(id) {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw fail(404, 'REVEAL_NOT_FOUND');
  const row = await Reveal.findById(id);
  if (!row) throw fail(404, 'REVEAL_NOT_FOUND');
  return row;
}
export async function approveReveal(user, id) {
  const row = await find(id);
  if (!config.revealApproverRoles.includes(user.role) || row.requesterId === user.id) throw fail(403, 'DIFFERENT_APPROVER_REQUIRED');
  if (row.state !== 'pending') throw fail(409, 'REVEAL_NOT_PENDING');
  const requester = { id: row.requesterId, role: row.requesterRole, bureau: row.bureau, region: row.region };
  if (!await canRequest(requester, row.reporterId)) throw fail(403, 'REVEAL_SCOPE_DENIED');
  row.state = 'approved'; row.approverId = user.id; row.expiresAt = new Date(Date.now() + config.revealLifetimeMs);
  await row.save();
  await audit(user, 'identity.reveal.approved', 'reveal', row.id);
  return summary(row);
}
export async function viewReveal(user, id) {
  await expire(user);
  const row = await find(id);
  if (row.requesterId !== user.id || !await canRequest(user, row.reporterId)) throw fail(403, 'REVEAL_SCOPE_DENIED');
  if (row.state !== 'approved' || !row.expiresAt || row.expiresAt <= new Date()) throw fail(403, 'REVEAL_NOT_ACTIVE');
  if (!await hasConsent(row.reporterId, 'verification') && !await hasConsent(row.reporterId, 'manual_verification')) throw fail(403, 'CONSENT_WITHDRAWN');
  const vault = await Vault.findOne({ reporterId: row.reporterId });
  const payload = open(vault, row.reporterId);
  const { revealPurposes, manualDecisionHistory, manualDecision, ...identity } = payload;
  await audit(user, 'identity.reveal.viewed', 'reveal', row.id);
  return { ...summary(row), identity };
}
