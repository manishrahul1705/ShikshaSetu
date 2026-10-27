import { expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedInstitutionsAndRegions } from '../src/modules/institutions/seed.js';
import { listInstitutions } from '../src/modules/registry/RegistrySimulator.js';
import Institution from '../src/modules/institutions/Institution.js';
import InstitutionIdentifier from '../src/modules/institutions/InstitutionIdentifier.js';
import IdentityReview from '../src/modules/institutions/IdentityReview.js';
import { resolveIdentity } from '../src/modules/institutions/institutionService.js';

async function fixture() {
  await seedDemoAccounts();
  await seedInstitutionsAndRegions();
  const app = createApp(process.env.MONGODB_URI);
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/login').send({ username: 'supervisor1', password: 'demo1234' }).expect(200);
  return { app, agent };
}

it('[R32] institution search authorizes, finds name/city/state/ICID and returns at most 20 public records', async () => {
  const { app, agent } = await fixture();
  const first = listInstitutions()[0];
  await request(app).get('/api/v1/institutions/search?q=Lucknow').expect(401);
  for (const q of [first.name, first.city, first.state, first.icid]) {
    const response = await agent.get('/api/v1/institutions/search').query({ q }).expect(200);
    expect(response.body.institutions.some(row => row.pid === first.pid)).toBe(true);
    expect(response.body.institutions.length).toBeLessThanOrEqual(20);
    for (const row of response.body.institutions) expect(Object.keys(row).sort()).toEqual(['pid', 'icid', 'name', 'city', 'state', 'region', 'type', 'approvalStatus', 'icidCheck'].sort());
  }
  const bounded = await agent.get('/api/v1/institutions/search').expect(200);
  expect(bounded.body.institutions).toHaveLength(20);
  const filtered = await agent.get('/api/v1/institutions/search').query({ state: first.state, region: first.region }).expect(200);
  expect(filtered.body.institutions.every(row => row.state === first.state && row.region === first.region)).toBe(true);
  await agent.get('/api/v1/institutions/search?q[x]=value').expect(400);
  expect((await agent.get('/api/v1/institutions/search').query({ q: '.*' }).expect(200)).body.institutions).toEqual([]);
});

it('[U02] ICID search resolves to its PID without linking, merging or resolving the queued disagreement', async () => {
  const { agent } = await fixture();
  const [first, second] = listInstitutions().filter(row => row.icid);
  const before = await InstitutionIdentifier.countDocuments();
  const response = await agent.get('/api/v1/institutions/search').query({ q: first.icid.toLowerCase() }).expect(200);
  expect(response.body.institutions).toHaveLength(1);
  expect(response.body.institutions[0]).toMatchObject({ pid: first.pid, icid: first.icid, icidCheck: 'MATCH' });
  expect(await resolveIdentity(first.pid, second.icid)).toBe('IDENTITY_REVIEW');
  expect(await IdentityReview.countDocuments({ status: 'PENDING' })).toBe(1);
  expect(await InstitutionIdentifier.countDocuments()).toBe(before);
});

it('[U04] the idempotent 120-institution catalogue retains six unavailable ICIDs across six regions', async () => {
  await fixture();
  const result = await seedInstitutionsAndRegions();
  expect(result.institutions).toBe(0);
  expect(await Institution.countDocuments()).toBe(120);
  expect(await InstitutionIdentifier.countDocuments()).toBe(114);
  const catalogue = listInstitutions();
  expect(catalogue.filter(row => !row.icid)).toHaveLength(6);
  expect(new Set(catalogue.map(row => row.region)).size).toBe(6);
  expect(catalogue.filter(row => row.icid).every(row => /^IIC-[A-Z0-9]{8}$/.test(row.icid))).toBe(true);
  const { searchInstitutions } = await import('../src/modules/registry/search.js');
  const missing = catalogue.find(row => !row.icid);
  expect((await searchInstitutions({ q: missing.pid })).institutions[0]).toMatchObject({ pid: missing.pid, icid: null, icidCheck: 'NOT_AVAILABLE' });
});
