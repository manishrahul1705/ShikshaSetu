import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { verifyChain } from './audit.js';

const router = Router();

/**
 * GET /api/v1/audit/verify
 * Admin-only endpoint to verify the audit chain integrity.
 * Returns { intact: true, count } or { intact: false, brokenSeq }.
 */
router.get(
  '/verify',
  authorize('system_admin', 'auditor', 'competent_authority'),
  async (req, res) => {
    try {
      const result = await verifyChain();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Chain verification failed' });
    }
  }
);

export default router;
