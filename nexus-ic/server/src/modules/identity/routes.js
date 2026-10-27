import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import User from '../auth/User.js';
import { serial, fields, fail, audit } from './support.js';
import { ensureReporter, ownReporter, toOfficerView } from './reporters.js';
import { limiter } from './rateLimit.js';
import { start, issueOtp, confirmOtp, readInbox, manualQueue, decideManual } from './service.js';
import { selfCheckLookup, selfCheckConfirm, selfCheckMine } from './selfCheck.js';
import { SYNTHETIC_STUDENT_REGISTRY, SYNTHETIC_FACULTY_REGISTRY } from './simulators.js';
import * as consent from '../consent/service.js';
import * as reveal from '../vault/service.js';
import * as admin from '../sysadmin/service.js';
import { checkEligibility } from './index.js';
import { Reporter } from './models.js';
const router = Router();
const officers = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];
// Every route has authorize() on its own layer for S0's route walker.
const handle = (allowed, work) => async (req, res) => {
  try {
    fields(req.body || {}, allowed);
    const result = await serial(async () => {
      // S0 sessions contain role snapshots. Check the current account too.
      const live = await User.findById(req.user.id);
      if (!live || !live.active || live.role !== req.user.role) throw fail(403, 'SESSION_REVOKED');
      return work(req);
    });
    res.set('Cache-Control', 'no-store').json(result);
  } catch (err) {
    if (req.path.startsWith('/identity/reveal-requests') && req.user) {
      try { await serial(() => audit(req.user, 'identity.reveal.denied', 'reveal', 'access')); }
      catch (_) { return res.status(503).json({ error: 'AUDIT_UNAVAILABLE' }); }
    }
    const status = err.status || (err.name === 'ValidationError' || err.name === 'StrictModeError' ? 400 : 500);
    // Never forward DB/crypto messages to S0's logger or to the response.
    res.status(status).json({ error: err.code && typeof err.code === 'string' ? err.code : 'IDENTITY_OPERATION_FAILED' });
  }
};
const revealAuth = () => [async (req, res, next) => {
  const user = req.session?.user;
  if (user && !officers.includes(user.role)) {
    try { await serial(() => audit(user, 'identity.reveal.denied', 'reveal', 'access')); }
    catch (_) { return res.status(503).json({ error: 'AUDIT_UNAVAILABLE' }); }
  }
  next();
}, authorize(...officers)];
const verificationFields = ['userType', 'reference', 'consent', 'subtype', 'manual', 'deviceId', 'institutionPid', 'apaarId', 'abcId', 'staffId'];
for (const type of ['student', 'faculty', 'authorized_user', 'other_stakeholder']) {
  router.post(`/auth/verify/${type}`, authorize(), limiter('verification'), handle(verificationFields, (req) => {
    if (req.body.userType !== type) throw fail(400, 'USER_TYPE_MISMATCH');
    return start(req.user, req.body);
  }));
}
router.get('/identity/me', authorize(), handle([], async (req) => {
  const row = await Reporter.findOne({ userId: req.user.id });
  if (!row) return { status: 'unverified', eligibility: { result: 'POLICY_NOT_CONFIGURED' } };
  return { ...toOfficerView(row), eligibility: await checkEligibility(row.pseudonymousReporterId, {}) };
}));
// N99 self-service check (simulated). Added beside the existing OTP and officer paths.
const selfCheckFields = ['kind', 'number', 'consent', 'institutionPid', 'detailsAreMine'];
router.post('/identity/self-check/lookup', authorize('student'), limiter('verification'), handle(selfCheckFields, (req) => selfCheckLookup(req.user, req.body)));
router.post('/identity/self-check/confirm', authorize('student'), limiter('verification'), handle(selfCheckFields, (req) => selfCheckConfirm(req.user, req.body)));
router.get('/identity/self-check/me', authorize('student'), handle([], (req) => selfCheckMine(req.user)));
router.post('/identity/otp', authorize(), limiter('otp'), handle(['consent'], (req) => issueOtp(req.user, req.body.consent)));
router.post('/identity/otp/confirm', authorize(), limiter('otp'), handle(['code'], (req) => confirmOtp(req.user, req.body.code)));
router.get('/dev/otp-inbox', authorize(), handle([], (req) => readInbox(req.user)));
router.post('/consents', authorize(), handle(['userType', 'purpose'], async (req) => {
  // 'retaliation_watch' is the N51 opt-in; the watch runs only while this consent is active.
  if (!['verification', 'otp', 'manual_verification', 'retaliation_watch'].includes(req.body.purpose)) throw fail(400, 'INVALID_PURPOSE');
  const row = await ensureReporter(req.user, req.body.userType);
  return consent.grant(req.user, row, req.body.purpose);
}));
router.get('/consents', authorize(), handle([], async (req) => {
  const row = await Reporter.findOne({ userId: req.user.id });
  return row ? consent.list(row.pseudonymousReporterId) : [];
}));
router.post('/consents/:id/withdraw', authorize(), handle([], async (req) => consent.withdraw(req.user, (await ownReporter(req.user)).pseudonymousReporterId, req.params.id)));
router.get('/identity/simulated-registry', authorize(), handle([], () => ({
  students: SYNTHETIC_STUDENT_REGISTRY.map(r => ({ id: r.id, display: r.display, name: r.name, pid: r.pid, status: r.status })),
  faculty: SYNTHETIC_FACULTY_REGISTRY.map(r => ({ id: r.id, name: r.name, pid: r.pid, status: r.status }))
})));
router.get('/identity/manual-verification', authorize('bureau_officer', 'regional_officer'), handle([], () => manualQueue()));
router.post('/identity/manual-verification/:reporterId/decide', authorize('bureau_officer', 'regional_officer'), limiter('verification'), handle(['decision', 'reason'], (req) => decideManual(req.user, req.params.reporterId, req.body.decision, req.body.reason)));
router.post('/identity/reveal-requests', ...revealAuth(), limiter('verification'), handle(['reporterId', 'purpose'], (req) => reveal.requestReveal(req.user, req.body.reporterId, req.body.purpose)));
router.get('/identity/reveal-requests', ...revealAuth(), handle([], (req) => reveal.listReveals(req.user)));
router.post('/identity/reveal-requests/:id/approve', ...revealAuth(), handle([], (req) => reveal.approveReveal(req.user, req.params.id)));
router.get('/identity/reveal-requests/:id/view', ...revealAuth(), handle([], (req) => reveal.viewReveal(req.user, req.params.id)));
router.get('/sysadmin/accounts', authorize('system_admin'), handle([], () => admin.accounts()));
router.post('/sysadmin/accounts', authorize('system_admin'), handle(['role'], (req) => admin.createAccount(req.user, req.body)));
router.patch('/sysadmin/accounts/:id', authorize('system_admin'), handle(['role', 'active'], (req) => admin.updateAccount(req.user, req.params.id, req.body)));
router.get('/sysadmin/system', authorize('system_admin'), handle([], () => admin.systemView()));
router.post('/sysadmin/backup', authorize('system_admin'), handle([], (req) => admin.backup(req.user)));
export default router;
