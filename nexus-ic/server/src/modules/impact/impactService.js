import Case from '../cases/Case.js';
import Institution from '../institutions/Institution.js';
import InstitutionIdentifier from '../institutions/InstitutionIdentifier.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { ActionCheck } from '../prevent/models.js';
import { listOverlaps } from '../prevent/overlaps.js';
import { ClosureRecord } from '../closure/models.js';
import { allTransfers } from '../closure/s3Adapter.js';
import { fail, CLOSED_STATUSES } from '../closure/util.js';
import { SYNTHETIC_FOOTER_LINE } from '../additions/n66-integrity-banner/exportFooter.js';
import { watermarkExport } from '../additions/n55-watermark/service.js';

/**
 * NEXUS IMPACT (SPEC 10.4, N26) and the nine management tiles (N77).
 *
 * Safeguards (E09 via SPEC 10.4): labelled synthetic; every percentage carries
 * numerator, denominator and scope; "action flagged" is never counted as
 * "action avoided"; every policy recommendation cites the report rows it rests
 * on; a missing source is UNKNOWN with a reason, never zero (Rule 5).
 */
export const IMPACT_ROLES = ['supervisor', 'competent_authority', 'auditor', 'system_admin', 'bureau_officer', 'regional_officer'];
export const SYNTHETIC_LABEL = 'SYNTHETIC DATA: results are synthetic until a pilot exists';
const GLOBAL = ['supervisor', 'competent_authority', 'auditor', 'system_admin'];
const DAY = 24 * 60 * 60 * 1000;

export function pct(numerator, denominator, scope) {
  if (!denominator) return { value: null, numerator, denominator, scope, result: 'UNKNOWN', reason: 'NO_DENOMINATOR' };
  return { value: Math.round((numerator / denominator) * 1000) / 10, numerator, denominator, scope };
}

export function scopeLabel(user) {
  if (GLOBAL.includes(user.role)) return 'All cases visible to this role';
  if (user.role === 'bureau_officer') return `Cases routed to ${user.bureau || 'no bureau'}`;
  return `Cases in ${user.region || 'no'} region`;
}

