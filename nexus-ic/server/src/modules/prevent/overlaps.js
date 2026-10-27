import Case from '../cases/Case.js';
import { matchCases } from './matcher.js';
import { issueTokens, issueScore } from './signals.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { getReporterId } from '../identity/index.js';
import { getRules } from './rules.js';
import { caseAccess, audit } from './access.js';
import mongoose from 'mongoose';
const inFlight = new Map();
export async function listOverlaps(user, institutionPid) {
  // Share concurrent identical reads only. No TTL or completed result is kept;
  // new data and permission checks are re-evaluated on the next request.
  const key = JSON.stringify([mongoose.connection.name, String(user.id || user._id), user.role, user.bureau, user.region, institutionPid || '']);
  let pending = inFlight.get(key);
  if (!pending) {
    pending = computeOverlaps(user, institutionPid);
    inFlight.set(key, pending);
  }
  try {
    const result = await pending;
    if (inFlight.get(key) === pending) inFlight.delete(key);
    await audit(user, 'overlaps.checked', result.result === 'UNKNOWN' && !result.ruleVersion ? 'unconfigured' : 'list');
    return result;
  } finally {
    if (inFlight.get(key) === pending) inFlight.delete(key);
  }
}
async function computeOverlaps(user, institutionPid) {
  const rules = await getRules();
  if (!rules.configured) return { result: 'UNKNOWN', reasons: [rules.reason], pairs: [], restrictedCount: 0 };
  const rows = await Case.find(institutionPid ? { institutionPid } : {}).lean();
  // Scale (S7): the viewer's reporter ID is resolved once, not once per case.
  const viewer = { ...user, reporterId: await getReporterId(String(user.id || user._id)) };
  const permissions = await Promise.all(rows.map(row => canAccessCase(viewer, row)));
  const pairs = [], restricted = new Set();
  // Scale (S7), same results: only cases at the same institution can match (the matcher returns
  // CLEAR on a PID mismatch), and a pair whose issue score is below minIssueSimilarity cannot be
  // REVIEW unless an ICID forces identity review, so those pairs skip the full matcher.
  const tokens = rows.map(row => issueTokens(row.narrative));
  const hasIcid = rows.map(row => { const v = row.institutionIcid || row.icidSnapshot?.icid; return !!v && v !== 'not available'; });
  const groups = new Map();
  rows.forEach((row, i) => { if (!groups.has(row.institutionPid)) groups.set(row.institutionPid, []); groups.get(row.institutionPid).push(i); });
  const identityCache = new Map();
  for (const members of groups.values()) for (let x = 0; x < members.length; x++) for (let y = x + 1; y < members.length; y++) {
    const i = members[x], j = members[y];
    if (!permissions[i] && !permissions[j]) continue;
    if (!hasIcid[i] && !hasIcid[j] && issueScore(tokens[i], tokens[j]) < rules.minIssueSimilarity) continue;
    const match = await matchCases(rows[i], rows[j], rules, identityCache);
    if (match.result !== 'REVIEW') continue;
    if (!permissions[i] || !permissions[j]) { restricted.add(String(rows[permissions[i] ? j : i]._id)); continue; }
    pairs.push({ cases: [rows[i].masterCaseId, rows[j].masterCaseId], ...match });
  }
  return { result: pairs.length || restricted.size ? 'REVIEW' : 'CLEAR', pairs, restrictedCount: restricted.size, synthetic: !!rules.synthetic, ruleVersion: rules.version };
}
