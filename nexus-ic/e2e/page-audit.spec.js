const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const { installPrivacyGuard } = require('./privacy.cjs');
const BASE = 'http://127.0.0.1:5327';
const roles = [
  ['student', 'trust_student_verified'], ['faculty', 'trust_faculty_verified'], ['institution_admin', 'inst_admin1'],
  ['bureau_officer', 'rb_officer1'], ['regional_officer', 'regional1'], ['supervisor', 'supervisor1'],
  ['competent_authority', 'authority1'], ['auditor', 'auditor1'], ['system_admin', 'sysadmin1'],
];
// Exact route metadata is exported from the checked-in route modules by the
// inventory script. No fabricated route/role matrix or API bypass is used.
const inventoryFile = path.resolve('docs/screenshots/audit/route-inventory.json');
test.beforeAll(async ({ playwright }) => {
  // Exercise the real inbound adapter with existing fictional sender bindings.
  // Idempotent, local-only fixture setup; no mailbox delivery or database reset.
  const admin = await playwright.request.newContext({ baseURL: BASE });
  try {
    const login = await admin.post('/api/v1/auth/login', { data: { username: 'sysadmin1', password: 'demo1234' }, headers: { Origin: BASE } });
    expect(login.ok()).toBe(true);
    for (const name of ['trust_student_verified', 'trust_faculty_verified']) {
      const response = await admin.post('/api/v1/channels/email/inbound', { headers: { Origin: BASE }, data: {
        sender: `${name}@synthetic.invalid`, institutionPid: '1-7734299133', category: 'Fee Dispute', subCategory: 'Refund Denial',
        narrative: 'The refundable laboratory deposit remains unpaid after a written request. Please review the receipt and refund record.'
      } });
      expect(response.ok()).toBe(true);
      expect((await response.json()).id).toBeTruthy();
    }
  } finally { await admin.dispose(); }
});
for (const [role, username] of roles) test(`[JURY-PAGE] ${role}: every allowed page has timely, readable content`, async ({ browser }, info) => {
  const routes = JSON.parse(await fs.readFile(inventoryFile, 'utf8'));
  const directory = path.resolve('docs/screenshots/audit', info.project.name, role);
  await fs.mkdir(directory, { recursive: true });
  const context = await browser.newContext({ baseURL: BASE, ...info.project.use });
  await context.addInitScript(installPrivacyGuard);
  const page = await context.newPage(), records = [], failures = [];
  const pendingApi = new Set();
  page.on('request', request => { if (request.url().includes('/api/v1/')) pendingApi.add(request); });
  page.on('requestfailed', request => pendingApi.delete(request));
  let consoleErrors = [], apiTimes = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 160)); });
  page.on('pageerror', error => consoleErrors.push(error.message.slice(0, 160)));
  page.on('requestfinished', async request => {
    pendingApi.delete(request);
    if (!/\/api\/v1\/(impact\/summary|prevent\/overlaps)/.test(request.url())) return;
    const timing = request.timing(); apiTimes.push({ path: new URL(request.url()).pathname, ms: timing.responseEnd });
  });
  async function api(endpoint) {
    const response = await context.request.get('/api/v1' + endpoint);
    if (!response.ok()) return null;
    return response.json();
  }
  try {
    const login = await context.request.post('/api/v1/auth/login', { data: { username, password: 'demo1234' }, headers: { Origin: BASE } });
    expect(login.ok()).toBe(true);
    const tour = await api('/judge/tour');
    expect(tour?.scenario?.institutionPid).toBe('1-7734299133');
    let cases;
    if (['student', 'faculty'].includes(role)) cases = await api('/track');
    else if (role === 'institution_admin') cases = (await api('/institution-workspace/cases'))?.cases;
    else if (['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'].includes(role)) cases = (await api('/workspace/queue'))?.cases;
    else cases = (await api('/impact/cases?row=tile:totalComplaints'))?.cases;
    const chosen = cases?.find(row => row.category === 'Fee Dispute' && row.status === 'Under Process') || cases?.[0];
    const caseId = chosen?.masterCaseId || tour.scenario.cases.find(row => row.bureau === 'Regulation Bureau')?.masterCaseId;
    let pid = chosen?.institutionPid || tour.scenario.institutionPid;
    if (chosen && ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'].includes(role)) pid = (await api(`/cases/${caseId}/journey`))?.institution?.pid || pid;
    const drafts = ['student', 'faculty'].includes(role) ? await api('/channels/email') : [];
    const paths = [...new Set(['/', '/login', '/dashboard', ...routes.filter(route => !route.roles || route.roles.includes(role)).map(route => route.path)])];
    for (const route of paths) {
      consoleErrors = []; apiTimes = [];
      const isDraft = /email.*:id/.test(route);
      const draftId = drafts?.[0]?.id;
      const target = route.replace(/:institutionPid|:pid/g, pid).replace(/:caseId/g, caseId || 'missing-case').replace(/:id/g, isDraft ? (draftId || 'missing-draft') : pid);
      const errors = [], started = Date.now();
      if (isDraft && !draftId) errors.push('Missing verified email draft fixture');
      try {
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => {
          const main = document.querySelector('main') || document.querySelector('#root');
          return main && main.innerText.trim().length > 40 && !/^(loading|fetching|please wait)[^\n]*[.…]*$/im.test(main.innerText) && !main.querySelector('.animate-pulse,.skeleton');
        }, null, { timeout: Math.max(1, 3000 - (Date.now() - started)) });
        await expect.poll(() => pendingApi.size, { intervals: [25, 50], timeout: Math.max(1, 3000 - (Date.now() - started)) }).toBe(0);
      } catch { errors.push('Content not ready within 3000 ms'); }
      const readyMs = Date.now() - started;
      const readiness = await page.evaluate(() => {
        const main=document.querySelector('main')||document.querySelector('#root');
        return {characters:main?.innerText.trim().length||0,loadingLines:main?.innerText.match(/^(loading|fetching|please wait)[^\n]*[.…]*$/igm)||[],skeletons:main?.querySelectorAll('.animate-pulse,.skeleton').length||0};
      });
      if(errors.length) errors.push(`Readiness: ${JSON.stringify(readiness)}; pending API paths: ${[...pendingApi].map(request=>new URL(request.url()).pathname).join(', ') || 'none'}`);
      const text = await page.locator('body').innerText();
      const banned = [...new Set(text.match(/synthetic|demo|fake|sample|simulator|POLICY_NOT_CONFIGURED|NO_BENCHMARK_RUN|_comment/ig) || [])];
      if (banned.length) errors.push('Banned visible wording: ' + banned.join(', '));
      if (/access denied/i.test(text)) errors.push('Access denied on an allowed route');
      if (readyMs > 3000) errors.push(`Content deadline exceeded: ${readyMs} ms`);
      const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      const expectedWidth=info.project.use.viewport.width;
      if (layout.scrollWidth > expectedWidth + 1 || layout.width > expectedWidth + 1) errors.push(`Horizontal overflow: ${layout.scrollWidth}/${expectedWidth}`);
      const sidebarLinks = await page.locator('aside[aria-label="Main navigation"] nav a').evaluateAll(links => links.map(link => link.getAttribute('href')));
      for (const link of sidebarLinks) {
        if (link === '/dashboard') continue;
        if (!routes.some(item => item.path === link && (!item.roles || item.roles.includes(role)))) errors.push(`Forbidden sidebar link ${link}`);
      }
      if (consoleErrors.length) errors.push(...consoleErrors.map(message => 'Console: ' + message));
      const filename = route === '/' ? 'landing' : route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
      await page.screenshot({ path: path.join(directory, filename + '.png'), fullPage: true, maskColor: '#cbd5e1', mask: [page.locator('input:not([data-jury-public]),textarea,[data-jury-private]')] });
      const record = { role, route, target, readyMs, readiness, layout, errors, apiTimes, screenshot: `${info.project.name}/${role}/${filename}.png` };
      records.push(record); failures.push(...errors.map(error => `${route}: ${error}`));
      await fs.writeFile(path.join(directory, 'evidence.json'), JSON.stringify({ browser: browser.version(), database: 'awaaz_dastak_showcase', recordedAt: new Date().toISOString(), records }, null, 2));
      console.log(`${info.project.name} ${role} ${route}: ${errors.length ? 'FAIL' : 'PASS'} ${readyMs}ms`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  } finally { await context.close(); }
});
