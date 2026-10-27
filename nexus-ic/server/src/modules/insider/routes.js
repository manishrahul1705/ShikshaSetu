import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { checkInsiderActivity, listInsiderAlerts } from './insiderService.js';

const router = Router();

/**
 * GET /api/v1/insider/alerts (ADDITIONS.md N54)
 * List insider-access alerts for supervisors.
 */
router.get(
  '/alerts',
  authorize('supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const list = await listInsiderAlerts(req.user);
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/insider/scan/:officerId
 * On-demand scan of officer activity against DEMO-INSIDER-v1.
 */
router.post(
  '/scan/:officerId',
  authorize('supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const simulatedNow = req.body.now ? new Date(req.body.now) : new Date();
      const alerts = await checkInsiderActivity(req.params.officerId, simulatedNow);
      res.json({ count: alerts.length, alerts });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
