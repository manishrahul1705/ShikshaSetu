import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { send } from '../closure/util.js';
import { caseJourney, JOURNEY_ROLES } from './journeyService.js';

/** GET /api/v1/cases/:caseId/journey: officer case journey (read-only). */
const router = Router();

router.get('/cases/:caseId/journey', authorize(...JOURNEY_ROLES), async (req, res) => {
  try {
    res.json(await caseJourney(req.user, req.params.caseId));
  } catch (err) {
    send(res, err);
  }
});

export default router;