export async function scopedCases(user) {
  // Scale (S7): counts never need the complaint text or long histories, so they are not loaded.
  const all = await Case.find({}).select('-narrative -narrativeHash -transferHistory -routingHistory -documentIds -externalRefs').lean();
  if (GLOBAL.includes(user.role)) return all;
  const allowed = await Promise.all(all.map((c) => canAccessCase(user, c)));
  return all.filter((_, i) => allowed[i]);
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const round1 = (n) => Math.round(n * 10) / 10;
const isOpen = (c) => !CLOSED_STATUSES.includes(c.status);

// Scale (S7): the report is reused while nothing it counts has changed. The fingerprint covers
// case count and last update, PREVENT checks, transfers and closures, so any new data recomputes.
const reportCache = new Map();
async function dataFingerprint() {
  const { Transfer } = await import('../trace/models.js').catch(() => ({}));
  const [cases, lastCase, checks, closures, transfers, lastTransfer] = await Promise.all([
    Case.estimatedDocumentCount(), Case.findOne({}).sort({ updatedAt: -1 }).select('updatedAt').lean(),
    ActionCheck.estimatedDocumentCount(), ClosureRecord.countDocuments({ state: 'CLOSED' }),
    Transfer ? Transfer.estimatedDocumentCount() : -1, Transfer ? Transfer.findOne({}).sort({ updatedAt: -1 }).select('updatedAt').lean() : null,
  ]);
  return [cases, lastCase?.updatedAt?.getTime(), checks, closures, transfers, lastTransfer?.updatedAt?.getTime()].join('|');
}

export async function buildImpactReport(user, now = new Date()) {
  if (!IMPACT_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const key = `${user.role}|${user.bureau || ''}|${user.region || ''}|${now.toISOString().slice(0, 13)}`;
  const fingerprint = await dataFingerprint();
  const hit = reportCache.get(key);
  if (hit && hit.fingerprint === fingerprint && Date.now() - hit.at < 300000) return hit.report;
  const report = await computeImpactReport(user, now);
  if (reportCache.size > 200) reportCache.clear();
  reportCache.set(key, { fingerprint, at: Date.now(), report });
  return report;
}

async function computeImpactReport(user, now) {
  const scope = scopeLabel(user);
  const cases = await scopedCases(user);
  const ids = cases.map((c) => c._id);
  const idSet = new Set(ids.map(String));
  const total = cases.length;

  // Regions: snapshot first, then the institution master.
  const pids = [...new Set(cases.map((c) => c.institutionPid))];
  const institutions = await Institution.find({ pid: { $in: pids } }).select('pid region name').lean();
  const instByPid = new Map(institutions.map((i) => [i.pid, i]));
  const regionOf = (c) => c.pidSnapshot?.region || instByPid.get(c.institutionPid)?.region || 'UNKNOWN';

  // Tiles 1-3
  const pending = cases.filter((c) => (c.analyticStatus || 'PENDING') === 'PENDING').length;
  const disposed = cases.filter((c) => c.analyticStatus === 'DISPOSED' || CLOSED_STATUSES.includes(c.status)).length;

  // Tile 4: overdue = open case whose current SLA segment target has passed.
  const open = cases.filter(isOpen);
  const withClock = open.filter((c) => Array.isArray(c.slaClock) && c.slaClock.length);
  const overdueCases = withClock.filter((c) => new Date(c.slaClock[c.slaClock.length - 1].targetResolutionDate) < now);
  const overdueIds = new Set(overdueCases.map((c) => String(c._id)));

  // Tile 5: transfer delays (S3 transfers).
  const transfers = await allTransfers({ caseId: { $in: ids } });
  let transferDelays;
  let delayed = [];
  if (transfers === null) {
    transferDelays = { result: 'UNKNOWN', reason: 'TRACE_NOT_AVAILABLE' };
  } else {
    delayed = transfers.filter((x) => x.isEscalated || (x.acknowledgedAt ? new Date(x.acknowledgedAt) > new Date(x.dueAt) : x.status === 'REQUESTED' && now > new Date(x.dueAt)));
    transferDelays = { count: delayed.length, share: pct(delayed.length, transfers.length, `${scope}: all transfers`) };
  }

  // Tile 6: potential overlaps (PREVENT). Flagged is never counted as avoided.
  const overlaps = await listOverlaps(user);
  const potentialOverlaps = overlaps.result === 'UNKNOWN'
    ? { result: 'UNKNOWN', reason: (overlaps.reasons || ['PREVENT_RULES_NOT_CONFIGURED'])[0] }
    : { pairs: overlaps.pairs.length, restrictedEntries: overlaps.restrictedCount, ruleVersion: overlaps.ruleVersion };
  const checks = await ActionCheck.find({ caseId: { $in: ids } }).lean();
  const flagged = checks.filter((c) => c.result === 'REVIEW');
  const duplicateActions = {
    flagged: flagged.length,
    flaggedShare: pct(flagged.length, checks.length, `${scope}: PREVENT Stage 2 pre-action checks`),
    proceededAfterFlag: flagged.filter((c) => c.proceededAt).length,
    avoided: { result: 'UNKNOWN', reason: 'NO_AVOIDANCE_RECORD', note: 'A flagged action is never counted as an avoided action' },
  };

  // Tile 7: bureau-wise workload.
  const bureauRows = new Map();
  const bureauRow = (b) => {
    const key = b || 'Unrouted';
    if (!bureauRows.has(key)) bureauRows.set(key, { rowId: `bureau:${key}`, bureau: key, total: 0, open: 0, disposed: 0, overdue: 0, transfersIn: 0, transfersDelayed: 0 });
    return bureauRows.get(key);
  };
  for (const c of cases) {
    const row = bureauRow(c.owningBureau);
    row.total++;
    if (isOpen(c)) row.open++; else row.disposed++;
    if (overdueIds.has(String(c._id))) row.overdue++;
  }
  for (const x of transfers || []) {
    const row = bureauRow(x.toBureau);
    row.transfersIn++;
    if (delayed.includes(x)) row.transfersDelayed++;
  }

  // Region-wise insights.
  const regionRows = new Map();
  for (const c of cases) {
    const r = regionOf(c);
    if (!regionRows.has(r)) regionRows.set(r, { rowId: `region:${r}`, region: r, total: 0, open: 0, disposed: 0, overdue: 0 });
    const row = regionRows.get(r);
    row.total++;
    if (isOpen(c)) row.open++; else row.disposed++;
    if (overdueIds.has(String(c._id))) row.overdue++;
  }

  // Tile 8: institution-wise history, with the ICID column (SPEC 3 touchpoint 10). Only an
  // active PID-ICID mapping is shown; otherwise "not available", never a failed verification.
  const identifiers = await InstitutionIdentifier.find({ pid: { $in: pids }, status: 'active' }).select('pid icid').lean();
  const icidByPid = new Map(identifiers.filter((i) => i.icid).map((i) => [i.pid, i.icid]));
  const instRows = new Map();
  for (const c of cases) {
    if (!instRows.has(c.institutionPid)) instRows.set(c.institutionPid, { rowId: `institution:${c.institutionPid}`, pid: c.institutionPid, name: instByPid.get(c.institutionPid)?.name || 'not available', icid: icidByPid.get(c.institutionPid) || 'not available', total: 0, open: 0, disposed: 0 });
    const row = instRows.get(c.institutionPid);
    row.total++;
    if (isOpen(c)) row.open++; else row.disposed++;
  }

  // Resolution time (registration to PROOF closure).
  const closures = (await ClosureRecord.find({ caseId: { $in: ids }, state: 'CLOSED' }).lean()).filter((r) => idSet.has(String(r.caseId)));
  const createdById = new Map(cases.map((c) => [String(c._id), new Date(c.createdAt)]));
  const days = closures.map((r) => (new Date(r.closedAt) - createdById.get(String(r.caseId))) / DAY).filter((d) => d >= 0);
  const resolutionTime = days.length
    ? { closedCases: days.length, medianDays: round1(median(days)), meanDays: round1(days.reduce((a, b) => a + b, 0) / days.length), scope: `${scope}: closed through NEXUS PROOF` }
    : { result: 'UNKNOWN', reason: 'NO_CLOSED_CASES', scope };

  // Tile 9: trends (registered and disposed per month).
  const months = new Map();
  const monthRow = (d) => {
    const m = new Date(d).toISOString().slice(0, 7);
    if (!months.has(m)) months.set(m, { rowId: `month:${m}`, month: m, registered: 0, disposed: 0 });
    return months.get(m);
  };
  for (const c of cases) monthRow(c.createdAt).registered++;
  for (const r of closures) monthRow(r.closedAt).disposed++;

  const bureauWise = [...bureauRows.values()].sort((a, b) => a.bureau.localeCompare(b.bureau));
  const regionWise = [...regionRows.values()].sort((a, b) => a.region.localeCompare(b.region));
  const institutionWise = [...instRows.values()].sort((a, b) => a.pid.localeCompare(b.pid));
  const trends = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));

  // Policy-level recommendations: each cites the rows it rests on.
  const recommendations = [];
  const top = (rows, key) => rows.filter((r) => r[key] > 0).sort((a, b) => b[key] - a[key])[0];
  const delayTop = top(bureauWise, 'transfersDelayed');
  if (delayTop) {
    recommendations.push({
      id: 'REC-1',
      text: `Review how incoming transfers are acknowledged in ${delayTop.bureau}: ${delayTop.transfersDelayed} of ${delayTop.transfersIn} incoming transfers were delayed`,
      citedRows: [delayTop.rowId, 'tile:transferDelays'],
    });
  }
  const overdueTop = top(bureauWise, 'overdue');
  if (overdueTop) {
    recommendations.push({
      id: 'REC-2',
      text: `Review workload in ${overdueTop.bureau}: ${overdueTop.overdue} of ${overdueTop.open} open cases are past their SLA target`,
      citedRows: [overdueTop.rowId, 'tile:overdueCases'],
    });
  }
  const regionTop = top(regionWise, 'overdue');
  if (regionTop) {
    recommendations.push({
      id: 'REC-3',
      text: `Regional follow-up in ${regionTop.region}: ${regionTop.overdue} of ${regionTop.open} open cases are past their SLA target`,
      citedRows: [regionTop.rowId],
    });
  }
  if (potentialOverlaps.pairs > 0) {
    recommendations.push({
      id: 'REC-4',
      text: `Coordinate ${potentialOverlaps.pairs} potentially overlapping case pairs through NEXUS SYNC before further action`,
      citedRows: ['tile:potentialOverlaps'],
    });
  }

  const tiles = {
    totalComplaints: { rowId: 'tile:totalComplaints', count: total, scope },
    pendingCases: { rowId: 'tile:pendingCases', count: pending, share: pct(pending, total, scope) },
    disposedCases: { rowId: 'tile:disposedCases', count: disposed, share: pct(disposed, total, scope) },
    overdueCases: {
      rowId: 'tile:overdueCases', count: overdueCases.length, share: pct(overdueCases.length, withClock.length, `${scope}: open cases with an SLA clock`),
      openWithoutClock: open.length - withClock.length,
    },
    transferDelays: { rowId: 'tile:transferDelays', ...transferDelays },
    potentialOverlaps: { rowId: 'tile:potentialOverlaps', ...potentialOverlaps },
    bureauWiseWorkload: { rowId: 'tile:bureauWiseWorkload', rows: bureauWise },
    institutionWiseHistory: { rowId: 'tile:institutionWiseHistory', rows: institutionWise },
    trendsAndInsights: { rowId: 'tile:trendsAndInsights', rows: trends },
  };

  return {
    label: SYNTHETIC_LABEL,
    synthetic: true,
    generatedAt: now,
    scope,
    tiles,
    resolutionTime,
    transfersAcceptedWithinTime: transfers === null ? { result: 'UNKNOWN', reason: 'TRACE_NOT_AVAILABLE' } : (() => {
      const accepted = transfers.filter(t => t.status === 'ACCEPTED');
      const dated = accepted.filter(t => t.dueAt && t.acknowledgedAt && Number.isFinite(new Date(t.dueAt).getTime()) && Number.isFinite(new Date(t.acknowledgedAt).getTime()));
      if (dated.length !== accepted.length) return { result: 'UNKNOWN', reason: 'MISSING_TRANSFER_TIMESTAMPS' };
      const count = dated.filter(t => new Date(t.acknowledgedAt) <= new Date(t.dueAt)).length;
      return { count, share: pct(count, dated.length, `${scope}: accepted transfers with recorded acknowledgement and due times`) };
    })(),
    duplicateActions,
    regionWise,
    recommendations,
  };
}

