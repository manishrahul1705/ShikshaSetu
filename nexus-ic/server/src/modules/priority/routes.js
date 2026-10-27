import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { confirmSensitivityFlag, dismissSensitivityFlag } from './sensitivityService.js';
import { updateCasePriorityAndClock } from './priorityService.js';
import Case from '../cases/Case.js';
import { canAccessCase } from '../../middleware/rbac.js';

const router = Router();

/**
 * POST /api/v1/priority/:caseId/confirm-sensitive (S20, U18)
 */
router.post(
  '/:caseId/confirm-sensitive',
  authorize('supervisor', 'competent_authority', 'bureau_officer'),
  async (req, res) => {
    try {
      const { flagIndex, reason } = req.body;
      const updatedCase = await confirmSensitivityFlag(
        req.params.caseId,
        Number(flagIndex) || 0,
        req.user,
        reason
      );
      res.json({ success: true, priority: updatedCase.priority, sensitivityFlags: updatedCase.sensitivityFlags });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/priority/:caseId/dismiss-sensitive (U18)
 */
router.post(
  '/:caseId/dismiss-sensitive',
  authorize('supervisor', 'competent_authority', 'bureau_officer'),
  async (req, res) => {
    try {
      const { flagIndex, reason } = req.body;
      const updatedCase = await dismissSensitivityFlag(
        req.params.caseId,
        Number(flagIndex) || 0,
        req.user,
        reason
      );
      res.json({ success: true, sensitivityFlags: updatedCase.sensitivityFlags });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/priority/:caseId/change (U19)
 */
router.post(
  '/:caseId/change',
  authorize('supervisor', 'competent_authority', 'bureau_officer'),
  async (req, res) => {
    try {
      const { priority, reason } = req.body;
      if (!['normal', 'high', 'urgent'].includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority. Must be normal, high, or urgent.' });
      }

      const caseDoc = await Case.findById(req.params.caseId);
      if (!caseDoc) return res.status(404).json({ error: 'Case not found' });

      const allowed = await canAccessCase(req.user, caseDoc);
      if (!allowed) return res.status(404).json({ error: 'Case not found' });

      await updateCasePriorityAndClock(caseDoc, priority, req.user, reason);
      await caseDoc.save();

      res.json({ success: true, priority: caseDoc.priority, slaClock: caseDoc.slaClock });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

export default router;
