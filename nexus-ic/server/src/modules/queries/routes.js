import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { sendQuery, respondToQuery, getQueriesForCase } from './queryService.js';

const router = Router();

/**
 * POST /api/v1/queries (N70)
 * Officer sends query/clarification to complainant or institution.
 */
router.post(
  '/',
  authorize('bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const { caseId, recipientType, queryText } = req.body;
      const query = await sendQuery(req.user, { caseId, recipientType, queryText, proceedReason: req.body.proceedReason });
      res.status(201).json(query);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/queries/:id/respond (N70)
 * Complainant or institution responds with clarifications and documents.
 */
router.post(
  '/:id/respond',
  authorize(),
  async (req, res) => {
    try {
      const { responseText, documentIds } = req.body;
      const query = await respondToQuery(req.user, req.params.id, { responseText, documentIds });
      res.json(query);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/queries/case/:caseId (N70, SPEC 12.3)
 * Fetches queries for case scoped strictly to caller role.
 */
router.get(
  '/case/:caseId',
  authorize(),
  async (req, res) => {
    try {
      const queries = await getQueriesForCase(req.user, req.params.caseId);
      res.json(queries);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

export default router;
