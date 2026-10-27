import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedInstitutionsAndRegions } from '../src/modules/institutions/seed.js';
import OfficialInstitution from '../src/modules/registry/OfficialInstitution.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { getInstitutionByPid } from '../src/modules/institutions/institutionService.js';
import { searchInstitutions } from '../src/modules/registry/search.js';
import { acronymsOf, editDistance, expandQuery, rankInstitutions } from '../src/modules/registry/smartSearch.js';
import { parseOfficialCsv, previewOfficialImport } from '../src/modules/registry/adapters.js';
import { assertNotRealListInDemo } from '../src/modules/cases/caseService.js';

// Synthetic STAND-IN for a real college. "Sri Example College of Engineering" is
// invented for tests; no real institution's PID or ICID appears in this repo.
const STAND_IN = { pid: '1-9000000001', icid: 'IIC-STNDIN01', name: 'Sri Example College of Engineering', city: 'Example Nagar', state: 'Tamil Nadu', district: 'Example District', type: 'Engineering', aliases: ['SECE Example'] };
const OTHERS = [
  { pid: '1-9000000002', name: 'Southern Example Institute of Technology', city: 'Example Pur', state: 'Kerala' },
  { pid: '1-9000000003', name: 'National Example Institute of Technology Karnataka', city: 'Sample Town', state: 'Karnataka' },
  { pid: '1-9000000004', name: 'Example School of Management', city: 'Sample City', state: 'Delhi', aliases: ['ESM'] },
];
const ROWS = [STAND_IN, ...OTHERS];
const CSV = [
  'AICTE Permanent ID,Name of the Institute,State,District,City,Institution Type,Programme,IIC ID,Women Only',
  `${STAND_IN.pid},"${STAND_IN.name}",${STAND_IN.state},${STAND_IN.district},${STAND_IN.city},Engineering,"Engineering;Management",${STAND_IN.icid},No`,
  '1-9000000002,"Southern Example Institute of Technology, Example Pur",Kerala,,,,,,No',
  'not-a-pid,"Broken Example College",Kerala,,,,,,No',
].join('\r\n');

async function admin() {
  await seedDemoAccounts();
  const app = createApp(process.env.MONGODB_URI);
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/login').send({ username: 'sysadmin1', password: 'demo1234' }).expect(200);
  return { app, agent };
}

