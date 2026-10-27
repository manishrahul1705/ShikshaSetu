import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { fileAppeal, startReview, decideAppeal, listAppealsForReview, appealRule, appealView } from './appealService.js';
import { send } from '../closure/util.js';

/** Appeal routes (SPEC 15.2): /cases/:id/appeals, /appeals/:id/decide. */
const router = Router();
const wrap = (fn, status = 200) => async (req, res) => {
  try {
    res.status(status).json(await fn(req));
  } catch (err) {
    send(res, err);
  }
};

router.get('/appeals/rule', authorize(), wrap(() => appealRule()));
router.post('/cases/:id/appeals', authorize('student', 'faculty', 'other_stakeholder'), wrap(async (req) => appealView(await fileAppeal(req.user, req.params.id, req.body || {})), 201));
router.get('/appeals', authorize('supervisor', 'competent_authority', 'auditor'), wrap((req) => listAppealsForReview(req.user, { state: req.query.state })));
router.post('/appeals/:id/review', authorize('supervisor', 'competent_authority'), wrap(async (req) => appealView(await startReview(req.user, req.params.id))));
router.post('/appeals/:id/decide', authorize('supervisor', 'competent_authority'), wrap(async (req) => appealView(await decideAppeal(req.user, req.params.id, req.body || {}))));

export default router;
