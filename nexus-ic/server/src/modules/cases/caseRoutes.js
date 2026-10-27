import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { getComplainantCase, getComplainantCases } from './caseService.js';
import Case from './Case.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { applyFieldPolicy } from '../../middleware/abac.js';

const router = Router();

/**
 * GET /api/v1/cases/my (S21, N15)
 * Complainant lists their own cases.
 */
router.get(
  '/my',
  authorize('student', 'faculty', 'other_stakeholder'),
  async (req, res) => {
    try {
      const list = await getComplainantCases(req.user);
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/cases/:caseId (S21, S02, S03, SPEC 15.2)
 *
 * Case status view with IDOR denied:
 * Any unauthorized access returns 404 with an attributed audit event.
 */
router.get(
  '/:caseId',
  authorize(),
  async (req, res) => {
    try {
      const caseId = req.params.caseId;
      const caseDoc = await getComplainantCase(caseId, req.user);

      if (!caseDoc) {
        // IDOR protection (S21): returns 404 instead of 403 to prevent enumeration
        return res.status(404).json({ error: 'Case not found' });
      }

      res.json(caseDoc);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
