import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { compareRun, COMPARE_ROLES } from './service.js';
import { send } from '../../closure/util.js';

const router = Router();
router.get('/problem-comparison/:pid', authorize(...COMPARE_ROLES), async (req, res) => {
  try { res.json(await compareRun(req.user, req.params.pid)); }
  catch (err) { send(res, err); }
});
export default router;
