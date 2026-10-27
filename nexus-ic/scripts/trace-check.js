#!/usr/bin/env node
// Traceability check for FEATURES.md. Plain Node, no dependencies.
// Usage:
//   node scripts/trace-check.js              full report, exit 1 on any violation
//   node scripts/trace-check.js --stage S3   also list every ID in stage S3 that is not DONE
//
// Rules enforced:
//   1. Every expected ID appears exactly once (nothing missed, nothing merged).
//   2. Status is one of the allowed values.
//   3. A DONE row lists "Built in" paths that exist, and a test titled "[<ID>]" exists in a test file.
//   4. If test-results/results.json (Vitest/Jest JSON reporter) exists, every "[<ID>]" test for a DONE row passed.
//   5. NOT-ADOPTED and BLOCKED-SOURCE rows have nothing in "Built in".

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FEATURES = path.join(ROOT, 'FEATURES.md');
const STATUSES = ['TODO', 'IN-PROGRESS', 'DONE', 'GAP', 'BLOCKED-SOURCE', 'PLANNED-P2', 'NOT-ADOPTED'];

const range = (p, a, b, pad = 2) =>
  Array.from({ length: b - a + 1 }, (_, i) => p + String(a + i).padStart(pad, '0'));
const EXPECTED = [
  ...range('F', 1, 64), ...range('E', 1, 10), ...range('N', 1, 102), ...range('S', 1, 30),
  ...range('R', 1, 55), ...range('U', 1, 32), ...range('T', 1, 30), ...range('X', 1, 22), ...range('D', 1, 26),
];

function parseRows(md) {
  const rows = [];
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^\|\s*([A-Z]\d{2,3})\s*\|/);
    if (!m) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    const [id, title, source, pri, stage, status, builtIn, provedBy, notes] = cells;
    rows.push({ id, title, source, pri, stage, status, builtIn, provedBy, notes });
  }
  return rows;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'build'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(test|spec)\.(js|jsx|mjs|cjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

function testTitleIndex() {
  const index = new Map();
  for (const file of walk(ROOT)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\[([A-Z](?:-N)?\d{2,3})\]/g)) {
      const key = m[1];
      if (!index.has(key)) index.set(key, new Set());
      index.get(key).add(path.relative(ROOT, file));
    }
  }
  return index;
}

function testResults() {
  const p = path.join(ROOT, 'test-results', 'results.json');
  if (!fs.existsSync(p)) return null;
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  const byId = new Map();
  for (const suite of json.testResults || []) {
    for (const a of suite.assertionResults || []) {
      const name = a.fullName || a.title || '';
      for (const m of name.matchAll(/\[([A-Z](?:-N)?\d{2,3})\]/g)) {
        const prev = byId.get(m[1]);
        byId.set(m[1], prev === 'failed' ? 'failed' : a.status);
      }
    }
  }
  return byId;
}

function main() {
  const stageArg = process.argv.indexOf('--stage');
  const stage = stageArg > -1 ? process.argv[stageArg + 1] : null;

  const rows = parseRows(fs.readFileSync(FEATURES, 'utf8'));
  const errors = [];
  const seen = new Map();
  for (const r of rows) seen.set(r.id, (seen.get(r.id) || 0) + 1);

  for (const id of EXPECTED) if (!seen.has(id)) errors.push(`${id}: missing from FEATURES.md`);
  for (const [id, n] of seen) if (n > 1) errors.push(`${id}: appears ${n} times`);
  for (const id of seen.keys()) if (!EXPECTED.includes(id)) errors.push(`${id}: unexpected ID (not in the solution)`);

  const titles = testTitleIndex();
  const results = testResults();

  for (const r of rows) {
    if (!STATUSES.includes(r.status)) { errors.push(`${r.id}: invalid status "${r.status}"`); continue; }
    const paths = (r.builtIn || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (['NOT-ADOPTED', 'BLOCKED-SOURCE'].includes(r.status) && paths.length)
      errors.push(`${r.id}: ${r.status} but "Built in" is filled`);
    if (r.status === 'GAP' && !r.notes) errors.push(`${r.id}: GAP needs a reason in Notes`);
    if (r.status !== 'DONE') continue;

    if (!paths.length) errors.push(`${r.id}: DONE but "Built in" is empty`);
    for (const p of paths) if (!fs.existsSync(path.join(ROOT, p))) errors.push(`${r.id}: path not found: ${p}`);

    // Additions use [A-Nxx]; everything else uses [<ID>].
    const testKey = r.source === 'ADDITIONS.md' ? `A-${r.id}` : r.id;
    if (!titles.has(testKey)) errors.push(`${r.id}: DONE but no test titled "[${testKey}]" found`);
    if (results) {
      const s = results.get(testKey);
      if (!s) errors.push(`${r.id}: no run result for "[${testKey}]" in test-results/results.json`);
      else if (s !== 'passed') errors.push(`${r.id}: test "[${testKey}]" ${s}`);
    }
  }

  const count = {};
  for (const r of rows) count[r.status] = (count[r.status] || 0) + 1;
  console.log(`FEATURES.md: ${rows.length} rows, expected ${EXPECTED.length}`);
  for (const s of STATUSES) console.log(`  ${s.padEnd(15)} ${count[s] || 0}`);
  if (!results) console.log('  (no test-results/results.json yet: run the test suite with the JSON reporter)');

  if (stage) {
    const open = rows.filter((r) => r.stage.split(/[+;, ]+/).includes(stage) && r.status !== 'DONE' && r.status !== 'NOT-ADOPTED');
    console.log(`\nStage ${stage}: ${open.length} IDs not DONE`);
    for (const r of open) console.log(`  ${r.id.padEnd(4)} ${r.status.padEnd(15)} ${r.title.slice(0, 90)}`);
  }

  if (errors.length) {
    console.log(`\n${errors.length} violation(s):`);
    for (const e of errors) console.log('  âœ— ' + e);
    process.exit(1);
  }
  console.log('\nNo violations.');
}

main();
