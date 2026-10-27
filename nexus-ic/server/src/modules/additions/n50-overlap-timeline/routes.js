import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { overlapTimeline, TIMELINE_ROLES } from './service.js';
import { send } from '../../closure/util.js';

/** GET /api/v1/overlap-timeline/:pid?bureaus=A,B (N50): read-only. */
const router = Router();

router.get('/overlap-timeline/:pid', authorize(...TIMELINE_ROLES), async (req, res) => {
  try {
    res.json(await overlapTimeline(req.user, req.params.pid, { bureaus: req.query.bureaus }));
  } catch (err) {
    send(res, err);
  }
});

export default router;
