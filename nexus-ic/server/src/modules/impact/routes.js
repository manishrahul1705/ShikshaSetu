import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { buildImpactReport, buildImpactCsv, IMPACT_ROLES } from './impactService.js';
import { send } from '../closure/util.js';

/** NEXUS IMPACT routes: /api/v1/impact/summary and the downloadable CSV report. */
const router = Router();

router.get('/summary', authorize(...IMPACT_ROLES), async (req, res) => {
  try {
    res.json(await buildImpactReport(req.user));
  } catch (err) {
    send(res, err);
  }
});

router.get('/report.csv', authorize(...IMPACT_ROLES), async (req, res) => {
  try {
    const { csv, code } = await buildImpactCsv(req.user);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nexus-impact-report-SYNTHETIC-${code}.csv"`);
    res.send(csv);
  } catch (err) {
    send(res, err);
  }
});

export default router;
