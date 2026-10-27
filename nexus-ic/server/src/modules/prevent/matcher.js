import { signals, prepareSemantic } from './signals.js';
import { getRules } from './rules.js';
import { resolveIdentity } from '../institutions/institutionService.js';
// identityCache: optional Map shared by one caller's batch (Stage 1 passes one per check), so
// matching one draft against many cases does not repeat the same PID/ICID lookup.
export async function matchCases(a, b, suppliedRules, identityCache = null) {
  const rules = suppliedRules || await getRules();
  const base = { advisory: true, canProceed: true, ruleVersion: rules.version || null, synthetic: !!rules.synthetic };
  if (!rules.configured) return { ...base, result: 'UNKNOWN', reasons: [rules.reason], counterReasons: ['HUMAN_REVIEW_REQUIRED'], signals: [], score: null, identity: 'UNKNOWN' };
  if (!a.institutionPid || a.institutionPid !== b.institutionPid) return { ...base, result: 'CLEAR', reasons: ['PID_MISMATCH'], counterReasons: ['NAMES_DO_NOT_LINK_INSTITUTIONS'], signals: [], score: 0, identity: 'PID_MISMATCH' };
  const identifiers = [a.institutionIcid || a.icidSnapshot?.icid, b.institutionIcid || b.icidSnapshot?.icid].filter(value => value && value !== 'not available');
  const lookup = (value) => {
    if (!identityCache) return resolveIdentity(a.institutionPid, value);
    const key = `${a.institutionPid}|${value}`;
    if (!identityCache.has(key)) identityCache.set(key, resolveIdentity(a.institutionPid, value));
    return identityCache.get(key);
  };
  const identities = await Promise.all(identifiers.map(lookup));
  const identity = identities.includes('IDENTITY_REVIEW') ? 'IDENTITY_REVIEW' : identities.includes('MATCH') ? 'MATCH' : 'NOT_AVAILABLE';
  await prepareSemantic(a, b);
  const evidence = signals(a, b, rules);
  const score = evidence.reduce((total, signal) => total + signal.contribution, 0);
  const review = identity === 'IDENTITY_REVIEW' || (score >= rules.overlapThreshold && evidence[0].value >= rules.minIssueSimilarity);
  return { ...base, result: review ? 'REVIEW' : 'CLEAR', score, signals: evidence, identity,
    reasons: [identity, review ? 'SIMILAR_ISSUE_EVIDENCE' : 'INSUFFICIENT_SIMILARITY'],
    counterReasons: evidence.filter(signal => !signal.value).map(signal => `${signal.name}:${signal.reason}`) };
}
