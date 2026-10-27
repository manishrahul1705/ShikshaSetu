import Institution from '../../institutions/Institution.js';
import { recordAudit } from '../../audit/audit.js';
import { fail, actorId } from '../../closure/util.js';
import { IMPACT_ROLES, SYNTHETIC_LABEL, pct, scopedCases, scopeLabel } from '../../impact/impactService.js';
import { PATTERN_DEFAULTS } from './defaults.js';

/**
 * N61 Cross-institution pattern alert (ADDITIONS.md).
 *
 * Flags the same issue concept (category + sub-category) rising across many
 * institutions in one region and suggests a policy review, citing the cases.
 * Feeds IMPACT under the E09 safeguards: cites rows, shows the denominator,
 * labelled synthetic. Uses IMPACT's own case scope, so a viewer sees patterns
 * only over cases they could already count. Advisory: nothing is changed.
 */
const DAY = 24 * 60 * 60 * 1000;

export async function patternAlerts(user, now = new Date(), params = PATTERN_DEFAULTS) {
  if (!IMPACT_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const scope = scopeLabel(user);
  const cases = await scopedCases(user);
  const institutions = await Institution.find({ pid: { $in: [...new Set(cases.map((c) => c.institutionPid))] } }).select('pid region').lean();
  const regionByPid = new Map(institutions.map((i) => [i.pid, i.region]));
  const regionOf = (c) => c.pidSnapshot?.region || regionByPid.get(c.institutionPid) || 'UNKNOWN';

  const windowMs = params.windowDays * DAY;
  const currentStart = now.getTime() - windowMs;
  const previousStart = currentStart - windowMs;
  const inCurrent = (c) => new Date(c.createdAt).getTime() >= currentStart && new Date(c.createdAt).getTime() <= now.getTime();
  const inPrevious = (c) => new Date(c.createdAt).getTime() >= previousStart && new Date(c.createdAt).getTime() < currentStart;

  const regionInstitutions = new Map();
  const groups = new Map();
  for (const c of cases) {
    const region = regionOf(c);
    if (inCurrent(c)) {
      if (!regionInstitutions.has(region)) regionInstitutions.set(region, new Set());
      regionInstitutions.get(region).add(c.institutionPid);
    }
    const key = `${region}|${c.category}|${c.subCategory}`;
    if (!groups.has(key)) groups.set(key, { region, category: c.category, subCategory: c.subCategory, now: new Set(), before: new Set(), cited: [] });
    const g = groups.get(key);
    if (inCurrent(c)) {
      g.now.add(c.institutionPid);
      g.cited.push(c.masterCaseId);
    } else if (inPrevious(c)) {
      g.before.add(c.institutionPid);
    }
  }

  const alerts = [];
  for (const g of groups.values()) {
    if (g.region === 'UNKNOWN' || g.now.size < params.minInstitutions || g.now.size <= g.before.size) continue;
    const denominator = regionInstitutions.get(g.region)?.size || 0;
    alerts.push({
      id: `PAT-${alerts.length + 1}`,
      region: g.region,
      issueConcept: `${g.category} / ${g.subCategory}`,
      institutionsNow: g.now.size,
      institutionsBefore: g.before.size,
      share: pct(g.now.size, denominator, `${scope}: institutions in ${g.region} region with a case in the last ${params.windowDays} days`),
      suggestion: `Suggest a policy review of "${g.category} / ${g.subCategory}" in the ${g.region} region: ${g.now.size} institutions in the last ${params.windowDays} days, up from ${g.before.size}`,
      citedRows: [...g.cited].sort(),
      ruleVersion: params.version,
    });
  }

  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'patterns.viewed', targetType: 'ImpactPatterns', targetId: params.version,
    meta: { alerts: alerts.length },
  });
  return {
    label: SYNTHETIC_LABEL,
    synthetic: true,
    advisoryOnly: true,
    scope,
    ruleVersion: params.version,
    ruleNote: 'Window and minimum are DEMO values, not from source; replace with AICTE policy',
    windowDays: params.windowDays,
    minInstitutions: params.minInstitutions,
    alerts,
  };
}
