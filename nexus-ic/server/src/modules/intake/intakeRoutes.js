import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { createDraft, submitGrievance } from '../cases/caseService.js';
import { DEMO_CATEGORIES } from './config.js';
import CategoryMaster, { getActiveCategories } from './CategoryMaster.js';
import { record as recordAudit } from '../audit/audit.js';

const router = Router();

/**
 * GET /api/v1/grievances/categories
 * Returns DEMO-CATEGORIES-v1 reference list.
 */
router.get(
  '/categories',
  authorize(),
  (req, res) => {
    res.json(DEMO_CATEGORIES);
  }
);

/**
 * POST /api/v1/grievances/draft (N13)
 *
 * Form preview before confirmation:
 * Validates fields, checks verification, runs local language detection,
 * resolves institution snapshot. Complainant can edit until confirmed.
 */
router.post(
  '/draft',
  authorize('student', 'faculty'),
  async (req, res) => {
    try {
      const { institutionPid, category, subCategory, narrative, language } = req.body;

      if (!institutionPid || !category || !subCategory || !narrative) {
        return res.status(400).json({ error: 'Missing required grievance fields' });
      }

      const draft = await createDraft({
        user: req.user,
        institutionPid,
        category,
        subCategory,
        narrative,
        language,
      });

      res.json(draft);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message, code: err.code, redirect: err.redirect });
    }
  }
);

/**
 * POST /api/v1/grievances (N13, N14, N15)
 *
 * Submits a verified grievance and creates an atomic Master Case ID.
 */
router.post(
  '/',
  authorize('student', 'faculty'),
  async (req, res) => {
    try {
      const {
        institutionPid,
        category,
        subCategory,
        narrative,
        language,
        externalRefs,
        documentIds,
      } = req.body;

      if (!institutionPid || !category || !subCategory || !narrative) {
        return res.status(400).json({ error: 'Missing required grievance fields' });
      }

      const caseDoc = await submitGrievance({
        user: req.user,
        institutionPid,
        category,
        subCategory,
        narrative,
        language,
        externalRefs,
        documentIds,
        // N15: the web portal records PWA only when the installed app sends its explicit standalone signal.
        channel: req.get('X-Client-Standalone') === 'true' ? 'PWA' : 'WEB',
        institutionRedressal: req.body.institutionRedressal,
      });

      res.status(201).json({
        masterCaseId: caseDoc.masterCaseId,
        status: caseDoc.status,
        institutionPid: caseDoc.institutionPid,
        languageTag: caseDoc.languageTag,
        createdAt: caseDoc.createdAt,
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message, code: err.code, redirect: err.redirect });
    }
  }
);

/**
 * Master data categories routes for system_admin:
 * - GET /api/v1/grievances/master/categories
 * - POST /api/v1/grievances/master/categories
 */
router.get(
  '/master/categories',
  authorize('system_admin', 'auditor'),
  async (req, res) => {
    try {
      const active = await getActiveCategories();
      res.json(active);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  '/master/categories',
  authorize('system_admin'),
  async (req, res) => {
    try {
      const { categories, reason } = req.body;
      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({ error: 'Reason is required for category master data edit' });
      }
      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ error: 'Categories array is required' });
      }

      const count = await CategoryMaster.countDocuments();
      const newVersion = `DEMO-CATEGORIES-v${count + 2}`;

      const created = await CategoryMaster.create({
        version: newVersion,
        categories,
        updatedReason: reason.trim(),
        updatedBy: String(req.user._id || req.user.id || req.user.username),
        synthetic: true,
      });

      await recordAudit({
        actorId: String(req.user._id || req.user.id || req.user.username),
        actorRole: req.user.role,
        action: 'masterdata.category.updated',
        targetType: 'CategoryMaster',
        targetId: newVersion,
        meta: { version: newVersion, reason: reason.trim(), categoryCount: categories.length },
      });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
