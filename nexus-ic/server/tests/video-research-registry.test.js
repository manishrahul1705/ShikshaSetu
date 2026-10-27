import { expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import Research from '../src/modules/researchRegistry/ResearchInstitution.js';
import { normalizeResearchRow, tokensFor, researchSearch } from '../src/modules/researchRegistry/service.js';
import { getInstitutionByPid } from '../src/modules/institutions/institutionService.js';
import { AbcApaarSimulator } from '../src/modules/identity/simulators.js';
import { loadSimulatorDatabase } from '../src/modules/identity/SimulatorStore.js';

const dataset = { fileHash: 'test-workbook-sha', sourceFileName: 'supplied.xlsx' };
const raw = { 'College Name': 'SRI ESHWAR COLLEGE OF ENGINEERING', PID: '1-4166771', 'IC ID': 'Not publicly verified', State: 'Tamil Nadu', City: 'Coimbatore', 'AICTE Status': 'Registry only; approval not verified' };
async function insert(overrides = {}, sourceRow = 2) {
  const row = normalizeResearchRow({ raw: { ...raw, ...overrides }, sourceRow }, dataset, { 'Tamil Nadu': 'Southern' });
  return Research.create({ ...row, pickerTokens: tokensFor(row) });
}

it('[A-N98] supplied research preserves short and nonstandard source PIDs, raw lineage and absent ICIDs', async () => {
  const row = await insert();
  expect(row.pid).toBe('1-4166771');
  expect(row.icid).toBeNull();
  expect(row.provenance).toMatchObject({ fileHash: dataset.fileHash, row: 2, incompleteSource: true });
  expect(row.raw['IC ID']).toBe('Not publicly verified');
  const missing = normalizeResearchRow({ raw: { ...raw, PID: 'Not publicly verified' }, sourceRow: 3 }, dataset);
  expect(missing.pid).toBeNull();
  expect(missing.missingReasons.pid).toContain('UNKNOWN');
  expect(normalizeResearchRow({ raw: { ...raw, PID: '43710627998' }, sourceRow: 4 }, dataset).pidFormat).toBe('nonstandard-source');
});

it('[A-N97] research search resolves acronym and exact source PID, scopes states and preserves lookup provenance', async () => {
  await insert();
  await insert({ 'College Name': 'Second Engineering College', PID: '1-12345678', State: 'Kerala' }, 3);
  const matches = await researchSearch({ q: 'SECE' });
  expect(matches).toHaveLength(1);
  expect(matches[0]).toMatchObject({ pid: '1-4166771', source: { kind: 'research' }, demoCaseTarget: false });
  expect(await researchSearch({ q: 'SECE', state: 'Kerala' })).toEqual([]);
  expect((await getInstitutionByPid('1-4166771')).institution).toMatchObject({ name: raw['College Name'], icid: null });
  expect((await researchSearch({ q: '1-12345678' }))[0].state).toBe('Kerala');
});

it('[A-N100] research state pages are authorized, bounded and reject malformed pagination', async () => {
  await seedDemoAccounts();
  await insert();
  const app = createApp(process.env.MONGODB_URI);
  await request(app).get('/api/v1/registry/research/institutions').expect(401);
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/login').send({ username: 'sysadmin1', password: 'demo1234' }).expect(200);
  const response = await agent.get('/api/v1/registry/research/institutions').query({ state: 'Tamil Nadu' }).expect(200);
  expect(response.body.institutions).toHaveLength(1);
  expect(response.body.nextOffset).toBeNull();
  await agent.get('/api/v1/registry/research/institutions?offset=-1').expect(400);
  await agent.get('/api/v1/registry/research/institutions?state[x]=1').expect(400);
  const summary = await agent.get('/api/v1/registry/research/summary').expect(200);
  expect(summary.body).toMatchObject({ total: 1, withPid: 1, withIcid: 0 });
});

it('[A-N91] verification simulator preserves active, inactive, mismatch and manual outcomes and rejects a shared database', async () => {
  expect(AbcApaarSimulator.verify('100020003001', '1-7734299133').status).toBe('VERIFIED');
  expect(AbcApaarSimulator.verify('100020004001', '1-7734299133').status).toBe('INACTIVE');
  expect(AbcApaarSimulator.verify('100020003001', '1-7734299101').status).toBe('MISMATCH');
  expect(AbcApaarSimulator.verify('100020006001', '1-7734299133').status).toBe('MANUAL_REVIEW');
  await expect(loadSimulatorDatabase('mongodb://localhost:27017/awaaz_dastak_demo')).rejects.toThrow('SEPARATE_SIMULATOR_DATABASE_REQUIRED');
});
