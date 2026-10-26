import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { IMPACT_ROLES } from '../../impact/impactService.js';
import { monthlyReport, metrics } from './service.js';
import { handle } from '../n82-combined-request/routes.js';
import { liveUser } from '../n82-combined-request/service.js';
import { watermarkExport } from '../n55-watermark/service.js';
import { monthlyPdf } from './pdf.js';
import { withDisposalRates } from '../n107-quarterly-reports/service.js';
const router = Router();
router.get('/reports/monthly.pdf', authorize(...IMPACT_ROLES), async (req, res) => {
  try {
    const user = await liveUser(req.user), report = await monthlyReport(user, req.query);
    const mark = await watermarkExport(user, { kind: 'MONTHLY_PENDENCY_PDF', rowCount: report.rows.length, scope: report.scope });
    res.type('application/pdf').attachment(`pendency-${report.month}.pdf`).send(monthlyPdf(report, mark));
  } catch (e) { res.status(e.status || 503).json({ error: e.code || 'REPORT_UNAVAILABLE' }); }
});
router.get('/reports/monthly', authorize(...IMPACT_ROLES), handle(async r => withDisposalRates(await monthlyReport(r.user, r.query))));
router.get('/reports/monthly.csv', authorize(...IMPACT_ROLES), async (req, res) => {
  try { const user = await liveUser(req.user), report = await monthlyReport(user, req.query); const mark = await watermarkExport(user, { kind: 'MONTHLY_PENDENCY_CSV', rowCount: report.rows.length, scope: report.scope });
    const csv = values => values.map(v => `"${String(v ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`).join(',');
    res.type('text/csv').attachment(`pendency-${report.month}.csv`).send([csv(['month', report.month, 'scope', report.scope]), csv(['scoped cases', report.denominator, 'incomplete historical evidence', report.incompleteHistoryCases]), csv(['kind', 'name', ...metrics, 'difference', 'reconciled']), ...report.rows.map(r => csv([r.kind, r.name, ...metrics.map(m => r.counts[m]), r.difference, r.reconciles])), csv([mark.footer + mark.invisible])].join('\r\n'));
  } catch(e) { res.status(e.status || 503).json({ error: e.code || 'REPORT_UNAVAILABLE' }); }
});
export default router;
