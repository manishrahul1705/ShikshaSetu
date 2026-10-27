import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { IMPACT_ROLES } from '../../impact/impactService.js';
import { patternAlerts } from './service.js';
import { send } from '../../closure/util.js';

/** GET /api/v1/impact/patterns (N61): cross-institution pattern alerts beside IMPACT. */
const router = Router();

router.get('/impact/patterns', authorize(...IMPACT_ROLES), async (req, res) => {
  try {
    res.json(await patternAlerts(req.user));
  } catch (err) {
    send(res, err);
  }
});

export default router;
