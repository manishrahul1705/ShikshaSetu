import { getInstitution360 } from '../institutions/institutionService.js';
import { allTransfers } from '../closure/s3Adapter.js';
import { recordAudit } from '../audit/audit.js';
import Case from '../cases/Case.js';
import { fail, actorId } from '../closure/util.js';

/**
 * Graph and radar views (SPEC 18 S6 evidence "Graph, radar, impact").
 *
 * Both are views of data Institution 360 already returns (SPEC 6.4), with its
 * visibility rules: the graph links the institution, the cases the viewer may
 * see, the bureaus that own them and the NEXUS TRACE transfers between
 * bureaus; restricted entries appear only as a count. The radar plots the
 * Institution 360 attention indicators (E07) as counts per reason type; it is
 * not a score, and an UNKNOWN indicator stays UNKNOWN (Rule 5).
 */
export const GRAPH_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor', 'system_admin'];

async function load(user, pid) {
  if (!GRAPH_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const view = await getInstitution360(pid, user);
  if (!view.found) throw fail(404, 'INSTITUTION_NOT_FOUND');
  return view;
}

export async function institutionGraph(user, pid) {
  const view = await load(user, pid);
  const visible = view.grievances.visible;
  const nodes = [{ id: `institution:${pid}`, type: 'institution', label: view.institution.name }];
  const edges = [];
  const bureaus = new Set();
  for (const c of visible) {
    nodes.push({ id: `case:${c.masterCaseId}`, type: 'case', label: c.masterCaseId, status: c.status, opaque: !!c.opaqueCounterpart });
    edges.push({ from: `case:${c.masterCaseId}`, to: `institution:${pid}`, kind: 'about' });
    if (c.owningBureau) {
      bureaus.add(c.owningBureau);
      edges.push({ from: `case:${c.masterCaseId}`, to: `bureau:${c.owningBureau}`, kind: 'owned_by' });
    }
  }
  const ids = (await Case.find({ masterCaseId: { $in: visible.map((c) => c.masterCaseId) } }).select('_id').lean()).map((c) => c._id);
  const transfers = await allTransfers({ caseId: { $in: ids } });
  if (transfers) {
    for (const t of transfers) {
      bureaus.add(t.fromBureau);
      bureaus.add(t.toBureau);
      edges.push({ from: `bureau:${t.fromBureau}`, to: `bureau:${t.toBureau}`, kind: 'transfer', status: t.status, masterCaseId: t.masterCaseId });
    }
  }
  for (const b of bureaus) nodes.push({ id: `bureau:${b}`, type: 'bureau', label: b });
  await recordAudit({ actorId: actorId(user), actorRole: user.role, action: 'graph.viewed', targetType: 'Institution', targetId: pid, meta: { nodes: nodes.length } });
  return {
    institutionPid: pid,
    synthetic: true,
    nodes,
    edges,
    restrictedEntries: view.grievances.restrictedCount,
    transfers: transfers ? 'AVAILABLE' : { result: 'UNKNOWN', reason: 'TRACE_NOT_AVAILABLE' },
  };
}

export async function attentionRadar(user, pid) {
  const view = await load(user, pid);
  const axes = view.attentionIndicators.map((i) => {
    if (i.status === 'UNKNOWN') return { type: i.type, label: i.label, value: null, result: 'UNKNOWN', reason: i.reason };
    const n = String(i.reason || '').match(/\d+/);
    return { type: i.type, label: i.label, value: n ? Number(n[0]) : null, reason: i.reason, ...(n ? {} : { result: 'UNKNOWN' }) };
  });
  return {
    institutionPid: pid,
    synthetic: true,
    note: 'Counts per attention-indicator reason, taken from Institution 360. Not a score, not a finding about the institution.',
    axes,
  };
}
