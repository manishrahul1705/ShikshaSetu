import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import RuleBookVersion from './models.js';
import { generateWhatIfPreview } from './previewService.js';
import { recordAudit } from '../audit/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Get active rule for family in force at `at` (SPEC Section 11, N27)
 *
 * @param {string} family - Rule family name
 * @param {Date} [at=new Date()] - As-of timestamp
 * @returns {Promise<Object>}
 */
export async function getActiveRule(family, at = new Date()) {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    return { result: 'POLICY_NOT_CONFIGURED' };
  }

  const isProduction = process.env.APP_MODE === 'production';

  const query = {
    family,
    status: 'approved',
    effectiveFrom: { $lte: at },
  };

  if (isProduction) {
    query.version = { $not: /^DEMO-/ };
  }

  const doc = await RuleBookVersion.findOne(query).sort({ effectiveFrom: -1, createdAt: -1 });

  if (!doc) {
    return { result: 'POLICY_NOT_CONFIGURED' };
  }

  return {
    family: doc.family,
    versionId: doc.version,
    ruleId: doc.version,
    version: doc.version,
    status: 'approved',
    body: doc.body,
    effectiveFrom: doc.effectiveFrom,
    demo: doc.synthetic,
  };
}

/**
 * Create a new draft rule version (N27, U29)
 */
export async function createDraftVersion({ family, version, description, body, effectiveFrom, user }) {
  if (!family || !version || !body) {
    const err = new Error('family, version, and body are required');
    err.status = 400;
    throw err;
  }

  const existing = await RuleBookVersion.findOne({ family, version });
  if (existing) {
    const err = new Error(`Version ${version} already exists for family ${family}`);
    err.status = 400;
    throw err;
  }

  const newVersion = await RuleBookVersion.create({
    family,
    version,
    description: description || '',
    body,
    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
    status: 'draft',
    requestedBy: user._id || user.id,
    synthetic: version.startsWith('DEMO-'),
  });

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'rulebook.version.created',
    targetType: 'RuleBookVersion',
    targetId: String(newVersion._id),
    meta: { family, version },
  });

  return newVersion;
}

/**
 * Run dry-run against fixture set (N27, U29)
 */
export async function runDryRun(versionId, user) {
  const version = await RuleBookVersion.findById(versionId);
  if (!version) {
    const err = new Error('Rule version not found');
    err.status = 404;
    throw err;
  }

  // Load synthetic fixtures
  const fixturesPath = path.join(__dirname, 'fixtures', 'syntheticCases.json');
  let fixtures = [];
  if (fs.existsSync(fixturesPath)) {
    fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
  }

  // Simulate evaluation of dry-run fixtures
  const evaluatedResults = fixtures.map((fx) => {
    let outcome = 'OK';
    if (['JURISDICTION', 'ROUTING'].includes(version.family)) {
      const mapping = version.body?.bureauMapping || {};
      const primary = mapping[fx.category]?.primary || version.body?.defaultPrimary || 'PGRC';
      outcome = `Routed to ${primary}`;
    } else if (version.family === 'SLA') {
      const timelines = version.body?.timelines || {};
      const days = version.body?.calendarDays || timelines[fx.category]?.resolutionDays || timelines.default?.resolutionDays;
      outcome = Number.isFinite(days) && days > 0 ? `SLA window ${days} days` : 'POLICY_NOT_CONFIGURED';
    }
    return { fixtureId: fx.id, category: fx.category, outcome };
  });

  version.dryRunPassed = true;
  version.dryRunAt = new Date();
  version.dryRunResults = { evaluatedCount: fixtures.length, results: evaluatedResults };
  version.status = 'pending_approval';
  await version.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'rulebook.version.dry_run',
    targetType: 'RuleBookVersion',
    targetId: String(version._id),
    meta: { family: version.family, version: version.version, passed: true },
  });

  return {
    ...version.toObject(),
    passed: version.dryRunPassed,
    totalCases: version.dryRunResults?.evaluatedCount || fixtures.length,
  };
}

/**
 * Approve rule version with two-step separation of duties (S20, U29)
 */
export async function approveVersion(versionId, user) {
  const version = await RuleBookVersion.findById(versionId);
  if (!version) {
    const err = new Error('Rule version not found');
    err.status = 404;
    throw err;
  }

  if (!version.dryRunPassed) {
    const err = new Error('A version without a dry-run cannot be approved');
    err.status = 400;
    throw err;
  }

  // S20: Requester cannot be approver (Two-step approval)
  if (String(version.requestedBy) === String(user._id || user.id)) {
    const err = new Error('Requester cannot approve their own rule change request (S20)');
    err.status = 403;
    throw err;
  }

  version.status = 'approved';
  version.approvedBy = user._id || user.id;
  version.approvedAt = new Date();
  await version.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'rulebook.version.approved',
    targetType: 'RuleBookVersion',
    targetId: String(version._id),
    meta: { family: version.family, version: version.version },
  });

  return version;
}

/**
 * N65 what-if preview before approval
 */
export async function getVersionWhatIfPreview(versionId) {
  const version = await RuleBookVersion.findById(versionId);
  if (!version) {
    const err = new Error('Rule version not found');
    err.status = 404;
    throw err;
  }
  return generateWhatIfPreview(version);
}
