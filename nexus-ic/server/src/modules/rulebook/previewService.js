import Case from '../cases/Case.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';

/**
 * N65 RuleBook what-if preview engine.
 *
 * Evaluates pending rule version against open cases without modifying any case.
 * Returns which open cases would change route or SLA timeline under the pending version.
 */
export async function generateWhatIfPreview(versionDoc) {
  const openCases = await Case.find({
    status: { $nin: CLOSED_STATUSES },
  }).lean();

  const affectedCases = [];

  for (const c of openCases) {
    let affected = false;
    let changeReason = '';
    let projectedRoute = c.owningBureau;
    let projectedSlaDays = null;

    if (['JURISDICTION', 'ROUTING'].includes(versionDoc.family)) {
      const mapping = versionDoc.body?.bureauMapping || {};
      const newPrimary = mapping[c.category]?.primary || versionDoc.body?.defaultPrimary || 'PGRC';
      if (c.owningBureau && newPrimary !== c.owningBureau) {
        affected = true;
        projectedRoute = newPrimary;
        changeReason = `Route would change from ${c.owningBureau} to ${newPrimary}`;
      }
    } else if (versionDoc.family === 'SLA') {
      const standardTimelines = versionDoc.body?.timelines || {};
      const categoryTimeline = standardTimelines[c.category] || standardTimelines.default;
      if (categoryTimeline) {
        projectedSlaDays = categoryTimeline.resolutionDays;
        affected = true;
        changeReason = `SLA resolution window projected as ${projectedSlaDays} days`;
      }
    }

    if (affected) {
      affectedCases.push({
        caseId: c._id,
        masterCaseId: c.masterCaseId,
        category: c.category,
        currentBureau: c.owningBureau,
        currentOutcome: c.owningBureau,
        projectedBureau: projectedRoute,
        simulatedOutcome: projectedRoute,
        projectedSlaDays,
        changeReason,
      });
    }
  }

  return {
    simulation: true,
    family: versionDoc.family,
    version: versionDoc.version,
    totalOpenCases: openCases.length,
    totalOpenCasesEvaluated: openCases.length,
    affectedCasesCount: affectedCases.length,
    affectedCount: affectedCases.length,
    affectedCases,
  };
}
