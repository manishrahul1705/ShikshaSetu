import { describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { evidenceIds } from '../../client/src/additions/n85-problem-coverage/evidence.js';

const root = new URL('../../', import.meta.url);
const matrixPath = fileURLToPath(new URL('docs/ps-coverage.json', root));
const routesPath = fileURLToPath(new URL('client/src/routes', root));

describe('[A-N85] problem-statement coverage', () => {
  it('[A-N85] references actual proving test IDs including Appendix W without an additions prefix', async () => {
    const data = JSON.parse(await readFile(matrixPath, 'utf8'));
    const sources = await Promise.all(['server/tests/', 'client/tests/'].map(async directory => {
      const location = new URL(directory, root);
      return Promise.all((await readdir(location)).filter(name => /\.test\.[cm]?[jt]sx?$/.test(name)).map(name => readFile(new URL(name, location), 'utf8')));
    }));
    const titles = sources.flat().join('\n');
    const ids = [...data.problemNeeds.flatMap(row => row.testIds), ...data.workflow.flatMap(row => evidenceIds(row[3])), ...data.roles.flatMap(row => evidenceIds(row[3]))];
    for (const id of new Set(ids)) expect(titles, `Missing proving test [${id}]`).toContain(`[${id}]`);
    expect(evidenceIds(['N22', 'N46', 'N67', 'N70', 'N80', 'N81'])).toEqual(['N22', 'A-N46', 'A-N67', 'N70', 'N80', 'A-N81']);
  });
  it('[A-N85] maps every need, workflow step and role action to a declared route and viewer role', async () => {
    const data = JSON.parse(await readFile(matrixPath, 'utf8'));
    const routeFiles = await Promise.all((await readdir(routesPath)).filter((name) => /^s.*\.jsx$/.test(name)).map((name) => readFile(new URL(`client/src/routes/${name}`, root), 'utf8')));
    const routeSource = routeFiles.join('\n');
    const declared = [...routeSource.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
    const dynamicMatch = (path) => declared.some((entry) => {
      const escaped = entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[^/]+/g, '[^/]+');
      return new RegExp(`^${escaped}$`).test(path);
    });
    for (const row of data.problemNeeds) {
      expect(dynamicMatch(row.route), `${row.need} route ${row.route}`).toBe(true);
      expect(row.roles.length).toBeGreaterThan(0);
    }
    for (const [, title, route, features] of data.workflow) {
      expect(dynamicMatch(route), `${title} route ${route}`).toBe(true);
      expect(features.length).toBeGreaterThan(0);
    }
    for (const [role, , route, features, allowed] of data.roles) {
      expect(dynamicMatch(route), `${role} route ${route}`).toBe(true);
      expect(allowed.length).toBeGreaterThan(0);
      expect(features.length).toBeGreaterThan(0);
    }
  });
});
