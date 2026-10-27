import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import {
  routeCaseOnSubmission,
  overrideRoute,
  getTriageCases,
  assignOfficerToCase,
} from './routingService.js';
import RoutingDecision from './models.js';
import Case from '../cases/Case.js';
import { canAccessCase } from '../../middleware/rbac.js';

const router = Router();

/**
 * GET /api/v1/routing/triage
 * Human triage queue for ambiguous cases (SPEC 8.4)
 */
router.get(
  '/triage',
  authorize('supervisor', 'competent_authority'),
  async (_req, res) => {
    try {
      const triageList = await getTriageCases();
      res.json(triageList);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/routing/:caseId/decision
 * Fetch decision history for a case
 */
router.get(
  '/:caseId/decision',
  authorize(),
  async (req, res) => {
    try {
      const caseDoc = await Case.findById(req.params.caseId);
      if (!caseDoc) return res.status(404).json({ error: 'Case not found' });

      const allowed = await canAccessCase(req.user, caseDoc);
      if (!allowed) return res.status(404).json({ error: 'Case not found' });

      const decisions = await RoutingDecision.find({ caseId: caseDoc._id })
        .sort({ createdAt: -1 })
        .populate('overriddenBy', 'username role')
        .lean();

      res.json(decisions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/routing/:caseId/decide
 * Run explainable routing decision
 */
router.post(
  '/:caseId/decide',
  authorize('supervisor', 'competent_authority', 'bureau_officer'),
  async (req, res) => {
    try {
      const result = await routeCaseOnSubmission(req.params.caseId);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/routing/:caseId/override (U17)
 * Override routing decision with mandatory recorded reason
 */
router.post(
  '/:caseId/override',
  authorize('supervisor', 'competent_authority'),
  async (req, res) => {
    try {
      const primary = req.body.primary || req.body.targetBureau;
      const { secondary, reason } = req.body;
      const result = await overrideRoute(req.params.caseId, {
        primary,
        secondary,
        reason,
        user: req.user,
      });
      res.json({
        success: true,
        targetBureau: primary,
        primary,
        ...result,
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/routing/:caseId/assign (SPEC 8.4)
 * Assign routed case to named officer
 */
router.post(
  '/:caseId/assign',
  authorize('supervisor', 'competent_authority'),
  async (req, res) => {
    try {
      const { officerId, reason } = req.body;
      const updatedCase = await assignOfficerToCase(req.params.caseId, {
        officerId,
        user: req.user,
        reason,
      });
      res.json(updatedCase);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

export default router;
