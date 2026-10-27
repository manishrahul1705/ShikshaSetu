import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { traceExport } from './service.js';

/** POST /api/v1/exports/trace (N55): find which export a leaked text came from. */
const router = Router();

router.post('/exports/trace', authorize('auditor', 'supervisor', 'system_admin'), async (req, res) => {
  try {
    res.json(await traceExport(req.user, req.body?.text));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.code || err.message });
  }
});

export default router;