const q = (v) => {
  const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const line = (cells) => cells.map(q).join(',');
const pctCells = (p) => [p.value ?? 'UNKNOWN', p.numerator, p.denominator, p.scope];

/** Downloadable CSV (U30): synthetic label, denominators, cited rows, N55 watermark. */
export async function buildImpactCsv(user, now = new Date()) {
  const r = await buildImpactReport(user, now);
  const out = [line(['scope', r.scope]), line(['generatedAt', r.generatedAt.toISOString()]), ''];
  out.push(line(['rowId', 'metric', 'count', 'percent', 'numerator', 'denominator', 'scope']));
  const t = r.tiles;
  out.push(line([t.totalComplaints.rowId, 'Total Complaints', t.totalComplaints.count, '', '', '', t.totalComplaints.scope]));
  out.push(line([t.pendingCases.rowId, 'Pending Cases', t.pendingCases.count, ...pctCells(t.pendingCases.share)]));
  out.push(line([t.disposedCases.rowId, 'Disposed Cases', t.disposedCases.count, ...pctCells(t.disposedCases.share)]));
  out.push(line([t.overdueCases.rowId, 'Overdue Cases', t.overdueCases.count, ...pctCells(t.overdueCases.share)]));
  out.push(t.transferDelays.result === 'UNKNOWN'
    ? line([t.transferDelays.rowId, 'Transfer Delays', 'UNKNOWN', t.transferDelays.reason, '', '', r.scope])
    : line([t.transferDelays.rowId, 'Transfer Delays', t.transferDelays.count, ...pctCells(t.transferDelays.share)]));
  out.push(t.potentialOverlaps.result === 'UNKNOWN'
    ? line([t.potentialOverlaps.rowId, 'Potential Overlaps', 'UNKNOWN', t.potentialOverlaps.reason, '', '', r.scope])
    : line([t.potentialOverlaps.rowId, 'Potential Overlaps', t.potentialOverlaps.pairs, '', '', '', `${r.scope}; restricted entries ${t.potentialOverlaps.restrictedEntries}`]));
  out.push(line(['metric:duplicateActionsFlagged', 'Duplicate actions flagged', r.duplicateActions.flagged, ...pctCells(r.duplicateActions.flaggedShare)]));
  out.push(line(['metric:duplicateActionsAvoided', 'Duplicate actions avoided', 'UNKNOWN', r.duplicateActions.avoided.reason, '', '', r.scope]));
  out.push(r.resolutionTime.result === 'UNKNOWN'
    ? line(['metric:resolutionTime', 'Resolution time (days)', 'UNKNOWN', r.resolutionTime.reason, '', '', r.scope])
    : line(['metric:resolutionTime', 'Resolution time median days', r.resolutionTime.medianDays, '', r.resolutionTime.closedCases, '', r.resolutionTime.scope]));
  out.push('', line(['rowId', 'bureau', 'total', 'open', 'disposed', 'overdue', 'transfersIn', 'transfersDelayed']));
  for (const b of t.bureauWiseWorkload.rows) out.push(line([b.rowId, b.bureau, b.total, b.open, b.disposed, b.overdue, b.transfersIn, b.transfersDelayed]));
  out.push('', line(['rowId', 'region', 'total', 'open', 'disposed', 'overdue']));
  for (const x of r.regionWise) out.push(line([x.rowId, x.region, x.total, x.open, x.disposed, x.overdue]));
  out.push('', line(['rowId', 'institutionPid', 'icid', 'name', 'total', 'open', 'disposed']));
  for (const x of t.institutionWiseHistory.rows) out.push(line([x.rowId, x.pid, x.icid, x.name, x.total, x.open, x.disposed]));
  out.push('', line(['rowId', 'month', 'registered', 'disposed']));
  for (const x of t.trendsAndInsights.rows) out.push(line([x.rowId, x.month, x.registered, x.disposed]));
  out.push('', line(['recommendation', 'text', 'citedRows']));
  for (const x of r.recommendations) out.push(line([x.id, x.text, x.citedRows.join(';')]));
  const rowCount = out.length;
  const mark = await watermarkExport(user, { kind: 'IMPACT_REPORT_CSV', rowCount, scope: r.scope });
  out.push('', line([mark.footer]) + mark.invisible);
  return { csv: out.join('\n') + '\n', code: mark.code, report: r };
}
