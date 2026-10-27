import { describe, expect, it, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import Institution from '../src/modules/institutions/Institution.js';

let request;

beforeEach(async () => {
  request = supertest(createApp(process.env.MONGODB_URI));
  await seedDemoAccounts();
  await Institution.create({
    pid: '1-9000000001',
    name: 'Synthetic Example College of Engineering',
    aliases: ['SECE'],
    state: 'Tamil Nadu',
    region: 'Southern',
    type: 'Engineering',
    approvalStatus: 'approved',
    synthetic: true,
  });
});

describe('[A-N97] institution metadata search obeys the S01 authentication boundary', () => {
  it('rejects anonymous searches and returns bounded public metadata to a signed-in picker', async () => {
    await request.get('/api/v1/institutions/public-search?q=SECE').expect(401);
    const agent = supertest.agent(createApp(process.env.MONGODB_URI));
    await agent.post('/api/v1/auth/login').send({ username: 'student1', password: 'demo1234' }).expect(200);
    const response = await agent.get('/api/v1/institutions/public-search?q=SECE').expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(Object.keys(response.body.institutions[0]).sort()).toEqual(['pid','icid','name','city','state','region','type','approvalStatus','icidCheck'].sort());
    expect(response.body.institutions).toEqual([
      expect.objectContaining({ pid: '1-9000000001', name: 'Synthetic Example College of Engineering' }),
    ]);
  });
});
