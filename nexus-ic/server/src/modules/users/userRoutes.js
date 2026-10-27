import { Router } from 'express';
import authorize from '../../middleware/authorize.js';

const router = Router();

/**
 * Placeholder user routes for later phases.
 * All routes are protected by authorize (S01).
 */
router.get('/', authorize('system_admin'), async (req, res) => {
  res.json({ message: 'User list - placeholder for later phases' });
});

export default router;
