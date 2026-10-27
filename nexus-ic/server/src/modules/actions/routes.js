import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { recordOfficerAction, getCaseActions } from './actionService.js';

const router = Router();

const OFFICER_ROLES = [
  'bureau_officer',
  'regional_officer',
  'supervisor',
  'competent_authority',
  'system_admin',
];

/**
 * POST /api/v1/actions/record (N72, SPEC 9.4)
 * Record a role-specific officer action with S4 pre-check.
 */
router.post(
  '/record',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await recordOfficerAction(req.user, req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/actions/case/:caseId
 * List actions recorded for a case.
 */
router.get(
  '/case/:caseId',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const actions = await getCaseActions(req.user, req.params.caseId);
      res.json(actions);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

export default router;
