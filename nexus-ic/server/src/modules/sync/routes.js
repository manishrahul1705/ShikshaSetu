import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import {
  getSharedInstitutionView,
  createCoordination,
  recordCoordinationAgreement,
  createCoordinationTask,
  acknowledgeCoordinationTask,
  completeCoordinationTask,
  checkInstructionConflict,
  getCommunicationLog,
} from './syncService.js';
import { sendBlindNotice } from './noticeService.js';
import {
  createDisclosureGrant,
  verifyGrantAccess,
  revokeDisclosureGrant,
} from './disclosureService.js';
import {
  addInternalNote,
  getInternalNotes,
} from './internalNotesService.js';

const router = Router();

const OFFICER_ROLES = [
  'bureau_officer',
  'regional_officer',
  'supervisor',
  'competent_authority',
  'system_admin',
];

/**
 * GET /api/v1/sync/institution/:institutionPid (SPEC 9.3, N21)
 * Shared view of all related cases for an institution.
 */
router.get(
  '/institution/:institutionPid',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const view = await getSharedInstitutionView(req.user, req.params.institutionPid);
      res.json(view);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/coordinations (SPEC 9.3)
 */
router.post(
  '/coordinations',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await createCoordination(req.user, req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/coordinations/:id/agree (N75)
 * Agree on Next Steps (where applicable).
 */
router.post(
  '/coordinations/:id/agree',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await recordCoordinationAgreement(req.user, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/tasks (SPEC 9.3, N21)
 * Create coordination task with RuleBook clocks.
 */
router.post(
  '/tasks',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await createCoordinationTask(req.user, req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/tasks/:id/acknowledge
 */
router.post(
  '/tasks/:id/acknowledge',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await acknowledgeCoordinationTask(req.user, req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/tasks/:id/complete
 * Completing a task never closes a case.
 */
router.post(
  '/tasks/:id/complete',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await completeCoordinationTask(req.user, req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/check-instruction (SPEC 9.3, N21)
 * Check conflict before acting via S4 PREVENT checkAction.
 */
router.post(
  '/check-instruction',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const { caseId, instructionText, direction } = req.body;
      const result = await checkInstructionConflict(req.user, { caseId, instructionText, direction });
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/notices (SPEC 13 S17)
 * Send blind, opaque cross-bureau notice.
 */
router.post(
  '/notices',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await sendBlindNotice(req.user, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/grants (SPEC 13 S18)
 * Create purpose-bound, time-boxed disclosure grant.
 */
router.post(
  '/grants',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await createDisclosureGrant(req.user, req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/sync/grants/verify/:docId (SPEC 13 S18)
 * Verify document disclosure grant access.
 */
router.get(
  '/grants/verify/:docId',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await verifyGrantAccess(req.user, req.params.docId);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/grants/:id/revoke (SPEC 13 S18)
 */
router.post(
  '/grants/:id/revoke',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await revokeDisclosureGrant(req.user, req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/sync/notes (SPEC 13 S24, U23)
 * Add internal note for in-scope officers only.
 */
router.post(
  '/notes',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const { caseId, text } = req.body;
      const note = await addInternalNote(req.user, caseId, text);
      res.status(201).json(note);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/sync/notes/:caseId (SPEC 13 S24, U23)
 * Get internal notes (officers only; complainants & institution admins denied).
 */
router.get(
  '/notes/:caseId',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const list = await getInternalNotes(req.user, req.params.caseId);
      res.json(list);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/sync/log (SPEC 15.1, N21)
 * Read append-only communication log.
 */
router.get(
  '/log',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const { caseId, coordinationId } = req.query;
      const log = await getCommunicationLog(req.user, { caseId, coordinationId });
      res.json(log);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
