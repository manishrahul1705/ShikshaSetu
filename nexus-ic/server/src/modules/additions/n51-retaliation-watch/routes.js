import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { runRetaliationWatch, listRetaliationAlerts } from './service.js';
import { send } from '../../closure/util.js';

/** N51 routes: private advisory alerts for the Competent Authority only. */
const router = Router();

router.get('/retaliation-watch/alerts', authorize('competent_authority'), async (req, res) => {
  try {
    res.json(await listRetaliationAlerts(req.user));
  } catch (err) {
    send(res, err);
  }
});

router.post('/retaliation-watch/run', authorize('competent_authority', 'system_admin'), async (req, res) => {
  try {
    const { alerts, ...counts } = await runRetaliationWatch({ actor: req.user });
    res.json({ ...counts, alertsRaised: alerts.length });
  } catch (err) {
    send(res, err);
  }
});

export default router;
