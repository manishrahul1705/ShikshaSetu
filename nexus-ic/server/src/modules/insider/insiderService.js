import InsiderAlert from './models.js';
import AuditEvent from '../audit/AuditEvent.js';
import User from '../auth/User.js';
import { getActiveRule } from '../rulebook/index.js';
import { recordAudit } from '../audit/audit.js';

/**
 * Scan officer activity against DEMO-INSIDER-v1 rule (ADDITIONS.md N54)
 *
 * Invariant: Warning only; never blocks an officer.
 */
export async function checkInsiderActivity(officerId, now = new Date()) {
  const user = await User.findById(officerId);
  if (!user) return [];

  const rule = await getActiveRule('INSIDER');
  // SPEC 11 / Rule 2: thresholds come only from an approved INSIDER rule; without one, no alerts (POLICY_NOT_CONFIGURED).
  if (!rule || rule.result === 'POLICY_NOT_CONFIGURED' || !rule.body) return [];
  const body = rule.body;
  const ruleVersion = rule.version;
  const alerts = [];
  const actorStr = String(user._id);

  // 1. Repeated Identity Reveal Requests (reads S1a identity.reveal.* events)
  const revealSince = new Date(now.getTime() - (body.repeatedRevealWindowHours || 24) * 3600 * 1000);
  const revealCount = await AuditEvent.countDocuments({
    actorId: actorStr,
    action: { $regex: /^identity\.reveal/ },
    at: { $gte: revealSince, $lte: now },
  });

  if (revealCount >= (body.repeatedRevealThreshold || 3)) {
    const existing = await InsiderAlert.findOne({
      officerId: user._id,
      alertType: 'REPEATED_REVEAL_REQUESTS',
      alertedAt: { $gte: revealSince },
    });
    if (!existing) {
      const alert = await InsiderAlert.create({
        officerId: user._id,
        officerName: user.displayName || user.username,
        alertType: 'REPEATED_REVEAL_REQUESTS',
        ruleVersion,
        count: revealCount,
        threshold: body.repeatedRevealThreshold || 3,
        details: `${revealCount} identity reveal requests within past 24 hours (threshold: ${body.repeatedRevealThreshold || 3})`,
        alertedAt: now,
      });
      alerts.push(alert);
    }
  }

  // 2. Bulk Case Opening
  const bulkSince = new Date(now.getTime() - (body.bulkCaseWindowMinutes || 60) * 60 * 1000);
  const caseAccessCount = await AuditEvent.countDocuments({
    actorId: actorStr,
    action: { $in: ['case.accessed', 'case.read', 'case.status.viewed', 'case.journey.viewed'] },
    at: { $gte: bulkSince, $lte: now },
  });

  if (caseAccessCount >= (body.bulkCaseOpeningThreshold || 10)) {
    const existing = await InsiderAlert.findOne({
      officerId: user._id,
      alertType: 'BULK_CASE_ACCESS',
      alertedAt: { $gte: bulkSince },
    });
    if (!existing) {
      const alert = await InsiderAlert.create({
        officerId: user._id,
        officerName: user.displayName || user.username,
        alertType: 'BULK_CASE_ACCESS',
        ruleVersion,
        count: caseAccessCount,
        threshold: body.bulkCaseOpeningThreshold || 10,
        details: `${caseAccessCount} cases accessed in ${body.bulkCaseWindowMinutes || 60} minutes (threshold: ${body.bulkCaseOpeningThreshold || 10})`,
        alertedAt: now,
      });
      alerts.push(alert);
    }
  }

  // 3. Out of Scope Searches
  const searchSince = new Date(now.getTime() - (body.outOfScopeSearchWindowMinutes || 60) * 60 * 1000);
  const searchCount = await AuditEvent.countDocuments({
    actorId: actorStr,
    action: 'case.search.out_of_scope',
    at: { $gte: searchSince, $lte: now },
  });

  if (searchCount >= (body.outOfScopeSearchThreshold || 3)) {
    const existing = await InsiderAlert.findOne({
      officerId: user._id,
      alertType: 'OUT_OF_SCOPE_SEARCH',
      alertedAt: { $gte: searchSince },
    });
    if (!existing) {
      const alert = await InsiderAlert.create({
        officerId: user._id,
        officerName: user.displayName || user.username,
        alertType: 'OUT_OF_SCOPE_SEARCH',
        ruleVersion,
        count: searchCount,
        threshold: body.outOfScopeSearchThreshold || 3,
        details: `${searchCount} out-of-scope search attempts in ${body.outOfScopeSearchWindowMinutes || 60} minutes`,
        alertedAt: now,
      });
      alerts.push(alert);
    }
  }

  // 4. Unusual Exports
  const exportSince = new Date(now.getTime() - (body.unusualExportWindowHours || 24) * 3600 * 1000);
  const exportCount = await AuditEvent.countDocuments({
    actorId: actorStr,
    action: { $regex: /export/i },
    at: { $gte: exportSince, $lte: now },
  });

  if (exportCount >= (body.unusualExportThreshold || 3)) {
    const existing = await InsiderAlert.findOne({
      officerId: user._id,
      alertType: 'UNUSUAL_EXPORT',
      alertedAt: { $gte: exportSince },
    });
    if (!existing) {
      const alert = await InsiderAlert.create({
        officerId: user._id,
        officerName: user.displayName || user.username,
        alertType: 'UNUSUAL_EXPORT',
        ruleVersion,
        count: exportCount,
        threshold: body.unusualExportThreshold || 3,
        details: `${exportCount} export operations within past 24 hours`,
        alertedAt: now,
      });
      alerts.push(alert);
    }
  }

  for (const alert of alerts) await recordAudit({ actorId: 'insider-detector', actorRole: 'system', action: 'insider.alert.created',
    targetType: 'InsiderAlert', targetId: String(alert._id), meta: { alertType: alert.alertType, ruleVersion, count: alert.count, warningOnly: true } });
  return alerts;
}

/**
 * List insider alerts for supervisors
 */
export async function listInsiderAlerts(user) {
  return InsiderAlert.find().sort({ alertedAt: -1 }).lean();
}
