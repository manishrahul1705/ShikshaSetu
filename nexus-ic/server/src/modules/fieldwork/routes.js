import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import {
  scheduleInspection,
  submitFieldReport,
  getVisitsForCase,
  getVisitsForRegion,
} from './fieldworkService.js';

const router = Router();

const RO_ROLES = [
  'regional_officer',
  'bureau_officer',
  'supervisor',
  'competent_authority',
  'system_admin',
];

/**
 * POST /api/v1/fieldwork/visits (N74)
 * Schedule field inspection / site verification.
 */
router.post(
  '/visits',
  authorize(...RO_ROLES),
  async (req, res) => {
    try {
      const visit = await scheduleInspection(req.user, req.body);
      res.status(201).json(visit);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/fieldwork/visits/:id/report (N74)
 * Submit field verification report with regional inputs and documents.
 */
router.post(
  '/visits/:id/report',
  authorize(...RO_ROLES),
  async (req, res) => {
    try {
      const visit = await submitFieldReport(req.user, req.params.id, req.body);
      res.json(visit);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/fieldwork/case/:caseId
 */
router.get(
  '/case/:caseId',
  authorize(...RO_ROLES),
  async (req, res) => {
    try {
      const list = await getVisitsForCase(req.user, req.params.caseId);
      res.json(list);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/fieldwork/region/:region?
 */
router.get(
  '/region/:region?',
  authorize(...RO_ROLES),
  async (req, res) => {
    try {
      const list = await getVisitsForRegion(req.user, req.params.region);
      res.json(list);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

export default router;
