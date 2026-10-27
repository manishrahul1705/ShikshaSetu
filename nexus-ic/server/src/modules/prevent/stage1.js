import Case from '../cases/Case.js';
import Institution from '../institutions/Institution.js';
import { isVerified, getReporterId } from '../identity/index.js';
import { SimilarityCheck } from './models.js';
import { matchCases } from './matcher.js';
import { getRules } from './rules.js';
import { readCase, uid, audit, fail, hash } from './access.js';
import { canAccessCase } from '../../middleware/rbac.js';
export async function checkSimilar(user, draft) {
  if (!await isVerified(uid(user))) throw fail(403, 'VERIFICATION_REQUIRED');
  if (typeof draft.institutionPid !== 'string' || !/^1-\d{10}$/.test(draft.institutionPid) || typeof draft.narrative !== 'string' || !draft.narrative.trim()) throw fail(400, 'INVALID_DRAFT');
  if (!await Institution.exists({ pid: draft.institutionPid })) throw fail(400, 'INSTITUTION_NOT_VERIFIED');
  const reporterId = await getReporterId(uid(user));
  const rules = await getRules();
  const hints = [], shownHints = [];
  let generic = false, unknown = !rules.configured;
  // Authorization is evaluated for every candidate. Private matching can produce
  // only the fixed generic hint, never an identifier, score, text or reason derived
  // from a third party. Case content never enters similarity-check storage.
  // Scale (S7): the reporter ID is resolved once, and access is checked only for candidates the
  // matcher flags, so a large institution costs one query plus in-memory matching.
  const viewer = { ...user, reporterId };
  const identityCache = new Map();
  for (const row of await Case.find({ institutionPid: draft.institutionPid }).lean()) {
    const result = await matchCases(draft, row, rules, identityCache);
    unknown ||= result.result === 'UNKNOWN';
    if (result.result !== 'REVIEW') continue;
    const allowed = await canAccessCase(viewer, row);
    if (allowed && row.reporterId === reporterId) {
      hints.push({ caseId: row.masterCaseId, result: result.result, score: result.score, signals: result.signals, reasons: result.reasons, counterReasons: result.counterReasons });
      shownHints.push(row.masterCaseId);
    } else generic = true;
  }
  if (generic) { hints.push({ generic: true, notice: 'a similar open matter exists', reasons: ['SIMILAR_ISSUE_EVIDENCE'], counterReasons: ['ADVISORY_ONLY'] }); shownHints.push('GENERIC'); }
  const check = await SimilarityCheck.create({ reporterId, draftHash: hash(JSON.stringify(draft)), shownHints });
  await audit(user, 'similarity.checked', check.id);
  return { checkId: check.id, result: unknown ? 'UNKNOWN' : hints.length ? 'REVIEW' : 'CLEAR', advisory: true, canProceed: true,
    ruleVersion: rules.version || null, synthetic: !!rules.synthetic, hints,
    reasons: unknown ? [rules.reason || 'MATCHING_UNAVAILABLE'] : hints.length ? ['SIMILAR_ISSUE_EVIDENCE'] : ['INSUFFICIENT_SIMILARITY'], counterReasons: ['ADVISORY_ONLY'] };
}
export async function chooseSimilar(user, { checkId, choice, caseId }) {
  if (!/^[a-f\d]{24}$/i.test(checkId || '') || !['continue', 'view', 'cancel'].includes(choice)) throw fail(400, 'INVALID_CHOICE');
  const reporterId = await getReporterId(uid(user));
  const row = await SimilarityCheck.findOne({ _id: checkId, reporterId });
  if (!row) throw fail(404, 'CHECK_NOT_FOUND');
  if (choice === 'view') {
    if (!row.shownHints.includes(caseId) || caseId === 'GENERIC') throw fail(404, 'CASE_NOT_FOUND');
    const earlier = await readCase(user, caseId);
    if (earlier.reporterId !== reporterId) throw fail(404, 'CASE_NOT_FOUND');
  }
  row.userChoice = choice; await row.save(); await audit(user, `similarity.choice.${choice}`, row.id);
  return { recorded: true, canProceed: true, ...(choice === 'view' ? { caseId } : {}) };
}
