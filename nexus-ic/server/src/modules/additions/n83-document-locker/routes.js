import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { handle } from '../n82-combined-request/routes.js';
import { liveUser, officers } from '../n82-combined-request/service.js';
import * as service from './service.js';
const router = Router();
router.get('/locker', authorize(...officers, 'institution_admin'), handle(r => service.list(r.user, r.query)));
router.post('/locker', authorize('institution_admin'), handle(r => service.upload(r.user, r.body)));
router.post('/locker/access', authorize(...officers), handle(r => service.requestAccess(r.user, r.body)));
router.post('/locker/grants/:id', authorize('institution_admin'), handle(r => service.decide(r.user, r.params.id, r.body)));
router.get('/locker/:id/download', authorize(...officers, 'institution_admin'), async (req, res) => {
  try { const data = await service.download(await liveUser(req.user), req.params.id, req.query.caseId); res.set('Cache-Control', 'no-store').type(data.mimeType).send(data.buffer); }
  catch (e) { res.status(e.status || 503).json({ error: e.code || 'DOCUMENT_UNAVAILABLE' }); }
});
export default router;
