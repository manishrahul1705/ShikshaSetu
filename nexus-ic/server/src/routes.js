import { Router } from 'express';
import authRoutes from './modules/auth/authRoutes.js';
import auditRoutes from './modules/audit/auditRoutes.js';
import userRoutes from './modules/users/userRoutes.js';
import authorize from './middleware/authorize.js';

const router = Router();

/**
 * Health check — public, no auth required.
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'ShikshaSetu', subtitle: 'Connecting Institutions. Coordinating Action. Resolving Grievances.' });
});

/**
 * App mode — public, used by client to determine banner/button visibility.
 */
router.get('/config/mode', (req, res) => {
  res.json({ mode: process.env.APP_MODE || 'demo' });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/audit', auditRoutes);
router.use('/users', userRoutes);

export default router;

router.use((await import('./modules/identity/routes.js')).default);
router.use('/registry', (await import('./modules/registry/registryRoutes.js')).default);
router.use('/institutions', (await import('./modules/institutions/institutionRoutes.js')).default);
router.use('/grievances', (await import('./modules/intake/intakeRoutes.js')).default);
router.use((await import('./modules/lifecycle/routes.js')).default);
router.use('/cases', (await import('./modules/cases/caseRoutes.js')).default);
router.use((await import('./modules/casejourney/routes.js')).default);
router.use('/documents', (await import('./modules/documents/documentRoutes.js')).default);
router.use('/rulebook', (await import('./modules/rulebook/routes.js')).default);
router.use('/routing', (await import('./modules/routing/routes.js')).default);
router.use('/priority', (await import('./modules/priority/routes.js')).default);
router.use('/bureaus', (await import('./modules/bureaus/routes.js')).default);

router.use((await import('./modules/prevent/routes.js')).default);

router.use((await import('./modules/channels/routes.js')).default);
router.use((await import('./modules/additions/n57-integrity/routes.js')).default);
router.use((await import('./modules/benchmark/routes.js')).default);

router.use('/transfers', (await import('./modules/trace/routes.js')).default);
router.use('/sync', (await import('./modules/sync/routes.js')).default);
router.use('/queries', (await import('./modules/queries/routes.js')).default);
router.use('/actions', (await import('./modules/actions/routes.js')).default);
router.use('/fieldwork', (await import('./modules/fieldwork/routes.js')).default);
router.use('/insider', (await import('./modules/insider/routes.js')).default);
router.use('/absence', (await import('./modules/absence/routes.js')).default);

// S5 Closure and recovery (NEXUS PROOF, feedback, appeals, RESCUE, IMPACT, workspaces, N51/N55/N62/N63)
router.use((await import('./modules/closure/routes.js')).default);
router.use((await import('./modules/feedback/routes.js')).default);
router.use((await import('./modules/appeals/routes.js')).default);
router.use('/rescue', (await import('./modules/rescue/routes.js')).default);
router.use('/impact', (await import('./modules/impact/routes.js')).default);
router.use((await import('./modules/additions/n63-receipt/routes.js')).default);
router.use('/track', (await import('./modules/track/routes.js')).default);
router.use('/institution-workspace', (await import('./modules/institutionview/routes.js')).default);
router.use('/authority', (await import('./modules/authority/routes.js')).default);
router.use((await import('./modules/additions/n51-retaliation-watch/routes.js')).default);
router.use((await import('./modules/additions/n55-watermark/routes.js')).default);
router.use((await import('./modules/additions/n62-redaction/routes.js')).default);

// S6b differentiators (N46 Judge Mode, N47 drill-down, N50 overlap timeline, N61 patterns, graph and radar)
router.use((await import('./modules/additions/n46-judge-mode/routes.js')).default);
router.use((await import('./modules/additions/n47-drilldown/routes.js')).default);
router.use((await import('./modules/additions/n50-overlap-timeline/routes.js')).default);
router.use((await import('./modules/additions/n84-compare/routes.js')).default);
router.use((await import('./modules/additions/n85-problem-coverage/routes.js')).default);
router.use((await import('./modules/additions/n61-patterns/routes.js')).default);
router.use('/graph', (await import('./modules/graph/routes.js')).default);

// S7 release fix: SPEC 12.1 workspaces (queue, audit trail, notification centre)
router.use((await import('./modules/workspaces/routes.js')).default);

// S7 scale: extra indexes on audit and PREVENT collections
(await import('./modules/performance/indexes.js')).ensureExtraIndexes();
router.use((await import('./modules/additions/n82-combined-request/routes.js')).default);
router.use((await import('./modules/additions/n83-document-locker/routes.js')).default);
router.use((await import('./modules/additions/n87-monthly-report/routes.js')).default);
router.use((await import('./modules/additions/n89-workload/routes.js')).default);
router.use((await import('./modules/additions/n88-first-redressal/routes.js')).default);
router.use((await import('./modules/additions/n103-coordination/routes.js')).default);
router.use((await import('./modules/additions/n104-case-search/routes.js')).default);
router.use((await import('./modules/additions/n106-case-summary/routes.js')).default);
