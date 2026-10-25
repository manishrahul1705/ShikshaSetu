import Institution from '../../institutions/Institution.js';
import { additionalTileCases } from '../n105-dashboard-tiles/service.js';
import { recordAudit } from '../../audit/audit.js';
import { listOverlaps } from '../../prevent/overlaps.js';
import { allTransfers } from '../../closure/s3Adapter.js';
import { fail, actorId, CLOSED_STATUSES } from '../../closure/util.js';
import { IMPACT_ROLES, SYNTHETIC_LABEL, scopedCases, scopeLabel } from '../../impact/impactService.js';

/**
 * N47 Click any number to see its cases (ADDITIONS.md).
 *
 * Every IMPACT count opens the exact list behind it, filtered by the viewer's
 * own access: the case set comes from IMPACT's own scopedCases(), and each
 * row uses the same selection rule as the count it opens (S5 report logic is
 * not changed). The projection is a short allow-list, so it shows nothing the
 * count's viewer could not already see (no narrative, no reporter identity).
 */
const isOpen = (c) => !CLOSED_STATUSES.includes(c.status);

export function caseRow(c) {
  return {
    masterCaseId: c.masterCaseId,
    category: c.category,
    subCategory: c.subCategory,
    status: c.status === 'SUBMITTED' ? 'Registered' : c.status,
    owningBureau: c.owningBureau || null,
    institutionPid: c.institutionPid,
    createdAt: c.createdAt,
  };
}

async function regionResolver(cases) {
  const institutions = await Institution.find({ pid: { $in: [...new Set(cases.map((c) => c.institutionPid))] } }).select('pid region').lean();
  const byPid = new Map(institutions.map((i) => [i.pid, i.region]));
  return (c) => c.pidSnapshot?.region || byPid.get(c.institutionPid) || 'UNKNOWN';
}

export async function drillDown(user, rowId, now = new Date()) {
  if (!IMPACT_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  if (typeof rowId !== 'string' || !rowId.includes(':')) throw fail(400, 'ROW_INVALID');
  const [kind, ...rest] = rowId.split(':');
  const key = rest.join(':');
  const cases = await scopedCases(user);
  const base = { rowId, label: SYNTHETIC_LABEL, synthetic: true, scope: scopeLabel(user) };
  let selected = null;
  let extra = {};

  if (kind === 'tile') {
    if (['underProcessCases', 'transferredCases', 'escalatedCases'].includes(key)) {
      const transfers = await allTransfers({ caseId: { $in: cases.map(c => c._id) } });
      if (key === 'transferredCases' && transfers === null) return { ...base, result: 'UNKNOWN', reason: 'TRACE_NOT_AVAILABLE' };
      selected = additionalTileCases(cases, transfers)[key];
    }
    if (key === 'totalComplaints') selected = cases;
    else if (key === 'pendingCases') selected = cases.filter((c) => (c.analyticStatus || 'PENDING') === 'PENDING');
    else if (key === 'disposedCases') selected = cases.filter((c) => c.analyticStatus === 'DISPOSED' || CLOSED_STATUSES.includes(c.status));
    else if (key === 'overdueCases') {
      selected = cases.filter(isOpen).filter((c) => Array.isArray(c.slaClock) && c.slaClock.length && new Date(c.slaClock[c.slaClock.length - 1].targetResolutionDate) < now);
    } else if (key === 'transferDelays') {
      const transfers = await allTransfers({ caseId: { $in: cases.map((c) => c._id) } });
      if (transfers === null) return { ...base, result: 'UNKNOWN', reason: 'TRACE_NOT_AVAILABLE' };
      const byId = new Map(cases.map((c) => [String(c._id), c]));
      const delayed = transfers.filter((x) => x.isEscalated || (x.acknowledgedAt ? new Date(x.acknowledgedAt) > new Date(x.dueAt) : x.status === 'REQUESTED' && now > new Date(x.dueAt)));
      extra = {
        unit: 'transfers',
        transfers: delayed.map((x) => ({ masterCaseId: x.masterCaseId, fromBureau: x.fromBureau, toBureau: x.toBureau, status: x.status, dueAt: x.dueAt, isEscalated: !!x.isEscalated })),
      };
      selected = [...new Set(delayed.map((x) => String(x.caseId)))].map((id) => byId.get(id)).filter(Boolean);
    } else if (key === 'potentialOverlaps') {
      const overlaps = await listOverlaps(user);
      if (overlaps.result === 'UNKNOWN') return { ...base, result: 'UNKNOWN', reason: (overlaps.reasons || ['PREVENT_RULES_NOT_CONFIGURED'])[0] };
      const ids = new Set(overlaps.pairs.flatMap((p) => p.cases));
      extra = { unit: 'pairs', pairs: overlaps.pairs.map((p) => ({ cases: p.cases, score: p.score })), restrictedEntries: overlaps.restrictedCount };
      selected = cases.filter((c) => ids.has(c.masterCaseId));
    }
  } else if (kind === 'bureau') {
    selected = cases.filter((c) => (c.owningBureau || 'Unrouted') === key);
  } else if (kind === 'region') {
    const regionOf = await regionResolver(cases);
    selected = cases.filter((c) => regionOf(c) === key);
  } else if (kind === 'institution') {
    selected = cases.filter((c) => c.institutionPid === key);
  } else if (kind === 'status') {
    selected = cases.filter(c => c.status === key);
  } else if (kind === 'month') {
    selected = cases.filter((c) => new Date(c.createdAt).toISOString().slice(0, 7) === key);
  }
  if (selected === null) throw fail(400, 'ROW_NOT_DRILLABLE');

  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'impact.drilldown.viewed', targetType: 'ImpactRow', targetId: rowId.slice(0, 100),
    meta: { count: selected.length },
  });
  return { ...base, count: selected.length, cases: selected.map(caseRow), ...extra };
}

