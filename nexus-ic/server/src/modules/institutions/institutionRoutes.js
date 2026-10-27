import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import {
  getInstitutionByPid,
  getPidByIcid,
  getInstitution360,
  reclassifyRegion,
} from './institutionService.js';
import Institution from './Institution.js';
import Region, { seedRegions } from './Region.js';
import IdentityReview from './IdentityReview.js';
import { record as recordAudit } from '../audit/audit.js';
import { searchInstitutions } from '../registry/search.js';

const router = Router();

router.get('/public-search', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store').json(await searchInstitutions(req.query));
  } catch (error) {
    res.status(error.status || 503).json({ error: error.status === 400 ? 'INVALID_QUERY' : 'INSTITUTION_SEARCH_UNAVAILABLE' });
  }
});

router.get('/search', authorize(), async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store').json(await searchInstitutions(req.query));
  } catch (error) {
    res.status(error.status || 503).json({ error: error.status === 400 ? 'INVALID_QUERY' : 'INSTITUTION_SEARCH_UNAVAILABLE' });
  }
});

router.get('/public/:pid', async (req, res) => {
  try {
    const result = await getInstitutionByPid(req.params.pid);
    if (!result.found) return res.status(404).json({ error: result.reason || 'Institution not found' });
    res.set('Cache-Control', 'no-store').json(result.institution);
  } catch (error) {
    res.status(error.status || 503).json({ error: 'INSTITUTION_LOOKUP_UNAVAILABLE' });
  }
});

/**
 * GET /api/v1/institutions (N09 touchpoint 4, 8, R32)
 *
 * Query params:
 * - ?icid= : Resolves ICID to PID and returns institution profile.
 * - ?pid= : Exact lookup by PID.
 */
router.get(
  '/',
  authorize(),
  async (req, res) => {
    try {
      const { icid, pid } = req.query;

      if (icid) {
        const result = await getPidByIcid(icid);
        if (!result.found) {
          return res.status(404).json({ error: result.reason || 'ICID not mapped to any PID' });
        }
        return res.json(result.institution);
      }

      if (pid) {
        const result = await getInstitutionByPid(pid);
        if (!result.found) {
          return res.status(404).json({ error: result.reason || 'Institution not found' });
        }
        return res.json(result.institution);
      }

      // If user is regional officer, scope list to their delegated region (R50)
      const filter = {};
      if (req.user.role === 'regional_officer' && req.user.region) {
        filter.region = req.user.region;
      }

      const list = await Institution.find(filter).limit(50).lean();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/institutions/:pid/360 (N12, F04)
 *
 * Institution 360 composite view.
 */
router.get(
  '/:pid/360',
  authorize(),
  async (req, res) => {
    try {
      const pid = req.params.pid;
      const result = await getInstitution360(pid, req.user);
      if (!result.found) {
        return res.status(404).json({ error: result.reason || 'Institution not found' });
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/institutions/:pid/reclassify (N11)
 *
 * Reclassify region with reviewer reason, audited.
 */
router.post(
  '/:pid/reclassify',
  authorize('supervisor', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const pid = req.params.pid;
      const { newRegion, reason } = req.body;

      const inst = await reclassifyRegion({
        pid,
        newRegion,
        reviewerId: req.user._id || req.user.id || req.user.username,
        reviewerRole: req.user.role,
        reason,
      });

      res.json(inst);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/v1/institutions/identity-reviews (N09 touchpoint 3, F02)
 *
 * Identity-review queue for supervisor and regional_officer.
 */
router.get(
  '/identity-reviews',
  authorize('supervisor', 'regional_officer', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const reviews = await IdentityReview.find().sort({ createdAt: -1 }).lean();
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/institutions/identity-reviews/:id/resolve
 *
 * Resolve identity conflict with required reason, audited.
 */
router.post(
  '/identity-reviews/:id/resolve',
  authorize('supervisor', 'regional_officer', 'competent_authority', 'system_admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { resolution, reason } = req.body;

      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({ error: 'Resolution reason is required' });
      }

      const review = await IdentityReview.findById(id);
      if (!review) {
        return res.status(404).json({ error: 'Review item not found' });
      }

      review.status = 'RESOLVED';
      review.resolution = resolution || 'Confirmed PID as authoritative key';
      review.resolutionReason = reason.trim();
      review.resolvedBy = String(req.user._id || req.user.id || req.user.username);
      review.resolvedRole = req.user.role;
      review.resolvedAt = new Date();
      await review.save();

      await recordAudit({
        actorId: String(req.user._id || req.user.id || req.user.username),
        actorRole: req.user.role,
        action: 'institution.identity_review.resolved',
        targetType: 'IdentityReview',
        targetId: String(review._id),
        meta: {
          pid: review.pid,
          conflictType: review.conflictType,
          resolutionReason: reason.trim(),
        },
      });

      res.json(review);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Master data routes for system_admin:
 * - GET /api/v1/institutions/master/regions
 * - POST /api/v1/institutions/master/regions
 * - GET /api/v1/institutions/master/institutions
 * - PATCH /api/v1/institutions/master/institutions/:pid
 */
router.get(
  '/master/regions',
  authorize('system_admin', 'auditor'),
  async (req, res) => {
    try {
      await seedRegions();
      const list = await Region.find().sort({ code: 1 }).lean();
      res.json({
        version: 'DEMO-REGIONS-v1',
        synthetic: true,
        label: 'DEMO — replace with AICTE official list in production',
        regions: list,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  '/master/regions',
  authorize('system_admin'),
  async (req, res) => {
    try {
      const { code, name, states, reason } = req.body;
      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({ error: 'Reason is required for versioned master data edit' });
      }

      const region = await Region.findOneAndUpdate(
        { code },
        { name, states, version: 'DEMO-REGIONS-v1-edit', synthetic: true },
        { new: true, upsert: true }
      );

      await recordAudit({
        actorId: String(req.user._id || req.user.id || req.user.username),
        actorRole: req.user.role,
        action: 'masterdata.region.updated',
        targetType: 'Region',
        targetId: code,
        meta: { code, reason: reason.trim() },
      });

      res.json(region);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get(
  '/master/institutions',
  authorize('system_admin', 'auditor'),
  async (req, res) => {
    try {
      const list = await Institution.find().limit(100).lean();
      res.json({
        version: 'DEMO-INSTITUTIONS-v1',
        synthetic: true,
        label: 'DEMO — synthetic institution registry',
        institutions: list,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.patch(
  '/master/institutions/:pid',
  authorize('system_admin'),
  async (req, res) => {
    try {
      const { pid } = req.params;
      const { name, region, reason } = req.body;
      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({ error: 'Reason is required for master data update' });
      }

      const inst = await Institution.findOneAndUpdate(
        { pid },
        { ...(name ? { name } : {}), ...(region ? { region } : {}) },
        { new: true }
      );

      await recordAudit({
        actorId: String(req.user._id || req.user.id || req.user.username),
        actorRole: req.user.role,
        action: 'masterdata.institution.updated',
        targetType: 'Institution',
        targetId: pid,
        meta: { pid, reason: reason.trim() },
      });

      res.json(inst);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
