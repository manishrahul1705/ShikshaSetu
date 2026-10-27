import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { checkAbsenceBlockers, requestLeave, returnFromLeave } from './absenceService.js';
import User from '../auth/User.js';

const router = Router();

const OFFICER_ROLES = [
  'bureau_officer',
  'regional_officer',
  'supervisor',
  'competent_authority',
  'system_admin',
];

router.get('/status', authorize(...OFFICER_ROLES), async (req, res) => {
  const own = await User.findById(req.user._id || req.user.id).select('isOnLeave leaveDetails bureau region').lean();
  const scope = ['supervisor', 'competent_authority', 'system_admin'].includes(req.user.role) ? {} : req.user.role === 'regional_officer' ? { region: req.user.region } : { bureau: req.user.bureau };
  const rows = await User.find({ active: true, isOnLeave: true, role: { $in: OFFICER_ROLES }, ...scope }).select('displayName role bureau region leaveDetails.startDate leaveDetails.endDate').lean();
  res.json({ isOnLeave: own?.isOnLeave || false, leaveDetails: own?.leaveDetails || null,
    absences: rows.map(row => ({ id: String(row._id), designation: row.displayName, office: row.bureau || row.region, startDate: row.leaveDetails?.startDate, endDate: row.leaveDetails?.endDate })) });
});

/**
 * GET /api/v1/absence/check-blockers/:officerId? (ADDITIONS.md N60)
 * Check if officer owns active cases blocking leave or reassignment.
 */
router.get(
  '/check-blockers/:officerId?',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const officerId = req.params.officerId || req.user._id;
      const result = await checkAbsenceBlockers(officerId);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/absence/leave-request (N60)
 * Request leave (refused if open cases owned).
 */
router.post(
  '/leave-request',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await requestLeave(req.user, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({
        error: err.message,
        blockingCases: err.blockingCases || [],
      });
    }
  }
);

/**
 * POST /api/v1/absence/leave-return
 */
router.post(
  '/leave-return',
  authorize(...OFFICER_ROLES),
  async (req, res) => {
    try {
      const result = await returnFromLeave(req.user);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

export default router;
