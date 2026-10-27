import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { overview, authorityCase, decide } from './authorityService.js';
import { send } from '../closure/util.js';

/** Competent Authority workspace API: /api/v1/authority/... (SPEC 12.2, N80, S19). */
const router = Router();
const authority = authorize('competent_authority');
const wrap = (fn, status = 200) => async (req, res) => {
  try {
    res.status(status).json(await fn(req));
  } catch (err) {
    send(res, err);
  }
};

router.get('/overview', authority, wrap((req) => overview(req.user)));
router.get('/cases/:id', authority, wrap((req) => authorityCase(req.user, req.params.id)));
router.post('/cases/:id/decisions', authority, wrap((req) => decide(req.user, req.params.id, req.body || {}), 201));

export default router;