describe('[A-N97] smart college search', () => {
  it('[A-N97] acronym of the significant words finds the stand-in ("sece", "SECE")', () => {
    expect(acronymsOf(STAND_IN.name)).toContain('sece');
    for (const q of ['sece', 'SECE', 's.e.c.e']) expect(rankInstitutions(ROWS, q)[0].pid).toBe(STAND_IN.pid);
    expect(rankInstitutions(ROWS, 'neitk')[0].pid).toBe('1-9000000003');
  });

  it('[A-N97] any part of the name, case and accent insensitive', () => {
    expect(rankInstitutions(ROWS, 'sri example college of engineering')[0].pid).toBe(STAND_IN.pid);
    expect(rankInstitutions(ROWS, 'Éxample Colleg')[0].pid).toBe(STAND_IN.pid);
    expect(rankInstitutions(ROWS, 'of engineering').map(row => row.pid)).toEqual([STAND_IN.pid]);
  });

  it('[A-N97] the aliases column matches', () => {
    expect(rankInstitutions(ROWS, 'ESM')[0].pid).toBe('1-9000000004');
    expect(rankInstitutions(ROWS, 'sece example')[0].pid).toBe(STAND_IN.pid);
  });

  it('[A-N97] one or two typos still match, only when nothing matches exactly', () => {
    expect(editDistance('exmaple', 'example')).toBe(1);
    expect(rankInstitutions(ROWS, 'Sri Exmaple Colege')[0]).toMatchObject({ pid: STAND_IN.pid, matchTier: 3 });
    expect(rankInstitutions(ROWS, 'Managment')[0].pid).toBe('1-9000000004');
    expect(rankInstitutions(ROWS, 'zzzz qqqq')).toEqual([]);
  });

  it('[A-N97] short forms are expanded in the query only', () => {
    expect(expandQuery('Sri Example Coll of Engg')).toEqual(['sri', 'example', 'college', 'of', 'engineering']);
    expect(rankInstitutions(ROWS, 'Example Coll of Engg')[0].pid).toBe(STAND_IN.pid);
    expect(rankInstitutions(ROWS, 'example inst tech').map(row => row.pid)).toContain('1-9000000002');
    expect(STAND_IN.name).toBe('Sri Example College of Engineering');
  });

  it('[A-N97] ranking puts exact acronym, PID or ICID first, then prefix, then substring', () => {
    expect(rankInstitutions(ROWS, STAND_IN.pid)[0]).toMatchObject({ pid: STAND_IN.pid, matchTier: 0 });
    expect(rankInstitutions(ROWS, STAND_IN.icid.toLowerCase())[0]).toMatchObject({ pid: STAND_IN.pid, matchTier: 0 });
    const ranked = rankInstitutions(ROWS, 'example');
    expect(ranked.every((row, index) => index === 0 || ranked[index - 1].matchTier <= row.matchTier)).toBe(true);
    expect(rankInstitutions(ROWS, 'Southern')[0]).toMatchObject({ pid: '1-9000000002', matchTier: 1 });
  });

  it('[A-N97] results are bounded to 20 through the authorized search route', async () => {
    const { app, agent } = await admin();
    await seedInstitutionsAndRegions();
    await request(app).get('/api/v1/institutions/search?q=arohan').expect(401);
    const response = await agent.get('/api/v1/institutions/search').query({ q: 'school' }).expect(200);
    expect(response.body.institutions.length).toBeGreaterThan(0);
    expect(response.body.institutions.length).toBeLessThanOrEqual(20);
    const typo = await agent.get('/api/v1/institutions/search').query({ q: 'Arohn' }).expect(200);
    expect(typo.body.institutions.length).toBeGreaterThan(0);
    expect(typo.body.institutions.every(row => /arohan/i.test(row.name))).toBe(true);
  });

  it('[A-N97] official-list rows carry an "Official AICTE list as of" source badge; fictional rows do not claim it', async () => {
    await seedInstitutionsAndRegions();
    await OfficialInstitution.create({ ...STAND_IN, provenance: { sourceFileName: 'stand-in.csv', listDate: '2026-10-01', importedAt: new Date(), importer: 'sysadmin1', fileHash: 'x'.repeat(64) } });
    const { institutions } = await searchInstitutions({ q: 'sece' });
    expect(institutions[0]).toMatchObject({ pid: STAND_IN.pid, icid: STAND_IN.icid });
    expect(institutions[0].source.label).toBe('Official AICTE list as of 2026-10-01');
    const fictional = (await searchInstitutions({ q: 'arohan' })).institutions;
    expect(fictional.length).toBeGreaterThan(0);
    expect(fictional.every(row => row.source === undefined)).toBe(true);
  });

  it('[A-N97] an imported real-list college can never be the target of a demo grievance', async () => {
    await OfficialInstitution.create({ ...STAND_IN, provenance: { sourceFileName: 'stand-in.csv', listDate: '2026-10-01', importedAt: new Date(), importer: 'sysadmin1', fileHash: 'x'.repeat(64) } });
    const lookup = await getInstitutionByPid(STAND_IN.pid);
    expect(lookup.institution.source.kind).toBe('official');
    expect(() => assertNotRealListInDemo(lookup.institution)).toThrow(expect.objectContaining({ code: 'OFFICIAL_INSTITUTION_DEMO_BLOCKED' }));
    await seedInstitutionsAndRegions();
    const fictional = (await searchInstitutions({ q: 'arohan' })).institutions[0];
    const fictionalProfile = (await getInstitutionByPid(fictional.pid)).institution;
    expect(() => assertNotRealListInDemo(fictionalProfile)).not.toThrow();
  });
});

