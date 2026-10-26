import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { JOURNEY_ROLES } from '../../casejourney/journeyService.js';
import { liveUser } from '../n82-combined-request/service.js';
import { caseSummary } from './service.js';
const router = Router();
router.get('/cases/:caseId/summary', authorize(...JOURNEY_ROLES), async (req, res) => {
  try { res.set('Cache-Control', 'no-store').json(await caseSummary(await liveUser(req.user), req.params.caseId)); }
  catch (e) { res.status(e.status || 503).json({ error: e.code || 'CASE_SUMMARY_UNAVAILABLE' }); }
});
export default router;
