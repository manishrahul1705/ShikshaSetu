import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { submitFeedback } from './feedbackService.js';
import { send } from '../closure/util.js';

const router = Router();

/** POST /api/v1/cases/:id/feedback (SPEC 15.2, N23): complainant feedback on own case. */
router.post('/cases/:id/feedback', authorize('student', 'faculty', 'other_stakeholder'), async (req, res) => {
  try {
    res.status(201).json(await submitFeedback(req.user, req.params.id, req.body || {}));
  } catch (err) {
    send(res, err);
  }
});

export default router;
