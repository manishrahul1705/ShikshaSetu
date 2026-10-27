import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { buildReceipt } from './service.js';
import { send } from '../../closure/util.js';

/** GET /api/v1/track/:caseId/receipt (N63): the complainant's own receipt, as a downloadable HTML page. */
const router = Router();

router.get('/track/:caseId/receipt', authorize('student', 'faculty', 'other_stakeholder'), async (req, res) => {
  try {
    const { html, masterCaseId } = await buildReceipt(req.user, req.params.caseId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${masterCaseId}.html"`);
    res.send(html);
  } catch (err) {
    send(res, err);
  }
});

export default router;
