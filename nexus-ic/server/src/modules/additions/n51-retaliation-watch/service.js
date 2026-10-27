import mongoose from 'mongoose';
import Case from '../../cases/Case.js';
import { recordAudit } from '../../audit/audit.js';
import { hasConsent, applyRetentionPolicy } from '../../consent/service.js';
import { fail, sha256 } from '../../closure/util.js';

/**
 * N51 Retaliation Watch (ADDITIONS.md).
 *
 * After a complaint, the N01/N02 simulators re-check the complainant's
 * enrolment or employment. A sudden suspension, expulsion or termination sends
 * a private "possible retaliation, review" alert to the Competent Authority.
 * Advisory only, a human decides; only for complainants with a recorded N07
 * consent for this purpose; names no guilt.
 *
 * Live path: consent purpose 'retaliation_watch' in S1a's ledger (POST /consents)
 * and S1a's recheckReporterStatus() over the simulators. Both stay injectable for tests.
 */
export const WATCH_PURPOSE = 'retaliation_watch';
export const RETALIATION_SIGNALS = ['SUSPENDED', 'EXPELLED', 'TERMINATED'];
export const ADVISORY_TEXT = 'Possible retaliation, review. Advisory only: a human decides. This is not a finding against any person or institution.';

const alertSchema = new mongoose.Schema(
  {
    dedupeKey: { type: String, required: true, unique: true },
    masterCaseIds: { type: [String], required: true },
    signal: { type: String, enum: RETALIATION_SIGNALS, required: true },
    message: { type: String, required: true },
    recipientRole: { type: String, default: 'competent_authority' },
    state: { type: String, enum: ['OPEN', 'REVIEWED'], default: 'OPEN' },
    detectedAt: { type: Date, required: true },
    synthetic: { type: Boolean, default: true },
  },
  { strict: 'throw' }
);
export const RetaliationAlert =
  mongoose.models.retaliation_alerts || mongoose.model('retaliation_alerts', alertSchema, 'retaliation_alerts');

/** Default re-check: S1a's N01/N02 simulators, by pseudonymous reporter ID (status only, no identity). */
export async function simulatorRecheck(reporterId) {
  const { recheckReporterStatus } = await import('../../identity/index.js');
  return recheckReporterStatus(reporterId);
}

export async function runRetaliationWatch({ consentCheck = hasConsent, recheck = simulatorRecheck, now = new Date(), actor = { id: 'retaliation-watch', role: 'system' } } = {}) {
  const reporterIds = (await Case.distinct('reporterId')).filter((r) => /^RP-[A-Z0-9]{4}$/.test(r));
  const summary = { checked: 0, skippedNoConsent: 0, unknown: 0, alerts: [] };
  for (const reporterId of reporterIds) {
    // Only with an active N07 consent for this purpose (F52: a withdrawal stops it at once).
    if (!(await consentCheck(reporterId, WATCH_PURPOSE))) {
      summary.skippedNoConsent++;
      continue;
    }
    summary.checked++;
    const result = await recheck(reporterId);
    if (!RETALIATION_SIGNALS.includes(result?.status)) {
      if (result?.status !== 'ACTIVE') summary.unknown++;
      continue;
    }
    const masterCaseIds = (await Case.find({ reporterId }).select('masterCaseId').lean()).map((c) => c.masterCaseId).sort();
    const dedupeKey = sha256(`${reporterId}|${result.status}|${masterCaseIds.join(',')}`);
    const res = await RetaliationAlert.updateOne(
      { dedupeKey },
      { $setOnInsert: { dedupeKey, masterCaseIds, signal: result.status, message: ADVISORY_TEXT, detectedAt: now, state: 'OPEN' } },
      { upsert: true }
    );
    if (res.upsertedCount) {
      summary.alerts.push({ masterCaseIds, signal: result.status });
      await recordAudit({
        actorId: String(actor.id), actorRole: actor.role, action: 'retaliation_watch.alert', targetType: 'RetaliationAlert', targetId: dedupeKey,
        meta: { masterCaseIds, signal: result.status },
      });
    }
  }
  return summary;
}

export async function listRetaliationAlerts(user) {
  if (user.role !== 'competent_authority') throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  return RetaliationAlert.find({}).sort({ detectedAt: -1 }).select('-_id -__v -dedupeKey').lean();
}

/** F52 hint: retention for S5 records follows the consent module; no retention rule exists in any source. */
export async function retentionFor(reporterId) {
  return applyRetentionPolicy(reporterId);
}
