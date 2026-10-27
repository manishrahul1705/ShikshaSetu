import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { getSuggestions, confirmRedaction, REDACTION_ROLES } from './service.js';
import { send } from '../../closure/util.js';

/** N62 routes: officer reviews highlights and confirms each before the institution-facing form. */
const router = Router();

router.get('/cases/:id/redaction', authorize(...REDACTION_ROLES), async (req, res) => {
  try {
    res.json(await getSuggestions(req.user, req.params.id));
  } catch (err) {
    send(res, err);
  }
});

router.post('/cases/:id/redaction/confirm', authorize(...REDACTION_ROLES), async (req, res) => {
  try {
    res.json(await confirmRedaction(req.user, req.params.id, req.body || {}));
  } catch (err) {
    send(res, err);
  }
});

export default router;
