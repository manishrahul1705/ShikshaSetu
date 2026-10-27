import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { trackCase, listOwnCases } from './trackService.js';
import { send } from '../closure/util.js';

/** GET /api/v1/track and /api/v1/track/:caseId (SPEC 15.2, N29): own cases only. */
const router = Router();

router.get('/', authorize('student', 'faculty', 'other_stakeholder'), async (req, res) => {
  try {
    res.json(await listOwnCases(req.user));
  } catch (err) {
    send(res, err);
  }
});

router.get('/:caseId', authorize(), async (req, res) => {
  try {
    res.json(await trackCase(req.user, req.params.caseId));
  } catch (err) {
    send(res, err);
  }
});

export default router;
