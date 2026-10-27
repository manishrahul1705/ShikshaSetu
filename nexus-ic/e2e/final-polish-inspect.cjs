const { chromium } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const { installPrivacyGuard } = require('./privacy.cjs');
async function run() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(installPrivacyGuard);
  const page = await context.newPage();
  page.on('pageerror', error => console.log('Browser error:', error.message.slice(0, 180)));
  const base = 'http://127.0.0.1:5317';
  const directory = path.resolve('docs/screenshots/final-polish');
  await fs.mkdir(directory, { recursive: true });
  async function capture(route, name, ready) {
    await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    if (ready) await page.getByRole('heading', { name: ready, exact: true }).first().waitFor();
    const text = await page.locator('body').innerText();
    const banned = text.match(/.{0,40}\b(?:synthetic|demo|fake|sample)\b.{0,40}|.{0,40}test data.{0,40}/ig);
    console.log(JSON.stringify({ page: name, banned: banned || [] }));
    console.log(JSON.stringify(await page.evaluate(() => ({ height: document.body.scrollHeight, width: document.body.scrollWidth }))));
    await page.screenshot({ path: path.join(directory, name + '.png'), fullPage: false, mask: [page.locator('input,textarea,[data-jury-private]')], maskColor: '#cbd5e1' });
  }
  try {
    await capture('/', 'landing', 'AWAAZ DASTAK');
    const login = await context.request.post(base + '/api/v1/auth/login', { data: { username: 'supervisor1', password: 'demo1234' }, headers: { Origin: base } });
    if (!login.ok()) throw new Error('LOGIN_FAILED');
    await capture('/dashboard', 'command-centre', 'Command centre');
    const tour = await (await context.request.get(base + '/api/v1/judge/tour')).json();
    await capture('/cases/' + tour.scenario.cases[0].masterCaseId, 'case', tour.scenario.cases[0].masterCaseId);
    await page.getByText('Explain this case', { exact: true }).click();
    await page.getByRole('table').first().waitFor();
    await page.screenshot({ path: path.join(directory, 'case-explanation.png'), fullPage: true, mask: [page.locator('input,textarea,[data-jury-private]')], maskColor: '#cbd5e1' });
    await capture('/institutions/lookup', 'registry', 'Institution Master Registry Lookup');
    // This view's text inputs contain only public institution queries/identifiers.
    await page.locator('main input[type="text"]').evaluateAll(nodes => nodes.forEach(node => { node.setAttribute('data-jury-public', ''); node.removeAttribute('aria-hidden'); }));
    const picker = page.getByRole('combobox', { name: 'Find an institution', exact: true });
    await picker.fill('Lucknow');
    await page.getByRole('option').first().waitFor();
    await page.screenshot({ path: path.join(directory, 'picker.png'), fullPage: true, mask: [page.locator('input:not([data-jury-public]):not([type="checkbox"]):not([type="radio"]),textarea,[data-jury-private]')], maskColor: '#cbd5e1' });
    console.log(JSON.stringify({ browser: browser.version(), directory }));
  } finally { await context.close(); await browser.close(); }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
