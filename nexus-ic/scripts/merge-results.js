const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, 'test-results');
const SERVER_FILE = path.join(RESULTS_DIR, 'server-results.json');
const CLIENT_FILE = path.join(RESULTS_DIR, 'client-results.json');
const MERGED_FILE = path.join(RESULTS_DIR, 'results.json');

function readJsonSafe(file) {
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.warn(`Could not parse ${file}: ${e.message}`);
    }
  }
  return null;
}

function merge() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const server = readJsonSafe(SERVER_FILE) || { testResults: [] };
  const client = readJsonSafe(CLIENT_FILE) || { testResults: [] };

  const testResults = [
    ...(server.testResults || []),
    ...(client.testResults || []),
  ];

  const merged = {
    numFailedTestSuites: (server.numFailedTestSuites || 0) + (client.numFailedTestSuites || 0),
    numFailedTests: (server.numFailedTests || 0) + (client.numFailedTests || 0),
    numPassedTestSuites: (server.numPassedTestSuites || 0) + (client.numPassedTestSuites || 0),
    numPassedTests: (server.numPassedTests || 0) + (client.numPassedTests || 0),
    numPendingTestSuites: (server.numPendingTestSuites || 0) + (client.numPendingTestSuites || 0),
    numPendingTests: (server.numPendingTests || 0) + (client.numPendingTests || 0),
    numTotalTestSuites: (server.numTotalTestSuites || 0) + (client.numTotalTestSuites || 0),
    numTotalTests: (server.numTotalTests || 0) + (client.numTotalTests || 0),
    success: server.success !== false && client.success !== false,
    testResults,
  };

  fs.writeFileSync(MERGED_FILE, JSON.stringify(merged, null, 2), 'utf8');
  console.log(
    `Merged test results written to ${MERGED_FILE} (${merged.numTotalTests} total tests, ${merged.numPassedTests} passed, ${merged.numFailedTests} failed)`
  );
}

merge();
