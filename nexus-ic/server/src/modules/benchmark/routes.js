import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import { handle } from '../channels/common.js';
import { runBenchmark, BenchmarkRun } from './service.js';
const router = Router();
router.post('/benchmark', authorize('system_admin', 'supervisor'), handle(req => runBenchmark(req.user)));
router.get('/benchmark', authorize('system_admin', 'supervisor'), handle(async () => {
  const row = await BenchmarkRun.findOne().sort({ createdAt: -1 }).lean();
  return row ? { id: String(row._id), ...row.summary } : { status: 'UNKNOWN', reason: 'NO_BENCHMARK_RUN', synthetic: true };
}));
export default router;
