import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { officerRoles } from '../../prevent/access.js';
import { liveUser } from '../n82-combined-request/service.js';
import { coordinationFlags } from './service.js';
const router = Router();
router.get('/coordination', authorize(...officerRoles), async (req, res) => {
  try { res.set('Cache-Control', 'no-store').json(await coordinationFlags(await liveUser(req.user), req.query.pid)); }
  catch (e) { res.status(e.status || 503).json({ error: e.code || 'COORDINATION_UNAVAILABLE' }); }
});
export default router;
