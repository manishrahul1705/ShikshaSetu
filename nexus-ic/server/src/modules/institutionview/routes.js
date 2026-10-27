import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import {
  listInstitutionCases,
  getInstitutionCase,
  institutionStatusSummary,
  submitClarification,
  respondAsInstitution,
} from './institutionViewService.js';
import { send } from '../closure/util.js';

/** Institution workspace: /api/v1/institution-workspace/... (N30, N71). */
const router = Router();
const admin = authorize('institution_admin');
const wrap = (fn, status = 200) => async (req, res) => {
  try {
    res.status(status).json(await fn(req));
  } catch (err) {
    send(res, err);
  }
};

router.get('/cases', admin, wrap((req) => listInstitutionCases(req.user)));
router.get('/status-summary', admin, wrap((req) => institutionStatusSummary(req.user)));
router.get('/cases/:id', admin, wrap((req) => getInstitutionCase(req.user, req.params.id)));
router.post('/cases/:id/clarifications', admin, wrap((req) => submitClarification(req.user, req.params.id, req.body || {}), 201));
router.post('/queries/:id/respond', admin, wrap((req) => respondAsInstitution(req.user, req.params.id, req.body || {})));

export default router;
