import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { myQueue, auditTrail, notifications, OFFICER_ROLES, AUDIT_ROLES } from './workspaceService.js';
import { send } from '../closure/util.js';

/** SPEC 12.1 workspaces: /api/v1/workspace/queue, /api/v1/audit-trail, /api/v1/notifications. */
const router = Router();
const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    send(res, err);
  }
};

router.get('/workspace/queue', authorize(...OFFICER_ROLES), wrap((req) => myQueue(req.user)));
router.get('/audit-trail', authorize(...AUDIT_ROLES), wrap((req) => auditTrail(req.user, { limit: req.query.limit, action: req.query.action })));
router.get('/notifications', authorize(), wrap((req) => notifications(req.user)));

export default router;
