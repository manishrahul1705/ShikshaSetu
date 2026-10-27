import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { listBureaus, getBureauByCode, getBureauOfficers } from './bureauService.js';

const router = Router();

/**
 * GET /api/v1/bureaus
 */
router.get('/', authorize(), async (_req, res) => {
  try {
    const bureaus = await listBureaus();
    res.json(bureaus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/bureaus/:code
 */
router.get('/:code', authorize(), async (req, res) => {
  try {
    const bureau = await getBureauByCode(req.params.code);
    if (!bureau) return res.status(404).json({ error: 'Bureau not found' });

    const officers = await getBureauOfficers(bureau.code);
    res.json({ ...bureau, officers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
