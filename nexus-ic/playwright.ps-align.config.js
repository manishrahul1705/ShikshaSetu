const base = require('./playwright.audit.config.js');
module.exports = { ...base, testMatch: 'ps-align.spec.js', outputDir: 'docs/screenshots/ps-align/artifacts', reporter: [['list'], ['json', { outputFile: 'docs/screenshots/ps-align/results.json' }]] };
