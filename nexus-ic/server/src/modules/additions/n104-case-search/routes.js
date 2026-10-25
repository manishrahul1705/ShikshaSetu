import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { liveUser } from '../n82-combined-request/service.js';
import { searchCases, exportSearchCsv, SEARCH_ROLES } from './service.js';
import Region from '../../institutions/Region.js';
import { getActiveCategories } from '../../intake/CategoryMaster.js';
import { LIFECYCLE_STATUSES } from '../../lifecycle/lifecycleGuards.js';
const router = Router();
router.get('/case-search.csv', authorize(...SEARCH_ROLES), async (req, res) => {
  try { const csv = await exportSearchCsv(await liveUser(req.user), req.query); res.type('text/csv').attachment('filtered-cases.csv').send(csv); }
  catch (e) { res.status(e.status || 503).json({ error: e.code || 'CASE_SEARCH_EXPORT_UNAVAILABLE' }); }
});
// The administration master endpoints restrict reads to admin/auditor. Expose
// their same reference data here without changing those endpoints' permissions.
router.get('/case-search/options', authorize(...SEARCH_ROLES), async (_req, res) => {
  try {
    const [regions, categories] = await Promise.all([Region.find().sort({ code: 1 }).select('name').lean(), getActiveCategories()]);
    res.json({ regions: regions.map(r => r.name), categories: categories.categories.map(c => c.name), statuses: [...LIFECYCLE_STATUSES, 'SUBMITTED', 'CLOSED', 'DISPOSED'] });
  } catch { res.status(503).json({ error: 'SEARCH_OPTIONS_UNAVAILABLE' }); }
});
router.get('/case-search', authorize(...SEARCH_ROLES), async (req, res) => {
  try { res.set('Cache-Control', 'no-store').json(await searchCases(await liveUser(req.user), req.query)); }
  catch (e) { res.status(e.status || 503).json({ error: e.code || 'CASE_SEARCH_UNAVAILABLE' }); }
});
export default router;
