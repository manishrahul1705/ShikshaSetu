import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import Transfer from './models.js';
import {
  requestTransfer,
  acceptTransfer,
  rejectTransfer,
  checkTransferEscalations,
  getTransferHistory,
} from './traceService.js';
import { diffBusinessDays } from './businessDays.js';
import { applyFieldPolicy } from '../../middleware/abac.js';

const router = Router();

/**
 * POST /api/v1/transfers (SPEC 9.2, N20)
 * Request a case transfer to another bureau.
 */
router.post(
  '/',
  authorize('bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const { masterCaseId, toBureau, reason } = req.body;
      const result = await requestTransfer(req.user, { masterCaseId, toBureau, reason });
      res.status(201).json({ ...result, case: applyFieldPolicy(result.case, req.user.role) });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/transfers/:id/accept (SPEC 9.2, N20, Appendix V Layer 6)
 * Acknowledge and accept transfer.
 */
router.post(
  '/:id/accept',
  authorize('bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const result = await acceptTransfer(req.user, req.params.id);
      res.json({ ...result, case: applyFieldPolicy(result.case, req.user.role) });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/transfers/:id/reject (SPEC 9.2, N20, U21)
 * Reject a transfer with mandatory reason.
 */
router.post(
  '/:id/reject',
  authorize('bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const result = await rejectTransfer(req.user, req.params.id, { reason });
      res.json({ ...result, case: applyFieldPolicy(result.case, req.user.role) });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/transfers/inbox
 * Incoming transfers awaiting acknowledgement by the officer's bureau.
 */
router.get(
  '/inbox',
  authorize('bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const bureau = req.user.bureau;
      const query = { status: 'REQUESTED' };
      if (bureau && !['supervisor', 'competent_authority', 'system_admin'].includes(req.user.role)) {
        query.toBureau = bureau;
      }
      const list = await Transfer.find(query).sort({ requestedAt: -1 }).lean();

      const now = new Date();
      const enriched = list.map((t) => ({
        ...t,
        businessDaysLeft: t.dueAt > now ? diffBusinessDays(now, t.dueAt) : 0,
        isOverdue: t.dueAt <= now,
      }));

      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/transfers/outbox
 * Outgoing open transfers initiated by the officer's bureau.
 */
router.get(
  '/outbox',
  authorize('bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const bureau = req.user.bureau;
      const query = { status: 'REQUESTED' };
      if (bureau && !['supervisor', 'competent_authority', 'system_admin'].includes(req.user.role)) {
        query.fromBureau = bureau;
      }
      const list = await Transfer.find(query).sort({ requestedAt: -1 }).lean();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/transfers/check-escalations
 * On-demand or cron trigger for unacknowledged transfer escalation (U20).
 */
router.post(
  '/check-escalations',
  authorize('supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const simulatedNow = req.body.now ? new Date(req.body.now) : new Date();
      const escalated = await checkTransferEscalations(simulatedNow);
      res.json({ count: escalated.length, escalated });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/transfers/case/:caseId
 * Full transfer history for case (scrubbed for complainants, detailed for officers).
 */
router.get(
  '/case/:caseId',
  authorize(),
  async (req, res) => {
    try {
      const list = await getTransferHistory(req.params.caseId, req.user);
      res.json(list);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

export default router;
