import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import authorize from '../../../middleware/authorize.js';
import { recordAudit } from '../../audit/audit.js';

const router = Router();
const coveragePath = fileURLToPath(new URL('../../../../../docs/ps-coverage.json', import.meta.url));
const resultsPath = fileURLToPath(new URL('../../../../../test-results/results.json', import.meta.url));
const ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor', 'system_admin'];

function resultIndex(json) {
  const byId = {};
  for (const suite of json?.testResults || []) for (const assertion of suite.assertionResults || []) {
    const title = assertion.fullName || assertion.title || '';
    for (const match of title.matchAll(/\[([A-Z](?:-N)?\d{2})\]/g)) byId[match[1]] = byId[match[1]] === 'failed' ? 'failed' : assertion.status;
  }
  return byId;
}

router.get('/ps-coverage', authorize(...ROLES), async (req, res) => {
  try {
    const [coverage, raw] = await Promise.all([readFile(coveragePath, 'utf8'), readFile(resultsPath, 'utf8').catch(() => '{}')]);
    const tests = resultIndex(JSON.parse(raw));
    await recordAudit({ actorId: String(req.user.id || req.user._id), actorRole: req.user.role, action: 'problem_coverage.viewed', targetType: 'Coverage', targetId: 'PS-26264' });
    res.set('Cache-Control', 'no-store').json({ ...JSON.parse(coverage), tests });
  } catch {
    res.status(503).json({ error: 'COVERAGE_UNAVAILABLE' });
  }
});

export default router;
