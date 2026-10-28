const base = require('./playwright.ps.config.js');
// Same existing showcase spec and three repetitions. Reuse the explicitly
// started verification runtime so runner cleanup cannot stop the review server.
module.exports = { ...base, webServer: { ...base.webServer, reuseExistingServer: true }, reporter: [['list'], ['json', { outputFile: 'docs/screenshots/ps-align/showcase-results.json' }]] };
