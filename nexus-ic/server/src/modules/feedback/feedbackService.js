import { getReporterId } from '../identity/index.js';
import { recordAudit } from '../audit/audit.js';
import { FeedbackRecord } from './models.js';
import { fail, actorId, findCase, COMPLAINANT_ROLES } from '../closure/util.js';

/**
 * Complainant feedback (SPEC 10.1, N23).
 *
 * Collected after resolution is proposed or verified (and after closure).
 * It is recorded and shown to reviewers; it never closes, reopens or changes
 * a case. Feedback text never goes into audit meta or logs (S28).
 */
export const FEEDBACK_STATUSES = ['Resolution Proposed', 'Verified/Approved', 'Closed'];

export async function ownCase(user, caseRef) {
  if (!COMPLAINANT_ROLES.includes(user.role)) throw fail(404, 'CASE_NOT_FOUND');
  const reporterId = await getReporterId(actorId(user));
  const caseDoc = await findCase(caseRef);
  if (!caseDoc || !reporterId || caseDoc.reporterId !== reporterId) throw fail(404, 'CASE_NOT_FOUND');
  return { caseDoc, reporterId };
}

export async function submitFeedback(user, caseRef, { rating, text = '' } = {}) {
  const { caseDoc, reporterId } = await ownCase(user, caseRef);
  if (!FEEDBACK_STATUSES.includes(caseDoc.status)) throw fail(409, 'FEEDBACK_NOT_OPEN');
  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) throw fail(400, 'RATING_INVALID');
  if (typeof text !== 'string' || text.length > 2000) throw fail(400, 'TEXT_INVALID');
  const row = await FeedbackRecord.create({ caseId: caseDoc._id, reporterId, statusAtFeedback: caseDoc.status, rating: value, text: text.trim() });
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'feedback.recorded', targetType: 'Case', targetId: String(caseDoc._id),
    meta: { masterCaseId: caseDoc.masterCaseId, feedbackId: String(row._id), statusAtFeedback: caseDoc.status },
  });
  return { id: String(row._id), rating: row.rating, at: row.at, statusAtFeedback: row.statusAtFeedback, caseStatus: caseDoc.status };
}

export async function ownFeedback(caseDoc, reporterId) {
  return FeedbackRecord.find({ caseId: caseDoc._id, reporterId }).sort({ at: 1 }).select('rating text at statusAtFeedback -_id').lean();
}
