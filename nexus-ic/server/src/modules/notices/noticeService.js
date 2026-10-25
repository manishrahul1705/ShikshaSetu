import mongoose from 'mongoose';
import logger from '../../config/logger.js';
import { sha256 } from '../closure/util.js';

/**
 * Minimal status notices by email and SMS to complainants (SPEC 12.1, N35)
 * through an idempotent outbox (S27).
 *
 * One notice per status change and channel, keyed by a unique idempotency key;
 * dispatch claims each entry once, so a re-run never resends. Messages carry
 * only the app title, the Master Case ID and the new status: no narrative, no
 * names, no reporter ID, no other PII. Delivery is to EmailSimulator and
 * SmsSimulator, which write to a local sink (Rule 5); nothing leaves the machine.
 */
const outboxSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, required: true, unique: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    masterCaseId: { type: String, required: true },
    status: { type: String, required: true },
    channel: { type: String, enum: ['EMAIL', 'SMS'], required: true },
    recipientRef: { type: String, required: true },
    body: { type: String, required: true },
    state: { type: String, enum: ['QUEUED', 'SENDING', 'SENT'], default: 'QUEUED', index: true },
    sentAt: { type: Date, default: null },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true, strict: 'throw' }
);
export const StatusNotice =
  mongoose.models.status_notice_outbox || mongoose.model('status_notice_outbox', outboxSchema, 'status_notice_outbox');

const sinkSchema = new mongoose.Schema(
  {
    noticeId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    simulator: { type: String, enum: ['EmailSimulator', 'SmsSimulator'], required: true },
    recipientRef: { type: String, required: true },
    body: { type: String, required: true },
    deliveredAt: { type: Date, required: true },
  },
  { strict: 'throw' }
);
export const NoticeSink =
  mongoose.models.notice_simulator_sink || mongoose.model('notice_simulator_sink', sinkSchema, 'notice_simulator_sink');

const label = (s) => (s === 'SUBMITTED' ? 'Registered' : s);
const TEMPLATE = /^ShikshaSetu: case NX-\d{4}-\d{6} status is now "[A-Za-z_ /]+"\. Log in to view details\.$/;

/** The only message text. Anything that does not match the template is refused. */
export function noticeBody(masterCaseId, status) {
  const body = `ShikshaSetu: case ${masterCaseId} status is now "${label(status)}". Log in to view details.`;
  if (!TEMPLATE.test(body)) throw new Error('NOTICE_TEMPLATE_VIOLATION');
  return body;
}

export class EmailSimulator {
  static async deliver(notice) {
    return NoticeSink.create({ noticeId: notice._id, simulator: 'EmailSimulator', recipientRef: notice.recipientRef, body: notice.body, deliveredAt: new Date() });
  }
}
export class SmsSimulator {
  static async deliver(notice) {
    return NoticeSink.create({ noticeId: notice._id, simulator: 'SmsSimulator', recipientRef: notice.recipientRef, body: notice.body, deliveredAt: new Date() });
  }
}

export async function queueStatusNotice(caseDoc) {
  if (!caseDoc?.reporterId || !/^NX-\d{4}-\d{6}$/.test(caseDoc.masterCaseId || '')) return [];
  const body = noticeBody(caseDoc.masterCaseId, caseDoc.status);
  const changeRef = new Date(caseDoc.updatedAt || Date.now()).toISOString();
  const queued = [];
  for (const channel of ['EMAIL', 'SMS']) {
    const idempotencyKey = sha256(`${caseDoc._id}|${caseDoc.status}|${changeRef}|${channel}`);
    const res = await StatusNotice.updateOne(
      { idempotencyKey },
      { $setOnInsert: { idempotencyKey, caseId: caseDoc._id, masterCaseId: caseDoc.masterCaseId, status: label(caseDoc.status), channel, recipientRef: caseDoc.reporterId, body, state: 'QUEUED' } },
      { upsert: true }
    );
    if (res.upsertedCount) queued.push(idempotencyKey);
  }
  return queued;
}

/** Claims each QUEUED entry atomically, so concurrent or repeated runs never resend. */
export async function dispatchOutbox(limit = 100) {
  let sent = 0;
  for (let i = 0; i < limit; i++) {
    const notice = await StatusNotice.findOneAndUpdate({ state: 'QUEUED' }, { $set: { state: 'SENDING' } }, { new: true, sort: { createdAt: 1 } });
    if (!notice) break;
    await (notice.channel === 'EMAIL' ? EmailSimulator : SmsSimulator).deliver(notice);
    notice.state = 'SENT';
    notice.sentAt = new Date();
    await notice.save();
    sent++;
  }
  return { sent };
}

export async function onStatusChanged(caseDoc) {
  try {
    if ((await queueStatusNotice(caseDoc)).length) await dispatchOutbox(10);
  } catch (err) {
    // A notice failure never blocks a case change. No case text is logged (S28).
    logger.warn({ action: 'notice.queue_failed', code: err.code || 'ERROR' });
  }
}
