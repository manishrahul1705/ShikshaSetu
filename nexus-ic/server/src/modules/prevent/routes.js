import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import User from '../auth/User.js';
import { checkSimilar, chooseSimilar } from './stage1.js';
import { checkAction, proceedAction } from './stage2.js';
import { listOverlaps } from './overlaps.js';
import { listAlerts } from './alerts.js';
import { coSign, coSignSummary } from './cosign.js';
import { officerRoles, fail, audit, uid } from './access.js';
const router = Router();
// No raw database, validation, crypto or user-input strings in error responses/logs.
const handle = work => async (req, res) => {
  try {
    const live = await User.findById(uid(req.user)).lean();
    if (!live?.active || live.role !== req.user.role) throw fail(403, 'SESSION_REVOKED');
    req.user = { ...live, id: String(live._id) };
    res.set('Cache-Control', 'no-store').json(await work(req));
  } catch (error) {
    if (req.user) {
      try { await audit(req.user, 'request.denied', 'request'); }
      catch { return res.status(503).json({ error: 'AUDIT_UNAVAILABLE' }); }
    }
    res.status(error.status || 503).json({ error: error.code && typeof error.code === 'string' ? error.code : 'PREVENT_UNAVAILABLE', canProceed: true });
  }
};
const complainants = ['student', 'faculty', 'other_stakeholder'];
router.post('/grievances/check-similar', authorize(...complainants), handle(req => checkSimilar(req.user, req.body)));
router.post('/grievances/check-similar/choice', authorize(...complainants), handle(req => chooseSimilar(req.user, req.body)));
router.post('/prevent/check-action', authorize(...officerRoles), handle(req => checkAction(req.user, req.body)));
router.post('/prevent/check-action/:id/proceed', authorize(...officerRoles), handle(req => proceedAction(req.user, req.params.id, req.body?.reason)));
router.get('/prevent/overlaps', authorize(...officerRoles), handle(req => listOverlaps(req.user, req.query.institutionPid)));
router.get('/prevent/alerts', authorize(...officerRoles), handle(req => listAlerts(req.user)));
router.post('/cases/:id/co-sign', authorize('student'), handle(req => coSign(req.user, req.params.id)));
router.get('/cases/:id/co-sign', authorize('student', ...officerRoles), handle(req => coSignSummary(req.user, req.params.id)));
export default router;
