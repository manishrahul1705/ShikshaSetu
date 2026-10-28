const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises'), path = require('node:path');
const { installPrivacyGuard } = require('./privacy.cjs');
test('[PS-ALIGN] dashboard tiles, coordination, case summary, filtered search and quarterly report', async ({ browser }, info) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5327', viewport: info.project.use.viewport });
  await context.addInitScript(installPrivacyGuard);
  const page = await context.newPage(), errors = [], directory = path.resolve('docs/screenshots/ps-align', info.project.name);
  await fs.mkdir(directory, { recursive: true });
  page.on('pageerror', error => errors.push(error.message));
  async function screenshot(name) { await page.screenshot({ path: path.join(directory, name + '.png'), fullPage: true, mask: [page.locator('input:not([data-jury-public]),textarea,[data-jury-private]')] }); }
  try {
    const login = await context.request.post('/api/v1/auth/login', { headers: { Origin: 'http://127.0.0.1:5327' }, data: { username: 'supervisor1', password: 'demo1234' } }); expect(login.ok()).toBe(true);
    await page.goto('/dashboard');
    for (const label of ['Under process', 'Transferred', 'Escalated', 'Cross-bureau institutions']) await expect(page.getByRole('link').filter({ hasText: label }).first()).toBeVisible();
    await screenshot('01-dashboard');
    const flagsResponse = await context.request.get('/api/v1/coordination'); expect(flagsResponse.ok()).toBe(true);
    const flags = await flagsResponse.json(); expect(flags.count).toBeGreaterThan(0);
    const flag = flags.flags[0], caseId = flag.cases[0].masterCaseId;
    await page.goto('/institutions/' + flag.institutionPid);
    await expect(page.getByRole('status', { name: 'Cross-bureau coordination flags' })).toContainText(flag.institutionPid);
    await screenshot('02-coordination');
    await page.goto('/cases/' + caseId);
    const summary = page.getByRole('region', { name: 'Case summary' });
    await expect(summary).toContainText(caseId); await expect(summary).toContainText('Next action required');
    await screenshot('03-summary');
    await page.goto('/cases/search');
    await page.getByLabel('AICTE PID', { exact: true }).fill(flag.institutionPid);
    await page.getByLabel('Case ID', { exact: true }).fill(caseId);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page).toHaveURL(/caseId=NX-/); await expect(page.getByRole('table')).toContainText(caseId);
    await screenshot('04-filtered-search');
    await page.goto('/reports/monthly');
    await page.getByRole('button', { name: 'Quarter', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Quarterly performance report' })).toBeVisible();
    await expect(page.getByRole('columnheader').filter({ hasText: 'Disposal rate' })).toBeVisible();
    await screenshot('05-quarterly');
    expect(errors).toEqual([]);
  } finally { await fs.writeFile(path.join(directory, 'checks.json'), JSON.stringify({ errors }, null, 2)); await context.close(); }
});