describe('[A-N98] official AICTE list import', () => {
  it('[A-N98] maps AICTE headers tolerantly, keeps quoted commas, reports unknown columns and never guesses missing values', () => {
    const parsed = parseOfficialCsv(`﻿${CSV}`);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]).toMatchObject({ pid: STAND_IN.pid, icid: STAND_IN.icid, name: STAND_IN.name, district: STAND_IN.district, city: STAND_IN.city, programmes: ['Engineering', 'Management'] });
    expect(parsed.rows[1].name).toBe('Southern Example Institute of Technology, Example Pur');
    expect(parsed.rows[1]).not.toHaveProperty('district');
    expect(parsed.rows[1]).not.toHaveProperty('region');
    expect(parsed.columns.unknown).toEqual(['Women Only']);
    expect(parsed.errors).toEqual([expect.objectContaining({ row: 4, errors: ['PID must match 1-XXXXXXXXXX'] })]);
  });

  it('[A-N98] the dry-run preview counts new, updated and rejected rows and writes nothing', async () => {
    await OfficialInstitution.create({ ...STAND_IN, provenance: { sourceFileName: 'old.csv', listDate: '2026-01-01', importedAt: new Date(), importer: 'sysadmin1', fileHash: 'y'.repeat(64) } });
    const preview = await previewOfficialImport({ csv: CSV, sourceFileName: 'aicte.csv', listDate: '2026-10-01', importer: 'sysadmin1' });
    expect(preview.counts).toEqual({ new: 1, updated: 1, rejected: 1 });
    expect(await OfficialInstitution.countDocuments()).toBe(1);
    expect((await OfficialInstitution.findOne({ pid: STAND_IN.pid }).lean()).provenance.listDate).toBe('2026-01-01');
  });

  it('[A-N98] only a system admin can preview or import (authorize)', async () => {
    const { app } = await admin();
    const officer = request.agent(app);
    await officer.post('/api/v1/auth/login').send({ username: 'supervisor1', password: 'demo1234' }).expect(200);
    await officer.post('/api/v1/registry/official/import/preview').send({ csv: CSV }).expect(403);
    await officer.post('/api/v1/registry/official/import').send({ csv: CSV, sourceFileName: 'a.csv', listDate: '2026-10-01', acceptValidRows: true }).expect(403);
    await request(app).post('/api/v1/registry/official/import').send({ csv: CSV }).expect(401);
    expect(await OfficialInstitution.countDocuments()).toBe(0);
  });

  it('[A-N98] confirming writes the valid rows with provenance and records one audit event', async () => {
    const { agent } = await admin();
    const blocked = await agent.post('/api/v1/registry/official/import').send({ csv: CSV, sourceFileName: 'aicte.csv', listDate: '2026-10-01' }).expect(422);
    expect(blocked.body.written).toBe(false);
    expect(await OfficialInstitution.countDocuments()).toBe(0);
    const result = await agent.post('/api/v1/registry/official/import').send({ csv: CSV, sourceFileName: 'aicte.csv', listDate: '2026-10-01', acceptValidRows: true }).expect(200);
    expect(result.body).toMatchObject({ written: true, counts: { new: 2, updated: 0, rejected: 1 } });
    const stored = await OfficialInstitution.findOne({ pid: STAND_IN.pid }).lean();
    expect(stored.provenance).toMatchObject({ sourceFileName: 'aicte.csv', listDate: '2026-10-01', importer: 'sysadmin1' });
    const events = await AuditEvent.find({ action: 'registry.official_import' }).lean();
    expect(events).toHaveLength(1);
    expect(events[0].meta.counts).toEqual({ new: 2, updated: 0, rejected: 1 });
  });
});
