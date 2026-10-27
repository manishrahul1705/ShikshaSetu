import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';
import { seedBureaus } from '../src/modules/bureaus/seed.js';
import { listBureaus, getBureauByCode, getBureauOfficers } from '../src/modules/bureaus/bureauService.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedBureaus();
});

describe('S2: Bureaus and Cells Operational Units (N73)', () => {
  it('[N73] bureaus and cells seeded as configurable units with officers', async () => {
    // 1. Verify all 8 bureaus / operational units are seeded
    const bureaus = await listBureaus();
    const codes = bureaus.map((b) => b.code);

    expect(codes).toContain('PGRC');
    expect(codes).toContain('RB');
    expect(codes).toContain('AB');
    expect(codes).toContain('APB');
    expect(codes).toContain('SEB');
    expect(codes).toContain('TL');
    expect(codes).toContain('RO');
    expect(codes).toContain('OTHER');

    // 2. Bureau lookup by code
    const pgrc = await getBureauByCode('PGRC');
    expect(pgrc).toBeDefined();
    expect(pgrc.name).toMatch(/Public Grievance Redressal Cell/i);
    expect(pgrc.active).toBe(true);

    // 3. Officers roster for bureaus
    const abOfficers = await getBureauOfficers('AB');
    expect(abOfficers.length).toBeGreaterThanOrEqual(1);
    expect(abOfficers[0].username).toBe('ab_officer1');
    expect(abOfficers[0].bureau).toBe('AB');

    // 4. REST endpoint verification via supertest
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get('/api/v1/bureaus').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(8);

    const roRes = await agent.get('/api/v1/bureaus/RO').expect(200);
    expect(roRes.body.code).toBe('RO');
    expect(roRes.body.name).toMatch(/Regional Offices/i);
  });
});
