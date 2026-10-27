# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: page-audit.spec.js >> [JURY-PAGE] faculty: every allowed page has timely, readable content
- Location: e2e\page-audit.spec.js:31:39

# Error details

```
Error: /institutions/:id: Content not ready within 3000 ms
/institutions/:id: Readiness: {"characters":41,"loadingLines":["Loading Institution 360 composite view..."],"skeletons":0}; pending API paths: /api/v1/config/mode, /api/v1/institutions/1-7734299133/360
/institutions/:id: Content deadline exceeded: 3238 ms

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 5

- Array []
+ Array [
+   "/institutions/:id: Content not ready within 3000 ms",
+   "/institutions/:id: Readiness: {\"characters\":41,\"loadingLines\":[\"Loading Institution 360 composite view...\"],\"skeletons\":0}; pending API paths: /api/v1/config/mode, /api/v1/institutions/1-7734299133/360",
+   "/institutions/:id: Content deadline exceeded: 3238 ms",
+ ]
```

# Test source

```ts
  12  | // inventory script. No fabricated route/role matrix or API bypass is used.
  13  | const inventoryFile = path.resolve('docs/screenshots/audit/route-inventory.json');
  14  | test.beforeAll(async ({ playwright }) => {
  15  |   // Exercise the real inbound adapter with existing fictional sender bindings.
  16  |   // Idempotent, local-only fixture setup; no mailbox delivery or database reset.
  17  |   const admin = await playwright.request.newContext({ baseURL: BASE });
  18  |   try {
  19  |     const login = await admin.post('/api/v1/auth/login', { data: { username: 'sysadmin1', password: 'demo1234' }, headers: { Origin: BASE } });
  20  |     expect(login.ok()).toBe(true);
  21  |     for (const name of ['trust_student_verified', 'trust_faculty_verified']) {
  22  |       const response = await admin.post('/api/v1/channels/email/inbound', { headers: { Origin: BASE }, data: {
  23  |         sender: `${name}@synthetic.invalid`, institutionPid: '1-7734299133', category: 'Fee Dispute', subCategory: 'Refund Denial',
  24  |         narrative: 'The refundable laboratory deposit remains unpaid after a written request. Please review the receipt and refund record.'
  25  |       } });
  26  |       expect(response.ok()).toBe(true);
  27  |       expect((await response.json()).id).toBeTruthy();
  28  |     }
  29  |   } finally { await admin.dispose(); }
  30  | });
  31  | for (const [role, username] of roles) test(`[JURY-PAGE] ${role}: every allowed page has timely, readable content`, async ({ browser }, info) => {
  32  |   const routes = JSON.parse(await fs.readFile(inventoryFile, 'utf8'));
  33  |   const directory = path.resolve('docs/screenshots/audit', info.project.name, role);
  34  |   await fs.mkdir(directory, { recursive: true });
  35  |   const context = await browser.newContext({ baseURL: BASE, ...info.project.use });
  36  |   await context.addInitScript(installPrivacyGuard);
  37  |   const page = await context.newPage(), records = [], failures = [];
  38  |   const pendingApi = new Set();
  39  |   page.on('request', request => { if (request.url().includes('/api/v1/')) pendingApi.add(request); });
  40  |   page.on('requestfailed', request => pendingApi.delete(request));
  41  |   let consoleErrors = [], apiTimes = [];
  42  |   page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 160)); });
  43  |   page.on('pageerror', error => consoleErrors.push(error.message.slice(0, 160)));
  44  |   page.on('requestfinished', async request => {
  45  |     pendingApi.delete(request);
  46  |     if (!/\/api\/v1\/(impact\/summary|prevent\/overlaps)/.test(request.url())) return;
  47  |     const timing = request.timing(); apiTimes.push({ path: new URL(request.url()).pathname, ms: timing.responseEnd });
  48  |   });
  49  |   async function api(endpoint) {
  50  |     const response = await context.request.get('/api/v1' + endpoint);
  51  |     if (!response.ok()) return null;
  52  |     return response.json();
  53  |   }
  54  |   try {
  55  |     const login = await context.request.post('/api/v1/auth/login', { data: { username, password: 'demo1234' }, headers: { Origin: BASE } });
  56  |     expect(login.ok()).toBe(true);
  57  |     const tour = await api('/judge/tour');
  58  |     expect(tour?.scenario?.institutionPid).toBe('1-7734299133');
  59  |     let cases;
  60  |     if (['student', 'faculty'].includes(role)) cases = await api('/track');
  61  |     else if (role === 'institution_admin') cases = (await api('/institution-workspace/cases'))?.cases;
  62  |     else if (['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'].includes(role)) cases = (await api('/workspace/queue'))?.cases;
  63  |     else cases = (await api('/impact/cases?row=tile:totalComplaints'))?.cases;
  64  |     const chosen = cases?.find(row => row.category === 'Fee Dispute' && row.status === 'Under Process') || cases?.[0];
  65  |     const caseId = chosen?.masterCaseId || tour.scenario.cases.find(row => row.bureau === 'Regulation Bureau')?.masterCaseId;
  66  |     let pid = chosen?.institutionPid || tour.scenario.institutionPid;
  67  |     if (chosen && ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'].includes(role)) pid = (await api(`/cases/${caseId}/journey`))?.institution?.pid || pid;
  68  |     const drafts = ['student', 'faculty'].includes(role) ? await api('/channels/email') : [];
  69  |     const paths = [...new Set(['/', '/login', '/dashboard', ...routes.filter(route => !route.roles || route.roles.includes(role)).map(route => route.path)])];
  70  |     for (const route of paths) {
  71  |       consoleErrors = []; apiTimes = [];
  72  |       const isDraft = /email.*:id/.test(route);
  73  |       const draftId = drafts?.[0]?.id;
  74  |       const target = route.replace(/:institutionPid|:pid/g, pid).replace(/:caseId/g, caseId || 'missing-case').replace(/:id/g, isDraft ? (draftId || 'missing-draft') : pid);
  75  |       const errors = [], started = Date.now();
  76  |       if (isDraft && !draftId) errors.push('Missing verified email draft fixture');
  77  |       try {
  78  |         await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
  79  |         await page.waitForFunction(() => {
  80  |           const main = document.querySelector('main') || document.querySelector('#root');
  81  |           return main && main.innerText.trim().length > 40 && !/^(loading|fetching|please wait)[^\n]*[.…]*$/im.test(main.innerText) && !main.querySelector('.animate-pulse,.skeleton');
  82  |         }, null, { timeout: Math.max(1, 3000 - (Date.now() - started)) });
  83  |         await expect.poll(() => pendingApi.size, { intervals: [25, 50], timeout: Math.max(1, 3000 - (Date.now() - started)) }).toBe(0);
  84  |       } catch { errors.push('Content not ready within 3000 ms'); }
  85  |       const readyMs = Date.now() - started;
  86  |       const readiness = await page.evaluate(() => {
  87  |         const main=document.querySelector('main')||document.querySelector('#root');
  88  |         return {characters:main?.innerText.trim().length||0,loadingLines:main?.innerText.match(/^(loading|fetching|please wait)[^\n]*[.…]*$/igm)||[],skeletons:main?.querySelectorAll('.animate-pulse,.skeleton').length||0};
  89  |       });
  90  |       if(errors.length) errors.push(`Readiness: ${JSON.stringify(readiness)}; pending API paths: ${[...pendingApi].map(request=>new URL(request.url()).pathname).join(', ') || 'none'}`);
  91  |       const text = await page.locator('body').innerText();
  92  |       const banned = [...new Set(text.match(/synthetic|demo|fake|sample|simulator|POLICY_NOT_CONFIGURED|NO_BENCHMARK_RUN|_comment/ig) || [])];
  93  |       if (banned.length) errors.push('Banned visible wording: ' + banned.join(', '));
  94  |       if (/access denied/i.test(text)) errors.push('Access denied on an allowed route');
  95  |       if (readyMs > 3000) errors.push(`Content deadline exceeded: ${readyMs} ms`);
  96  |       const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  97  |       const expectedWidth=info.project.use.viewport.width;
  98  |       if (layout.scrollWidth > expectedWidth + 1 || layout.width > expectedWidth + 1) errors.push(`Horizontal overflow: ${layout.scrollWidth}/${expectedWidth}`);
  99  |       const sidebarLinks = await page.locator('aside[aria-label="Main navigation"] nav a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  100 |       for (const link of sidebarLinks) {
  101 |         if (link === '/dashboard') continue;
  102 |         if (!routes.some(item => item.path === link && (!item.roles || item.roles.includes(role)))) errors.push(`Forbidden sidebar link ${link}`);
  103 |       }
  104 |       if (consoleErrors.length) errors.push(...consoleErrors.map(message => 'Console: ' + message));
  105 |       const filename = route === '/' ? 'landing' : route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  106 |       await page.screenshot({ path: path.join(directory, filename + '.png'), fullPage: true, maskColor: '#cbd5e1', mask: [page.locator('input:not([data-jury-public]),textarea,[data-jury-private]')] });
  107 |       const record = { role, route, target, readyMs, readiness, layout, errors, apiTimes, screenshot: `${info.project.name}/${role}/${filename}.png` };
  108 |       records.push(record); failures.push(...errors.map(error => `${route}: ${error}`));
  109 |       await fs.writeFile(path.join(directory, 'evidence.json'), JSON.stringify({ browser: browser.version(), database: 'awaaz_dastak_showcase', recordedAt: new Date().toISOString(), records }, null, 2));
  110 |       console.log(`${info.project.name} ${role} ${route}: ${errors.length ? 'FAIL' : 'PASS'} ${readyMs}ms`);
  111 |     }
> 112 |     expect(failures, failures.join('\n')).toEqual([]);
      |                                           ^ Error: /institutions/:id: Content not ready within 3000 ms
  113 |   } finally { await context.close(); }
  114 | });
  115 | 
```