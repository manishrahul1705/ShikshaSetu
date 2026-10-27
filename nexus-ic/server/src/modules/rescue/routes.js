import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { runRescueScan, listAlerts, acknowledgeAlert, startRescueSchedule } from './rescueService.js';
import { send } from '../closure/util.js';

/** NEXUS RESCUE routes (SPEC 15.2): GET /api/v1/rescue/alerts for supervisors. */
const router = Router();
const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    send(res, err);
  }
};

router.get('/alerts', authorize('supervisor', 'competent_authority', 'auditor'), wrap((req) => listAlerts(req.user, { state: req.query.state })));
router.post('/scan', authorize('supervisor', 'competent_authority', 'system_admin'), wrap((req) => runRescueScan({ user: req.user })));
router.post('/alerts/:id/acknowledge', authorize('supervisor', 'competent_authority'), wrap((req) => acknowledgeAlert(req.user, req.params.id)));

startRescueSchedule();

export default router;
