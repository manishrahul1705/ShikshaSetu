import Case from '../../cases/Case.js';
import User from '../../auth/User.js';
import { canAccessCase } from '../../../middleware/rbac.js';
import { recordAudit } from '../../audit/audit.js';
import { CaseAction, ActionCheck, PreventAlert } from '../../prevent/models.js';
import { fail, actorId } from '../../closure/util.js';

/**
 * N50 Overlap timeline view (ADDITIONS.md).
 *
 * Two bureaus' actions on one institution side by side, conflict points marked.
 * Read-only view of existing PREVENT and SYNC data: conflict points are only
 * the PREVENT Stage 2 checks that already returned REVIEW; nothing is
 * recomputed here. Other bureaus' entries are opaque metadata (SPEC 6.4) and
 * cases outside the viewer's scope show as restricted.
 */
export const TIMELINE_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor'];

export async function overlapTimeline(user, pid, { bureaus } = {}) {
  if (!TIMELINE_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  if (!/^1-\d{10}$/.test(pid || '')) throw fail(400, 'PID_INVALID');
  const cases = await Case.find({ institutionPid: pid }).lean();
  const access = new Map();
  for (const c of cases) access.set(String(c._id), { masterCaseId: c.masterCaseId, allowed: await canAccessCase(user, c) });

  const actions = await CaseAction.find({ institutionPid: pid }).sort({ at: 1 }).lean();
  const counts = {};
  for (const a of actions) counts[a.bureau] = (counts[a.bureau] || 0) + 1;
  let lanes = (typeof bureaus === 'string' && bureaus ? bureaus.split(',').map((b) => b.trim()).filter(Boolean) : Object.keys(counts).sort((x, y) => counts[y] - counts[x] || x.localeCompare(y))).slice(0, 2);

  const ref = (caseId) => {
    const a = access.get(String(caseId));
    return a?.allowed ? { masterCaseId: a.masterCaseId } : { restricted: true };
  };
  const opaque = (bureau) => user.role === 'bureau_officer' && bureau !== user.bureau;
  const laneEvents = lanes.map((bureau) => ({
    bureau,
    events: actions.filter((a) => a.bureau === bureau).map((a) => ({
      at: a.at,
      actionType: a.actionType,
      ...(opaque(bureau) ? { opaque: true } : ref(a.caseId)),
    })),
  }));

  const checks = await ActionCheck.find({ caseId: { $in: cases.map((c) => c._id) }, result: 'REVIEW' }).sort({ createdAt: 1 }).lean();
  const actors = await User.find({ _id: { $in: checks.map((c) => c.actorId).filter((id) => /^[0-9a-f]{24}$/i.test(id)) } }).select('bureau').lean();
  const bureauOf = new Map(actors.map((u) => [String(u._id), u.bureau]));
  const alerts = await PreventAlert.find({ checkId: { $in: checks.map((c) => c._id) } }).lean();
  const conflicts = checks.map((c) => ({
    at: c.createdAt,
    source: 'PREVENT Stage 2',
    result: c.result,
    actionType: c.actionType,
    bureau: bureauOf.get(c.actorId) || null,
    reasons: [...new Set(alerts.filter((a) => String(a.checkId) === String(c._id)).flatMap((a) => a.reasons))],
    proceeded: !!c.proceededAt,
    ...ref(c.caseId),
  }));

  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'overlap_timeline.viewed', targetType: 'Institution', targetId: pid,
    meta: { lanes, conflictCount: conflicts.length },
  });
  return { institutionPid: pid, readOnly: true, synthetic: true, lanes: laneEvents, conflicts };
}
