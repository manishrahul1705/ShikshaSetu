import { it, expect, vi, afterEach } from 'vitest';
import http from 'node:http';
import https from 'node:https';
import { WEIGHTS, localSemantic } from '../src/modules/prevent/signals.js';
import { matchCases } from '../src/modules/prevent/matcher.js';
import { getRules } from '../src/modules/prevent/rules.js';
import Identifier from '../src/modules/institutions/InstitutionIdentifier.js';
afterEach(() => vi.restoreAllMocks());
const draft = { institutionPid: '1-1000000001', category: 'DEMO fee', subCategory: 'DEMO refund', narrative: 'refund fee document not provided', period: { start: '2026-01-01', end: '2026-01-31' }, remedy: 'refund', entities: ['synthetic-lab'], documentIds: ['same-document'] };
it('[N16] seven weights are exact and every signal explains its contribution', async () => {
  expect(Object.values(WEIGHTS)).toEqual([25,15,10,15,10,10,15]);
  expect(Object.values(WEIGHTS).reduce((a,b) => a+b)).toBe(100);
  const result = await matchCases(draft, draft);
  expect(result.result).toBe('REVIEW'); expect(result.score).toBe(100);
  expect(result.signals).toHaveLength(7);
  for (const signal of result.signals) { expect(signal.reason).toBeTruthy(); expect(signal.value).toBeGreaterThanOrEqual(0); expect(signal.value).toBeLessThanOrEqual(1); }
  expect((await matchCases(draft, { ...draft, narrative: 'unrelated broken kitchen drain', remedy: 'repair', entities: [], documentIds: [], subCategory: 'DEMO pipes', period: undefined })).result).toBe('CLEAR');
});
it('[N16] different PIDs never match and an ICID conflict forces REVIEW', async () => {
  expect((await matchCases(draft, { ...draft, institutionPid: '1-1000000002', name: 'Nearly identical institution name' })).reasons).toContain('PID_MISMATCH');
  await Identifier.create({ icid: 'IIC-AAAABBBB', pid: '1-1000000002', synthetic: true });
  const result = await matchCases({ ...draft, institutionIcid: 'IIC-AAAABBBB' }, { ...draft, narrative: 'different issue' });
  expect(result.result).toBe('REVIEW'); expect(result.identity).toBe('IDENTITY_REVIEW');
});
it('[N16] Hindi and Tamil semantic evidence is local with all network calls forbidden', async () => {
  const denied = () => { throw new Error('NETWORK_FORBIDDEN'); };
  vi.spyOn(http, 'request').mockImplementation(denied); vi.spyOn(http, 'get').mockImplementation(denied);
  vi.spyOn(https, 'request').mockImplementation(denied); vi.spyOn(https, 'get').mockImplementation(denied); vi.spyOn(globalThis, 'fetch').mockImplementation(denied);
  for (const text of ['शुल्क वापस नहीं दिया गया', 'கட்டணம் திரும்ப வழங்கப்படவில்லை']) {
    expect(localSemantic(text,text)).toBe(1);
    const result = await matchCases({ ...draft, narrative: text }, { ...draft, narrative: text });
    expect(result.signals.find(s => s.name === 'semantic').value).toBe(1);
  }
  expect(fetch).not.toHaveBeenCalled(); expect(http.request).not.toHaveBeenCalled(); expect(https.request).not.toHaveBeenCalled();
});
it('[N17] production without approved RuleBook policy is UNKNOWN, never a DEMO rule', async () => {
  const previous = process.env.APP_MODE; process.env.APP_MODE = 'production';
  try { expect(await getRules()).toEqual({ configured: false, reason: 'POLICY_NOT_CONFIGURED' }); expect((await matchCases(draft,draft)).result).toBe('UNKNOWN'); }
  finally { process.env.APP_MODE = previous; }
});
it('[N17] default app mode uses the same demo default as S0 configuration', async () => {
  const previous = process.env.APP_MODE; delete process.env.APP_MODE;
  try { expect((await getRules()).configured).toBe(true); expect((await getRules()).synthetic).toBe(true); }
  finally { process.env.APP_MODE = previous; }
});
