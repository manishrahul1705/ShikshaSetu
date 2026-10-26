import { Router } from 'express';
import authorize from '../../../middleware/authorize.js';
import { IMPACT_ROLES } from '../../impact/impactService.js';
import { liveUser } from '../n82-combined-request/service.js';
import { quarterlyReport, statusWise } from './service.js';
import { metrics } from '../n87-monthly-report/service.js';
import { monthlyPdf } from '../n87-monthly-report/pdf.js';
import { watermarkExport } from '../n55-watermark/service.js';
const router = Router();
for (const ext of ['', '.csv', '.pdf']) router.get('/reports/quarterly' + ext, authorize(...IMPACT_ROLES), async (req, res) => {
  try {
    const user = await liveUser(req.user), report = await quarterlyReport(user, req.query);
    if (!ext) return res.set('Cache-Control', 'no-store').json(report);
    const mark = await watermarkExport(user, { kind: ext === '.pdf' ? 'QUARTERLY_PENDENCY_PDF' : 'QUARTERLY_PENDENCY_CSV', rowCount: report.rows.length, scope: report.scope });
    if (ext === '.pdf') return res.type('application/pdf').attachment(`pendency-${report.quarter}.pdf`).send(monthlyPdf(report, mark));
    const csv = values => values.map(v => `"${String(v ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`).join(',');
    res.type('text/csv').attachment(`pendency-${report.quarter}.csv`).send([
      csv(['quarter', report.quarter, 'scope', report.scope]), csv(['kind', 'name', ...metrics, 'disposal numerator', 'disposal denominator', 'disposal rate percent']),
      ...report.rows.map(r => csv([r.kind, r.name, ...metrics.map(k => r.counts[k]), r.disposalRate.numerator, r.disposalRate.denominator, r.disposalRate.value ?? 'Not available'])), csv([mark.footer + mark.invisible]),
    ].join('\r\n'));
  } catch (e) { res.status(e.status || 503).json({ error: e.code || 'QUARTERLY_REPORT_UNAVAILABLE' }); }
});
router.get('/reports/status-wise', authorize(...IMPACT_ROLES), async (req, res) => {
  try { res.json(await statusWise(await liveUser(req.user))); }
  catch (e) { res.status(e.status || 503).json({ error: e.code || 'STATUS_REPORT_UNAVAILABLE' }); }
});
export default router;
