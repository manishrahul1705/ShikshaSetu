import { describe, expect, it, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { searchInstitutions } from '../src/modules/registry/search.js';
import Institution from '../src/modules/institutions/Institution.js';
import InstitutionIdentifier from '../src/modules/institutions/InstitutionIdentifier.js';

beforeAll(async () => {
  
  await Institution.deleteMany({ pid: { $in: ['1-7734299101', '1-7734299102', '1-7734299103'] } });
  await InstitutionIdentifier.deleteMany({ pid: { $in: ['1-7734299101', '1-7734299103'] } });
});

describe('[A-N90] college name auto-fetch everywhere', () => {
  it('[A-N90] typing a college name, city, state, PID or ICID returns bounded results with auto-filled fields', async () => {
    // 1. Seed sample institutions
    await Institution.create([
      {
        pid: '1-7734299101',
        name: 'Vidyapeeth Institute of Technology',
        aliases: ['VIT'],
        city: 'Pune',
        state: 'Maharashtra',
        region: 'Western',
        type: 'Engineering',
        approvalStatus: 'approved',
        icid: 'IIC-WST00101',
      },
      {
        pid: '1-7734299102',
        name: 'Vidyapeeth College of Pharmacy',
        city: 'Nagpur',
        state: 'Maharashtra',
        region: 'Western',
        type: 'Pharmacy',
        approvalStatus: 'approved',
        icid: null,
      },
      {
        pid: '1-7734299103',
        name: 'Himalayan Science Academy',
        city: 'Dehradun',
        state: 'Uttarakhand',
        region: 'Northern',
        type: 'Management',
        approvalStatus: 'approved',
        icid: 'IIC-NTH00103',
      },
    ]);

    // Active mapping for 1-7734299101
    await InstitutionIdentifier.create([
      {
        pid: '1-7734299101',
        icid: 'IIC-WST00101',
        source: 'AISHE',
        status: 'active',
      },
      {
        pid: '1-7734299999', // Disputed mapping for IIC-NTH00103
        icid: 'IIC-NTH00103',
        source: 'AISHE',
        status: 'active',
      },
    ]);

    // Test Search by College Name
    const byName = await searchInstitutions({ q: 'Vidyapeeth' });
    expect(byName.authoritativeKey).toBe('pid');
    expect(byName.institutions.length).toBe(2);
    expect(byName.limit).toBe(20);

    // Verify first result has all required auto-fetch fields
    const tech = byName.institutions.find(i => i.pid === '1-7734299101');
    expect(tech).toBeDefined();
    expect(tech.name).toBe('Vidyapeeth Institute of Technology');
    expect(tech.city).toBe('Pune');
    expect(tech.state).toBe('Maharashtra');
    expect(tech.region).toBe('Western');
    expect(tech.type).toBe('Engineering');
    expect(tech.icid).toBe('IIC-WST00101');
    expect(tech.icidCheck).toBe('MATCH');

    const byAcronym = await searchInstitutions({ q: 'VIT' });
    expect(byAcronym.institutions.map(i => i.pid)).toContain('1-7734299101');

    // Verify second result with no ICID has NOT_AVAILABLE
    const pharm = byName.institutions.find(i => i.pid === '1-7734299102');
    expect(pharm).toBeDefined();
    expect(pharm.icid).toBeNull();
    expect(pharm.icidCheck).toBe('NOT_AVAILABLE');

    // Test Search by City
    const byCity = await searchInstitutions({ q: 'Dehradun' });
    expect(byCity.institutions.length).toBe(1);
    expect(byCity.institutions[0].pid).toBe('1-7734299103');
    // Conflict in mapping causes IDENTITY_REVIEW
    expect(byCity.institutions[0].icidCheck).toBe('IDENTITY_REVIEW');

    // Test Search by exact PID
    const byPid = await searchInstitutions({ q: '1-7734299101' });
    expect(byPid.institutions.length).toBe(1);
    expect(byPid.institutions[0].name).toBe('Vidyapeeth Institute of Technology');

    // Test Search by exact ICID
    const byIcid = await searchInstitutions({ q: 'IIC-WST00101' });
    expect(byIcid.institutions.length).toBe(1);
    expect(byIcid.institutions[0].pid).toBe('1-7734299101');

    // Verify field allowlist: no internal schema or sensitive fields leaked
    const keys = Object.keys(tech);
    const allowlist = ['pid', 'icid', 'name', 'city', 'state', 'region', 'type', 'approvalStatus', 'icidCheck'];
    for (const key of keys) {
      expect(allowlist).toContain(key);
    }
  });
});
