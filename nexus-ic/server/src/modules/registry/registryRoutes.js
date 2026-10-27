import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import * as RegistrySimulator from './RegistrySimulator.js';
import { getInstitutionByPid } from '../institutions/institutionService.js';
import { importOfficialCsv, officialSearch, previewOfficialImport, toRegistryResult } from './adapters.js';
import { recordAudit } from '../audit/audit.js';
import Institution from '../institutions/Institution.js';
import OfficialInstitution from './OfficialInstitution.js';

const router = Router();

router.get('/official/search', authorize(), async (req, res) => {
  const rows = await officialSearch(req.query.q || '');
  res.json({ institutions: rows.map(row => toRegistryResult(row)), source: rows[0]?.provenance || null });
});

// N100: colleges per state in the active registry sources, for map hover counts.
router.get('/state-counts', authorize(), async (req, res) => {
  const group = [{ $group: { _id: '$state', count: { $sum: 1 } } }];
  const [fictional, official] = await Promise.all([Institution.aggregate(group), OfficialInstitution.aggregate(group)]);
  const states = {};
  for (const [kind, rows] of [['fictional', fictional], ['official', official]]) {
    for (const row of rows) if (row._id) states[row._id] = { ...(states[row._id] || { fictional: 0, official: 0 }), [kind]: row.count };
  }
  res.set('Cache-Control', 'no-store').json({ states, sources: { fictional: fictional.length > 0, official: official.length > 0 } });
});

router.get('/public/institutions/by-icid/:icid', async (req, res) => {
  const rows = await officialSearch(req.params.icid);
  if (!rows.length) return res.status(404).json({ error: 'ICID_NOT_FOUND' });
  return res.json({ status: 'AVAILABLE', institution: toRegistryResult(rows[0]) });
});

router.post('/official/import/preview', authorize('system_admin'), async (req, res) => {
  const preview = await previewOfficialImport({ ...(req.body || {}), importer: req.user.username || String(req.user._id || req.user.id) });
  res.json(preview);
});

router.post('/official/import', authorize('system_admin'), async (req, res) => {
  const result = await importOfficialCsv({ ...(req.body || {}), importer: req.user.username || String(req.user._id || req.user.id) });
  if (result.written) {
    await recordAudit({
      actorId: String(req.user._id || req.user.id),
      actorRole: req.user.role,
      action: 'registry.official_import',
      targetType: 'OfficialInstitution',
      targetId: result.fileHash,
      meta: { counts: result.counts, sourceFileName: result.provenance.sourceFileName, listDate: result.provenance.listDate },
    });
  }
  res.status(result.written ? 200 : 422).json(result);
});

/**
 * GET /api/v1/registry/institutions/:pid (N10)
 *
 * Master registry lookup and auto-fetch.
 * Returns read-only profile:
 * - name, verified aliases separately (F03)
 * - state/district
 * - AICTE region (N11)
 * - institution type
 * - campus details (F02)
 * - IIC ID / ICID (N09)
 * - approval status with as-of date
 *
 * If registry is down, returns UNKNOWN with reason.
 */
router.get('/institutions/by-icid/:icid', authorize(), async (req, res) => {
  const rows = await officialSearch(req.params.icid);
  if (!rows.length) return res.status(404).json({ error: 'ICID_NOT_FOUND' });
  return res.json({ status: 'AVAILABLE', institution: toRegistryResult(rows[0]) });
});

router.get(
  '/institutions/:pid',
  authorize(),
  async (req, res) => {
    try {
      const pid = req.params.pid;
      const lookupResult = await getInstitutionByPid(pid);

      if (!lookupResult.found) {
        if (lookupResult.reason === 'REGISTRY_UNAVAILABLE') {
          return res.status(503).json({
            status: 'UNKNOWN',
            reason: 'AICTE Institution Master Registry simulator is offline',
            available: false,
          });
        }
        return res.status(404).json({ error: lookupResult.reason || 'Institution not found' });
      }

      res.json(lookupResult.institution);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/v1/registry/simulator/availability
 * Demo toggle to simulate registry being down.
 */
router.post(
  '/simulator/availability',
  authorize('system_admin'),
  (req, res) => {
    const { available } = req.body;
    RegistrySimulator.setAvailable(Boolean(available));
    res.json({ available: Boolean(available) });
  }
);

export default router;
