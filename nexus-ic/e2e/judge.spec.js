const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { installPrivacyGuard, privateNarrative: PRIVATE_NARRATIVE } = require('./privacy.cjs');
const BASE = 'http://127.0.0.1:5317';

test('[JUDGE] complete browser rehearsal: verification, PREVENT, TRACE, PROOF, tracking and audit', async ({ browser }, info) => {
  test.setTimeout(600000);
  // Rehearse against the prepared showcase; no database reset inside the browser
  // runner. Later runs use the already verified account and distinct case text.
  const privateNarrative = `${PRIVATE_NARRATIVE} ${Date.now()}`;
  const reporterUsername = ['student1', 'trust_student_verified', 'trust_faculty_verified'][info.repeatEachIndex];
  const run = `run-${info.repeatEachIndex + 1}`;
  const directory = path.resolve('docs/screenshots', run);
  await fs.mkdir(directory, { recursive: true });
  const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 1000 }, recordVideo: { dir: path.join(directory, 'video'), size: { width: 1440, height: 1000 } } });
  await context.addInitScript(installPrivacyGuard);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  async function go(route) { await page.goto(route, { waitUntil: 'domcontentloaded' }); }
  async function api(route, data) {
    const response = data === undefined ? await context.request.get(`${BASE}/api/v1${route}`) : await context.request.post(`${BASE}/api/v1${route}`, { data, headers: { Origin: BASE } });
    expect(response.ok(), `API ${route} returned ${response.status()}`).toBeTruthy();
    return response.json();
  }
  async function login(username) {
    await context.clearCookies();
    await go('/login');
    await page.locator('form input').nth(0).fill(username);
    await page.locator('form input').nth(1).fill('demo1234');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  }
  async function shot(name) {
    expect(await page.locator('body').innerText()).not.toMatch(/\b(synthetic|demo|fake|sample)\b|test data/i);
    await page.evaluate(() => window.scrollTo(0, 0));
    const filename = `${name}.png`;
    await page.screenshot({ path: path.join(directory, filename), fullPage: true, maskColor: '#cbd5e1', mask: [page.locator('input:not([data-jury-public]),textarea,[data-jury-private]')] });
    await fs.copyFile(path.join(directory, filename), path.resolve('docs/screenshots', filename));
    console.log(`Saved masked browser step ${name}`);
  }
  try {
    await login('supervisor1');
    const tour = await api('/judge/tour');
    expect(tour.scenario.cases.length).toBeGreaterThanOrEqual(2);
    const pid = tour.scenario.institutionPid;
    await context.clearCookies();
    await go('/');
    await expect(page.getByText('AWAAZ DASTAK', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('One Institution, One View, One Complaint Journey, Real Resolution', { exact: false }).first()).toBeVisible();
    await shot('01-landing');

    await login(reporterUsername);
    await go('/verify');
    const identityResponse = await context.request.get(`${BASE}/api/v1/identity/me`);
    expect([200, 404]).toContain(identityResponse.status()); // 404 means no reporter claim yet.
    const identity = identityResponse.status() === 404 ? null : await identityResponse.json();
    if (identity?.status !== 'verified') {
    expect([null, 'unverified', 'pending_otp']).toContain(identity?.status || null);
    if (identity?.status !== 'pending_otp') {
    await page.getByLabel('I consent to this verification step and its minimum identity evidence.').check();
    const verificationResponse = page.waitForResponse(r => r.url().endsWith('/auth/verify/student') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Start verification', exact: true }).click();
    expect((await verificationResponse).ok()).toBeTruthy();
    }
    await expect(page.getByText('Status: Awaiting OTP', { exact: true })).toBeVisible();
    await page.getByLabel('I consent to the OTP verification step.').check();
    const issuedResponse = page.waitForResponse(r => r.url().endsWith('/identity/otp') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Send local OTP', exact: true }).click();
    expect((await issuedResponse).ok()).toBeTruthy();
    await expect.poll(async () => (await api('/dev/otp-inbox')).entries.length).toBeGreaterThan(0);
    const inbox = await api('/dev/otp-inbox');
    await page.locator('input[autocomplete="one-time-code"]').fill(inbox.entries[0].otp);
    const confirmedResponse = page.waitForResponse(r => r.url().endsWith('/identity/otp/confirm') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Confirm OTP', exact: true }).click();
    expect((await confirmedResponse).ok()).toBeTruthy();
    }
    await expect(page.getByText('No proxy / verified reporter', { exact: true })).toBeVisible();
    await shot('02-trust-verification');

    await go('/grievances/new');
    const picker = page.getByRole('combobox', { name: 'Find an institution' });
    await picker.evaluate(node => node.setAttribute('data-jury-public', ''));
    await picker.fill(pid);
    await page.getByRole('option').filter({ hasText: pid }).click();
    await expect(page.getByRole('status').filter({ hasText: /IIC-.*MATCH/ }).first()).toBeVisible();
    await shot('02a-institution-picker');
    await page.locator('form input[type="text"]').last().evaluate(node => node.setAttribute('data-jury-public', ''));
    await page.locator('form input[type="text"]').last().fill(pid);
    const profilePromise = page.waitForResponse(r => r.url().endsWith(`/registry/institutions/${pid}`));
    const fetchButton = page.getByRole('button', { name: 'Fetch Institution Details (Auto)', exact: true });
    try { await fetchButton.click(); }
    catch (error) {
      console.log('Lookup button diagnostic', await fetchButton.evaluate(node => ({ disabled: node.disabled, visibility: getComputedStyle(node).visibility, display: getComputedStyle(node).display, bounds: node.getBoundingClientRect().toJSON(), privateAncestor: !!node.closest('[data-jury-private]') })));
      throw error;
    }
    const profile = await (await profilePromise).json();
    expect(profile.pid).toBe(pid);
    await expect(page.getByText(profile.name, { exact: true }).first()).toBeVisible();
    await shot('03-pid-lookup');
    const language = page.getByRole('button', { name: 'Toggle Language', exact: true });
    await language.click();
    await expect(language).toHaveText('English');
    await shot('04-hindi');
    await language.click();
    await page.locator('form select').nth(0).selectOption('Fee Dispute');
    await page.locator('form select').nth(1).selectOption('Refund Denial');
    await page.locator('form textarea').fill(privateNarrative);
    const jpeg = Buffer.concat([Buffer.from([255,216,255,225,0,10,69,120,105,102,0,0,255,218]), Buffer.from('synthetic image scan'), Buffer.from([255,217])]);
    const uploadPromise = page.waitForResponse(r => r.url().endsWith('/documents/upload') && r.request().method() === 'POST');
    await page.locator('input[type="file"]').setInputFiles({ name: 'evidence-photo.jpg', mimeType: 'image/jpeg', buffer: jpeg });
    const uploadResponse = await uploadPromise;
    expect(uploadResponse.ok()).toBeTruthy();
    const document = await uploadResponse.json();
    expect(document.metadataStripped).toBe(true);
    await expect(page.getByText(/EXIF Scrubbed/)).toBeVisible();
    const similarityResponse = page.waitForResponse(r => r.url().endsWith('/grievances/check-similar') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Preview & Confirm', exact: true }).click();
    expect((await similarityResponse).ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)', exact: true })).toBeVisible();
    await expect(page.getByText('a similar open matter exists', { exact: true })).toBeVisible();
    await shot('05-prevent-preview');
    await page.getByRole('button', { name: 'Edit Form', exact: true }).click();
    expect((await page.locator('form textarea').inputValue()) === privateNarrative).toBe(true);
    await page.getByRole('button', { name: 'Preview & Confirm', exact: true }).click();
    const submitPromise = page.waitForResponse(r => r.url().endsWith('/api/v1/grievances') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Continue with a new case', exact: true }).click();
    const submission = await submitPromise;
    expect(submission.ok()).toBeTruthy();
    const created = await submission.json(), master = created.masterCaseId;
    expect(master).toMatch(/^NX-\d{4}-\d{6}$/);
    await expect(page.getByText(master, { exact: true }).first()).toBeVisible();
    await shot('06-case-created');

    await login('supervisor1');
    const snapshot = await api(`/cases/${master}`);
    expect(snapshot.institutionPid).toBe(pid);
    expect(snapshot.pidSnapshot.pid).toBe(pid);
    expect(snapshot.icidSnapshot.icid).toBe(profile.icid);
    await go(`/cases/${master}`);
    await page.getByText('Explain this case', { exact: true }).click();
    await expect(page.getByRole('table').first()).toBeVisible();
    await shot('06a-case-explanation');
    const bannerResponse = page.waitForResponse(r => r.url().includes('/prevent/overlaps?institutionPid=') && r.request().method() === 'GET');
    await go(`/institutions/${pid}`);
    const banner = await (await bannerResponse).json();
    expect(banner.result).toBe('REVIEW');
    expect(banner.pairs.length).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: 'Potential Overlapping Cases – Coordination Required', exact: true })).toBeVisible();
    await page.getByText(`Case journey: ${master}`, { exact: true }).click();
    await expect(page.getByRole('region', { name: `Routing decision ${master}` }).first()).toContainText('Routing rule v1');
    await expect(page.getByText(/^Priority: normal\. Reason: Standard priority assigned/)).toBeVisible();
    await shot('07-institution-overlap');
    await go(`/overlap-timeline/${pid}`);
    for (const bureau of ['Regulation Bureau', 'Public Grievance Redressal Cell']) {
      const original = tour.scenario.cases.find(c => c.bureau === bureau);
      expect(original).toBeTruthy();
      const event = page.getByRole('region', { name: `Lane ${bureau}`, exact: true }).getByRole('listitem').filter({ hasText: original.masterCaseId });
      await expect(event.getByText('DOCUMENT_REQUEST', { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('region', { name: 'Conflict points' })).toContainText('REVIEW');
    await shot('08-overlap-timeline');

    const current = await api(`/cases/${master}`);
    const owner = current.owningBureau;
    const initialOfficer = /Regulation|^RB$/.test(owner) ? 'rb_officer1' : 'pgrc_officer1';
    const nextOfficer = initialOfficer === 'rb_officer1' ? 'pgrc_officer1' : 'rb_officer1';
    const destination = nextOfficer === 'rb_officer1' ? 'Regulation Bureau' : 'Public Grievance Redressal Cell';
    await login(initialOfficer);
    await go('/review');
    await page.getByLabel('Master Case ID', { exact: true }).fill(master);
    await page.getByLabel('Subject (used locally; not stored as text)', { exact: true }).fill('Fee refund ledger for the laboratory fee (synthetic)');
    const checkPromise = page.waitForResponse(r => r.url().endsWith('/prevent/check-action') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    const checkResponse = await checkPromise;
    expect(checkResponse.ok()).toBeTruthy();
    const actionCheck = await checkResponse.json();
    expect(actionCheck.result).toBe('REVIEW');
    await expect(page.getByRole('status').filter({ hasText: /^REVIEW$/ })).toBeVisible();
    await page.getByRole('button', { name: 'Proceed', exact: true }).click();
    await expect(page.getByText('Proceed choice recorded; case status and ownership are unchanged.', { exact: true })).toBeVisible();
    await shot('09-officer-action-review');
    await go('/transfers');
    await page.getByLabel('Transfer Master Case ID').fill(master);
    await page.getByLabel('Destination bureau').selectOption(destination);
    await page.getByLabel('Transfer reason', { exact: true }).fill('JURY91_PRIVATE coordination request');
    await page.getByRole('button', { name: 'Request transfer', exact: true }).click();
    await expect(page.getByText('Transfer requested; acceptance pending. Sender remains accountable.', { exact: true })).toBeVisible();
    await shot('10-transfer-pending');
    await login(nextOfficer);
    await go('/transfers');
    const card = page.getByTestId('transfer-card').filter({ has: page.getByText(master, { exact: true }) });
    await card.getByRole('button', { name: /Accept/, exact: false }).click();
    await expect(page.getByRole('region', { name: 'Accepted transfer' })).toContainText('ACCEPTED');
    await expect(page.getByRole('region', { name: 'Accepted transfer' })).toContainText('New Owner Active');
    await shot('11-transfer-accepted');
    await go(`/closure/${master}`);
    await expect(page.getByRole('button', { name: 'Close case', exact: true })).toBeDisabled();
    await shot('12-closure-blocked');
    await page.getByLabel('Closure reason', { exact: true }).fill('JURY91_PRIVATE resolution recorded after document review');
    await page.getByLabel('Evidence document IDs', { exact: true }).fill(document.documentId);
    await page.getByRole('button', { name: 'Propose', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Attach evidence', exact: true })).toBeVisible();
    const proposal = await api(`/cases/${master}/closure`);
    expect(proposal.records.some(record => record.state === 'PROPOSED')).toBe(true);
    expect(proposal.gate.evidenceAttached).toBe('PASS');
    await shot('13-closure-proposed');
    await login('supervisor1');
    await go(`/closure/${master}`);
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Close case', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Close case', exact: true }).click();
    await expect(page.getByText('Closed', { exact: true })).toBeVisible();
    await shot('14-closure-approved');

    await login(reporterUsername);
    const trackedResponse = page.waitForResponse(r => r.url().endsWith(`/api/v1/track/${master}`) && r.request().method() === 'GET');
    await go(`/track/${master}`);
    expect((await trackedResponse).ok()).toBeTruthy();
    await expect(page.getByTestId('track-status')).toHaveText('Closed');
    const receipt = await context.request.get(`${BASE}/api/v1/track/${master}/receipt`);
    expect(receipt.ok()).toBeTruthy();
    const html = await receipt.text();
    expect(html.includes('<svg')).toBe(true);
    expect(html.includes('/track/' + master)).toBe(true);
    await shot('15-track-receipt');
    const receiptPath = path.join(directory, 'receipt.html');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download receipt', exact: true }).click();
    await (await downloadPromise).saveAs(receiptPath);
    await page.goto(pathToFileURL(receiptPath).href, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[aria-label="QR code to track this case"] svg')).toBeVisible();
    await shot('15a-downloaded-qr-receipt');
    await go(`/track/${master}`);
    await page.getByLabel('Feedback text', { exact: true }).fill('JURY91_PRIVATE feedback');
    await page.getByRole('button', { name: 'Send feedback', exact: true }).click();
    await expect(page.getByText(/Feedback sent: 1/)).toBeVisible();
    await shot('16-feedback');
    await login('authority1');
    await go('/authority');
    await expect(page.getByRole('heading', { name: /Competent Authority/ }).first()).toBeVisible();
    await shot('17-authority');
    await go('/impact');
    await expect(page.getByRole('heading', { name: 'NEXUS IMPACT', exact: true })).toBeVisible();
    await shot('18-impact');
    await page.locator('a[href^="/impact/cases?row="]').first().click();
    await expect(page).toHaveURL(/\/impact\/cases\?row=/);
    await shot('19-impact-drilldown');
    await go('/');
    await page.getByRole('button', { name: 'Present', exact: true }).click();
    for (let index = 0; index < 6; index++) await page.getByRole('button', { name: 'Next', exact: true }).click();
    const results = page.getByRole('dialog', { name: 'Guided Walkthrough' });
    await expect(results.getByRole('heading', { name: 'Recorded results', exact: true })).toBeVisible();
    const live = await api('/impact/summary');
    await expect(results).toContainText(String(live.tiles.totalComplaints.count));
    await expect(results).toContainText(live.scope);
    await shot('19a-presentation-results');
    await results.getByRole('button', { name: 'Close', exact: true }).click();
    await login('auditor1');
    await go('/audit');
    await expect(page.getByText(/Hash chain: intact/)).toBeVisible();
    await page.getByRole('button', { name: /Check audit chain/i }).click();
    await expect(page.getByText(/intact/i).first()).toBeVisible();
    await shot('20-audit');
    await go('/integrity');
    await expect(page.getByText(/fingerprint/i).first()).toBeVisible();
    await shot('21-integrity');
    await fs.writeFile(path.join(directory, 'evidence.json'), JSON.stringify({ browser: browser.version(), run, completedAt: new Date().toISOString(), masterCaseId: master, database: 'awaaz_dastak_showcase', screenshots: (await fs.readdir(directory)).filter(file => file.endsWith('.png')).length, video: await page.video().path() }, null, 2));
  } finally { await context.close(); }
});
