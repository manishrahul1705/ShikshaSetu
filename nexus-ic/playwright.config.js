const { defineConfig } = require('@playwright/test');

// Dedicated rehearsal services. Never reuse the shared development server.
module.exports = defineConfig({
  testDir: './e2e',
  testMatch: 'judge.spec.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 300000,
  outputDir: './docs/screenshots/run-artifacts',
  reporter: [['list'], ['json', { outputFile: 'docs/screenshots/browser-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:5317',
    browserName: 'chromium',
    // Downloaded Chromium 156 fails Windows side-by-side activation here.
    // Existing Chrome runs with a fresh temporary profile, never a user's profile.
    channel: 'chrome',
    viewport: { width: 1440, height: 1000 },
    // Enable video in the judge spec only after its pre-navigation privacy guard.
    video: 'off',
    screenshot: 'off',
    trace: 'off',
  },
  webServer: {
    command: 'node e2e/runtime.mjs',
    url: 'http://127.0.0.1:5317',
    reuseExistingServer: false,
    timeout: 60000,
    stdout: 'ignore',
  },
});
