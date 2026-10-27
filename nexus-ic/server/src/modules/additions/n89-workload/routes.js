import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { handle } from '../n82-combined-request/routes.js';
import { workload, confirm } from './service.js';
const router = Router();
router.get('/officer-workload', authorize('supervisor', 'bureau_officer'), handle(r => workload(r.user)));
router.post('/officer-workload/confirm', authorize('supervisor'), handle(r => confirm(r.user, r.body)));
export default router;
