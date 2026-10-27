const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e', testMatch: ['page-audit.spec.js','privacy-guard.spec.js'], workers: 1, retries: 0, fullyParallel: false,
  timeout: 600000, outputDir: 'docs/screenshots/audit/runner-artifacts',
  reporter: [['list'], ['json', { outputFile: 'docs/screenshots/audit/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:5327', channel: 'chrome', screenshot: 'off', trace: 'off', video: 'off' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'node e2e/audit-runtime.mjs', url: 'http://127.0.0.1:5327', timeout: 120000, reuseExistingServer: true },
});
