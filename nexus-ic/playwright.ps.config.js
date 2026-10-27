const base = require('./playwright.config');
module.exports = { ...base, testMatch: 'ps-story.spec.js', repeatEach: 3,
  webServer: {...base.webServer,command:'node e2e/ps-runtime.mjs'},
  outputDir: './docs/screenshots/ps-story/artifacts',
  reporter: [['list'], ['json', { outputFile: 'docs/screenshots/ps-story/results.json' }]],
  use: { ...base.use, viewport: { width: 1366, height: 768 } } };
