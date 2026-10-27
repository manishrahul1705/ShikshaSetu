import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import RuleBookVersion from './models.js';
import { problemStatementFamilies } from '../additions/n88-first-redressal/rulebookPlugin.js';
import {
  createDraftVersion,
  runDryRun,
  approveVersion,
  getVersionWhatIfPreview,
} from './rulebookService.js';

const router = Router();

/**
 * GET /api/v1/rulebook/families
 * List all supported families and their current approved active versions
 */
router.get(
  '/families',
  authorize('system_admin', 'supervisor', 'competent_authority', 'auditor'),
  async (_req, res) => {
    try {
      const families = [
        ...problemStatementFamilies,
        'JURISDICTION',
        'ROUTING',
        'SLA',
        'TRANSFER',
        'ESCALATION',
        'COORDINATION',
        'RESCUE',
        'OVERLAP_DETECTION',
        'CLOSURE_REQUIREMENTS',
        'SENSITIVITY',
        'APPEAL',
        'ELIGIBILITY',
      ];

      const activeRules = await RuleBookVersion.find({
        status: 'approved',
        effectiveFrom: { $lte: new Date() },
      })
        .sort({ effectiveFrom: -1 })
        .lean();

      const familyMap = {};
      for (const fam of families) {
        const found = activeRules.find((r) => r.family === fam);
        familyMap[fam] = found
          ? {
              version: found.version,
              effectiveFrom: found.effectiveFrom,
              synthetic: found.synthetic,
            }
          : { status: 'POLICY_NOT_CONFIGURED' };
      }

      res.json({ families, activeRules: familyMap, ...familyMap });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/rulebook/versions
 * List all versions (drafts, pending, approved)
 */
router.get(
  '/versions',
  authorize('system_admin', 'supervisor', 'competent_authority', 'auditor'),
  async (req, res) => {
    try {
      const filter = {};
      if (req.query.family) filter.family = req.query.family;
      if (req.query.status) filter.status = req.query.status;

      const versions = await RuleBookVersion.find(filter)
        .populate('requestedBy', 'username role')
        .populate('approvedBy', 'username role')
        .sort({ createdAt: -1 })
        .lean();

      res.json(versions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/rulebook/versions/:id
 */
router.get(
  '/versions/:id',
  authorize('system_admin', 'supervisor', 'competent_authority', 'auditor'),
  async (req, res) => {
    try {
      const version = await RuleBookVersion.findById(req.params.id)
        .populate('requestedBy', 'username role')
        .populate('approvedBy', 'username role')
        .lean();

      if (!version) return res.status(404).json({ error: 'Version not found' });
      res.json(version);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/rulebook/versions
 * Request a new version (two-step flow part 1)
 */
router.post(
  '/versions',
  authorize('system_admin', 'supervisor', 'competent_authority'),
  async (req, res) => {
    try {
      const { family, version, description, body, effectiveFrom } = req.body;
      const created = await createDraftVersion({
        family,
        version,
        description,
        body,
        effectiveFrom,
        user: req.user,
      });
      res.status(201).json(created);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/rulebook/versions/:id/dry-run
 * Run dry-run against fixture cases
 */
router.post(
  '/versions/:id/dry-run',
  authorize('system_admin', 'supervisor', 'competent_authority'),
  async (req, res) => {
    try {
      const updated = await runDryRun(req.params.id, req.user);
      res.json(updated);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET or POST /api/v1/rulebook/versions/:id/preview (N65)
 * What-if preview of open cases
 */
const handlePreview = async (req, res) => {
  try {
    const preview = await getVersionWhatIfPreview(req.params.id);
    res.json(preview);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

router.get(
  '/versions/:id/preview',
  authorize('system_admin', 'supervisor', 'competent_authority', 'auditor'),
  handlePreview
);

router.post(
  '/versions/:id/preview',
  authorize('system_admin', 'supervisor', 'competent_authority', 'auditor'),
  handlePreview
);

/**
 * POST /api/v1/rulebook/versions/:id/approve (S20, U29)
 * Approve version (approver must differ from requester)
 */
router.post(
  '/versions/:id/approve',
  authorize('supervisor', 'competent_authority'),
  async (req, res) => {
    try {
      const approved = await approveVersion(req.params.id, req.user);
      res.json(approved);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

export default router;
