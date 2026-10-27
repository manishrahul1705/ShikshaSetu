import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  await page.goto('http://127.0.0.1:5317/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('form input').nth(0).fill('supervisor1');
  await page.locator('form input').nth(1).fill('demo1234');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL('**/dashboard');
  const reset = await page.request.post('http://127.0.0.1:5317/api/v1/judge/reset', { headers: { Origin: 'http://127.0.0.1:5317' } });
  if (!reset.ok()) throw new Error(`Isolated reset failed: ${reset.status()}`);
  const tour = await reset.json();
  console.log(JSON.stringify({ reset: reset.status(), scenario: tour.scenario, s3Fixtures: tour.s3Fixtures }));
} finally { await browser.close(); }
