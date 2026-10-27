import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { handle } from '../n82-combined-request/routes.js';
import { officers } from '../n82-combined-request/service.js';
import { responseRecord } from './service.js';
const router=Router();
router.get('/institution-response-record',authorize(...officers,'institution_admin'),handle(r=>responseRecord(r.user,r.query.pid)));
export default router;
