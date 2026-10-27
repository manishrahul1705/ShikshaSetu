import { describe, expect, it, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import Institution from '../src/modules/institutions/Institution.js';

let request;

beforeEach(async () => {
  request = supertest(createApp(process.env.MONGODB_URI));
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

describe('[A-N97] public institution search', () => {
  it('allows the unauthenticated picker to search synthetic registry metadata', async () => {
    const response = await request.get('/api/v1/institutions/public-search?q=SECE').expect(200);
    expect(response.body.institutions).toEqual([
      expect.objectContaining({ pid: '1-9000000001', name: 'Synthetic Example College of Engineering' }),
    ]);
  });
});
