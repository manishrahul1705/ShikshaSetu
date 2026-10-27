import { it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import User from '../src/modules/auth/User.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedIdentityReporters } from '../src/modules/identity/seed.js';
import { processUpload } from '../src/modules/documents/documentService.js';
import { setupS5, agent, makeCase, NARRATIVE } from './s5-helpers.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const review = () => fs.readFileSync(path.join(ROOT, 'docs', 'SECURITY_REVIEW.md'), 'utf8');

beforeEach(() => {
  process.env.APP_MODE = 'demo';
});

it('[S08] stored documents and the identity vault hold no plaintext; deployment notes cover TLS, at-rest encryption and keys', async () => {
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  process.env.DOCS_KEY = crypto.randomBytes(32).toString('hex');
  await seedDemoAccounts();
  await seedIdentityReporters();
  const officer = await User.findOne({ username: 'rb_officer1' });
  const secret = 'SYNTHETIC-PLAINTEXT-MARKER-0000';
  const doc = await processUpload({ buffer: Buffer.from(`%PDF-1.4\n${secret}\n%%EOF\n`), originalName: 'x.pdf', mimeType: 'application/pdf', user: { id: String(officer._id), _id: officer._id, role: officer.role } });
  const stored = JSON.stringify(await mongoose.connection.collection('documents').findOne({ _id: doc._id }));
  expect(stored).not.toContain(secret);
  expect(stored).not.toContain(Buffer.from(secret).toString('base64'));
  const vault = JSON.stringify(await mongoose.connection.collection('identity_vault').find({}).toArray());
  expect(vault.length).toBeGreaterThan(2);
  expect(vault).not.toMatch(/Synthetic (student|faculty)|DEMO-APAAR|DEMO-STAFF/);
  const text = review();
  for (const s of ['TLS', 'encryption at rest', 'key store', 'deployment review']) expect(text.toLowerCase()).toContain(s.toLowerCase());
});

it('[S13] the audit schedule exists and keeps the "S34" reference as written', () => {
  const text = review();
  expect(text).toContain('## S13 Regular security audits and compliance reviews');
  expect(text).toContain('Audit schedule, S34');
  for (const when of ['Before any pilot', 'Every release', 'Monthly', 'Quarterly', 'Yearly']) expect(text).toContain(when);
});

it('[S30] the threat model and penetration-test checklist cover every control S01 to S30', () => {
  const text = review();
  expect(text).toContain('### Threat model');
  expect(text).toContain('### Penetration-test checklist (must pass before any pilot)');
  for (let i = 1; i <= 30; i++) expect(text).toMatch(new RegExp(`- \\[ \\] S${String(i).padStart(2, '0')} `));
});

it('[N34] the recurring security audit programme names owner, cadence, scope, method, evidence and findings handling', () => {
  const text = review();
  expect(text).toContain('## N34 Recurring security audit programme');
  for (const el of ['| Owner |', '| Cadence |', '| Scope |', '| Method |', '| Evidence |', '| Findings |']) expect(text).toContain(el);
});

it('[S19] GET /api/v1/cases/:id and Institution 360 give the Competent Authority no narrative (S7 fix in abac.js)', async () => {
  const ctx = await setupS5();
  const c = await makeCase(ctx.student, ctx.officer);
  const a = await agent(ctx.app, ctx.authority);
  const one = await a.get(`/api/v1/cases/${c.masterCaseId}`).expect(200);
  expect(one.body.masterCaseId).toBe(c.masterCaseId);
  expect(one.body).not.toHaveProperty('narrative');
  expect(one.body).not.toHaveProperty('internalNotes');
  const inst = await a.get(`/api/v1/institutions/${c.institutionPid}/360`).expect(200);
  expect(JSON.stringify(inst.body)).not.toContain(NARRATIVE);
});
