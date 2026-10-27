import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { institutionGraph, attentionRadar, GRAPH_ROLES } from './graphService.js';
import { send } from '../closure/util.js';

/** Graph and radar views: /api/v1/graph/institutions/:pid and /graph/institutions/:pid/radar. */
const router = Router();
const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    send(res, err);
  }
};

router.get('/institutions/:pid', authorize(...GRAPH_ROLES), wrap((req) => institutionGraph(req.user, req.params.pid)));
router.get('/institutions/:pid/radar', authorize(...GRAPH_ROLES), wrap((req) => attentionRadar(req.user, req.params.pid)));

export default router;
