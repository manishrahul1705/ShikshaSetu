const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env.showcase'), quiet: true });
const load = relative => import(pathToFileURL(path.join(root, relative)).href);
(async () => {
  const mongoose = require('mongoose');
  const uri = process.env.SHOWCASE_URI || 'mongodb://127.0.0.1:27017/awaaz_dastak_showcase';
  if (new URL(uri).pathname !== '/awaaz_dastak_showcase') throw new Error('SHOWCASE_DATABASE_REQUIRED');
  await mongoose.connect(uri);
  const users = mongoose.connection.collection('users');
  const original = await users.findOne({ username: 'student1', synthetic: true });
  if (!original) throw new Error('SHOWCASE_STUDENT_REQUIRED');
  const fixtures = [{ username: 'student_email_check', channel: 'email', kind: 'abc', index: 1 }, { username: 'student_sms_check', channel: 'sms', kind: 'aadhaar', index: 2 }];
  for (const { username } of fixtures) await users.updateOne({ username }, { $setOnInsert: { username, passwordHash: original.passwordHash,
    role: 'student', displayName: 'Student Verification Check', active: true, synthetic: true, createdAt: new Date() } }, { upsert: true });
  const { recordAudit } = await load('server/src/modules/audit/audit.js');
  await recordAudit({ actorId: 'local-student-verification-check', actorRole: 'system_admin', action: 'identity.test_accounts_prepared', targetType: 'User', targetId: 'local-student-verification-check', meta: { count: fixtures.length } });
  await mongoose.disconnect();
  const { studentVerificationRecords } = await load('server/src/modules/identity/studentDataset.js');
  const records = studentVerificationRecords();
  const base = 'http://localhost:5180/api/v1';
  const checks = [];
  for (const fixture of fixtures) {
    const login = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: fixture.username, password: 'demo1234' }) });
    if (!login.ok) throw new Error('TEST_LOGIN_FAILED');
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    const api = async (suffix, body) => {
      const r = await fetch(base + suffix, { headers: { cookie, 'content-type': 'application/json' }, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error || 'CHECK_FAILED'); return data;
    };
    const current = await api('/identity/me');
    if (current.status === 'verified') { checks.push({ username: fixture.username, channel: fixture.channel, status: 'already_verified' }); continue; }
    const record = records[fixture.index];
    await api('/identity/student/lookup', { kind: fixture.kind, number: fixture.kind === 'aadhaar' ? record.aadhaar : record.abcId, consent: true });
    const sent = await api('/identity/student/send-otp', { channel: fixture.channel, consent: true, detailsAreMine: true });
    const delivery = await api('/identity/student/local-delivery');
    const done = await api('/identity/student/confirm-otp', { code: delivery.code });
    if (done.status !== 'verified' || done.routedTo) throw new Error('SELF_SERVICE_NOT_COMPLETED');
    checks.push({ username: fixture.username, channel: fixture.channel, kind: fixture.kind, status: done.status, selfService: done.selfService, deliveryMode: sent.deliveryMode, forwarded: false });
  }
  const report = { at: new Date().toISOString(), checks };
  fs.writeFileSync(path.join(root, 'test-results/student-api-acceptance.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
