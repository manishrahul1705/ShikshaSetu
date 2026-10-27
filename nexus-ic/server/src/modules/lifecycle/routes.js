import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import Case from '../cases/Case.js';
import { transitionStatus, formatComplainantView } from './lifecycleService.js';
import { canAccessCase } from '../../middleware/rbac.js';

const router = Router();

/**
 * GET /api/v1/cases/:id/complainant-status (N28)
 * True and transparent complainant status view.
 */
router.get(
  '/cases/:id/complainant-status',
  authorize(),
  async (req, res) => {
    try {
      const caseDoc = await Case.findOne({
        $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { masterCaseId: req.params.id }].filter(Boolean),
      });

      if (!caseDoc) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const allowed = await canAccessCase(req.user, caseDoc);
      if (!allowed) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const view = formatComplainantView(caseDoc);
      res.json(view);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * PATCH /api/v1/cases/:id/status (N28)
 * Invariant-guarded status transition (e.g. transferred cases cannot revert to Registered/Submitted).
 */
router.patch(
  '/cases/:id/status',
  authorize('supervisor', 'competent_authority', 'bureau_officer', 'regional_officer', 'system_admin'),
  async (req, res) => {
    try {
      const { status, reason } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Missing next status' });
      }

      const caseDoc = await Case.findOne({
        $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { masterCaseId: req.params.id }].filter(Boolean),
      });

      if (!caseDoc) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const updated = await transitionStatus(caseDoc._id, status, req.user, reason);
      res.json({
        success: true,
        masterCaseId: updated.masterCaseId,
        status: updated.status,
        analyticStatus: updated.analyticStatus,
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

export default router;
