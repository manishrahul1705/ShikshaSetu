import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import * as service from './service.js';
export const handle = fn => async (req, res) => {
  try { req.user = await service.liveUser(req.user); res.set('Cache-Control', 'no-store').json(await fn(req)); }
  catch (e) { res.status(e.status || 503).json({ error: e.code || 'REQUEST_UNAVAILABLE' }); }
};
const router = Router();
const allowed = [...service.officers, 'institution_admin'];
router.get('/combined-requests', authorize(...allowed), handle(r => service.list(r.user, r.query.pid)));
router.get('/combined-requests/eligible', authorize(...service.officers), handle(r => service.eligible(r.user, r.query.pid)));
router.get('/combined-requests/counts', authorize(...allowed), handle(r => service.counts(r.user, r.query.pid)));
router.post('/combined-requests', authorize(...service.officers), handle(r => service.propose(r.user, r.body)));
router.post('/combined-requests/:id/items/:itemId/decision', authorize(...service.officers), handle(r => service.decide(r.user, r.params.id, r.params.itemId, r.body.decision)));
router.post('/combined-requests/:id/issue', authorize(...service.officers), handle(r => service.issue(r.user, r.params.id)));
router.post('/combined-requests/:id/items/:itemId/reply', authorize('institution_admin'), handle(r => service.reply(r.user, r.params.id, r.params.itemId, r.body)));
export default router;
