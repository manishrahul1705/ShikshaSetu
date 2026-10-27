import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { resetAndSeed, currentTour } from './service.js';
import { send } from '../../closure/util.js';

/**
 * N46 routes. Any signed-in demo account may use them (S01: every route is
 * re-authorized); 404 in production mode. Reset also refuses non-demo databases.
 */
const router = Router();

router.get('/judge/tour', authorize(), async (req, res) => {
  try {
    res.json(await currentTour());
  } catch (err) {
    send(res, err);
  }
});

router.post('/judge/reset', authorize(), async (req, res) => {
  try {
    const result = await resetAndSeed(req.session?.user || undefined);
    // The reset cleared every session, including this one.
    req.session?.destroy?.(() => {});
    res.json(result);
  } catch (err) {
    send(res, err);
  }
});

export default router;
