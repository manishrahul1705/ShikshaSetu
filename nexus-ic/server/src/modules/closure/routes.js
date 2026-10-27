import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { proposeClosure, attachEvidence, approveClosure, closeCase, getClosureView } from './closureService.js';
import { send } from './util.js';

/**
 * NEXUS PROOF routes (SPEC 15.2): /api/v1/cases/:id/closure/...
 * Every route re-authorizes on the server (S01) and checks case scope (S02).
 */
const router = Router();
const OFFICERS = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];

const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    send(res, err);
  }
};

router.get('/cases/:id/closure', authorize(...OFFICERS, 'auditor'), wrap((req) => getClosureView(req.user, req.params.id)));
router.get('/cases/:id/closure/gate', authorize(...OFFICERS, 'auditor'), wrap(async (req) => (await getClosureView(req.user, req.params.id)).gate));
router.post('/cases/:id/closure/propose', authorize(...OFFICERS), wrap((req) => proposeClosure(req.user, req.params.id, req.body || {})));
router.post('/cases/:id/closure/evidence', authorize(...OFFICERS), wrap((req) => attachEvidence(req.user, req.params.id, req.body || {})));
router.post('/cases/:id/closure/approve', authorize('supervisor', 'competent_authority'), wrap((req) => approveClosure(req.user, req.params.id)));
router.post('/cases/:id/closure/close', authorize(...OFFICERS), wrap((req) => closeCase(req.user, req.params.id)));

export default router;
