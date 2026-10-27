import AuditEvent from '../audit/AuditEvent.js';
import { recordAudit } from '../audit/audit.js';
import Institution from '../institutions/Institution.js';
import { resolveIdentity } from '../institutions/institutionService.js';
import RoutingDecision from '../routing/models.js';
import { Transfer } from '../trace/models.js';
import { ClosureRecord } from '../closure/models.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { fail, actorId, findCase } from '../closure/util.js';

/**
 * Officer case journey (read-only): one view of a case's identity, source
 * trail and history. It shows the PID and ICID snapshot (N09 touchpoint 5),
 * the intake channel and external source references (provenance), the
 * routing decision, transfers and the case-scoped audit events.
 *
 * Never returns the narrative, reporter identity, actor IDs or event meta.
 * Denials return 404 with an audited event, exactly like the case view (S21).
 */
export const JOURNEY_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor', 'system_admin'];

const SOURCE_LABELS = { web: 'AWAAZ DASTAK web / PWA intake', email: 'Email intake (EmailSimulator)', import: 'Bulk import (adapter)' };

export async function caseJourney(user, idOrMaster) {
  const caseDoc = await findCase(idOrMaster);
  if (!caseDoc || !(await canAccessCase(user, caseDoc))) {
    if (caseDoc) {
      await recordAudit({ actorId: actorId(user), actorRole: user.role, action: 'case.access_denied_idor', targetType: 'Case', targetId: caseDoc.masterCaseId, meta: { reason: 'IDOR_DENIED', view: 'journey' } });
    }
    throw fail(404, 'CASE_NOT_FOUND', 'Case not found');
  }
  const c = caseDoc.toObject();
  const registry = await Institution.findOne({ pid: c.institutionPid }).select('pid name region state icid -_id').lean();
  const identity = await resolveIdentity(c.institutionPid, c.institutionIcid);

  // The viewing event is recorded first, so the returned history includes it.
  await recordAudit({ actorId: actorId(user), actorRole: user.role, action: 'case.journey.viewed', targetType: 'Case', targetId: c.masterCaseId, meta: {} });
  const [decisions, transfers, events, closures] = await Promise.all([
    RoutingDecision.find({ caseId: c._id }).sort({ createdAt: 1 }).lean(),
    Transfer.find({ caseId: c._id }).sort({ requestedAt: 1 }).lean(),
    AuditEvent.find({ targetId: { $in: [c.masterCaseId, String(c._id)] } }).sort({ seq: 1 }).limit(300).select('seq at actorRole action targetType hash -_id').lean(),
    ClosureRecord.find({ caseId: c._id }).sort({ proposedAt: 1 }).lean(),
  ]);

  // Dated milestones from the case's own records (registration, routing, transfers, PROOF closure).
  const milestones = [{ at: c.createdAt, kind: 'REGISTERED', label: `Registered via ${(c.channel || 'web').toUpperCase()}`, by: 'complainant' }];
  for (const d of decisions) milestones.push({ at: d.createdAt, kind: 'ROUTED', label: `Routed to ${d.primary} (${d.ruleVersion})`, by: d.overriddenBy ? 'officer override' : 'RuleBook' });
  for (const t of transfers) {
    milestones.push({ at: t.requestedAt, kind: 'TRANSFER_REQUESTED', label: `Transfer requested ${t.fromBureau} → ${t.toBureau}`, by: t.fromBureau });
    if (t.acknowledgedAt) milestones.push({ at: t.acknowledgedAt, kind: `TRANSFER_${t.status}`, label: `Transfer ${String(t.status).toLowerCase()} by ${t.toBureau}`, by: t.toBureau });
  }
  for (const r of closures) {
    milestones.push({ at: r.proposedAt, kind: 'CLOSURE_PROPOSED', label: 'Closure proposed with evidence (NEXUS PROOF)', by: r.proposedByRole });
    if (r.approvedAt) milestones.push({ at: r.approvedAt, kind: 'CLOSURE_APPROVED', label: 'Closure approved by a different officer', by: r.approvedByRole });
    if (r.closedAt) milestones.push({ at: r.closedAt, kind: 'CLOSED', label: 'Case closed', by: r.approvedByRole || 'officer' });
  }
  milestones.sort((a, b) => new Date(a.at) - new Date(b.at));


  const sources = [{ kind: 'CHANNEL', system: (c.channel || 'web').toUpperCase(), ref: SOURCE_LABELS[c.channel || 'web'] || c.channel, at: c.createdAt }];
  for (const ref of c.externalRefs || []) sources.push({ kind: 'EXTERNAL_REF', system: ref.sourceSystem, ref: ref.sourceCaseRef, at: null });

  return {
    synthetic: true,
    case: {
      masterCaseId: c.masterCaseId,
      status: c.status,
      category: c.category,
      subCategory: c.subCategory,
      priority: c.priority,
      channel: c.channel || 'web',
      languageTag: c.languageTag,
      owningBureau: c.owningBureau,
      currentOwner: c.currentOwner ? { office: c.currentOwner.office, role: c.currentOwner.role } : null,
      transferStatus: c.transferStatus || 'NONE',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      documentCount: (c.documentIds || []).length,
      institutionRedressal: c.institutionRedressal?.answer ? { answer: c.institutionRedressal.answer, raisedAt: c.institutionRedressal.raisedAt, outcome: c.institutionRedressal.outcome } : null,
    },
    institution: {
      pid: c.institutionPid,
      icid: c.institutionIcid || null,
      icidResult: identity,
      snapshot: c.pidSnapshot ? { name: c.pidSnapshot.name || null, region: c.pidSnapshot.region || null, state: c.pidSnapshot.state || null } : null,
      registry: registry || null,
    },
    sources,
    routing: decisions.map((d) => ({ at: d.createdAt, primary: d.primary, secondary: d.secondary, confidence: d.confidence, reasons: d.reasons, ruleVersion: d.ruleVersion, manualReview: d.isManualReview, overridden: Boolean(d.overriddenBy) })),
    transfers: transfers.map((t) => ({ fromBureau: t.fromBureau, toBureau: t.toBureau, status: t.status, requestedAt: t.requestedAt, acknowledgedAt: t.acknowledgedAt || null, dueAt: t.dueAt || null })),
    milestones,
    events: events.map((e) => ({ seq: e.seq, at: e.at, actorRole: e.actorRole, action: e.action, hash: e.hash.slice(0, 12) })),
  };
}
