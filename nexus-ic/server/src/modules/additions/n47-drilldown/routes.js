import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { IMPACT_ROLES } from '../../impact/impactService.js';
import { drillDown } from './service.js';
import { send } from '../../closure/util.js';

/** GET /api/v1/impact/cases?row=<rowId> (N47): the cases behind one IMPACT number. */
const router = Router();

router.get('/impact/cases', authorize(...IMPACT_ROLES), async (req, res) => {
  try {
    res.json(await drillDown(req.user, req.query.row));
  } catch (err) {
    send(res, err);
  }
});

export default router;
