import { describe, expect, it, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { evaluateRouting } from '../src/modules/routing/routingEngine.js';
import { DEMO_ACCOUNTS, seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import InstitutionIdentifier from '../src/modules/institutions/InstitutionIdentifier.js';

beforeEach(async () => {
  await seedDemoAccounts();
  await seedRuleBook();
});

describe('[A-N92] ICID-based regional routing to Regional Grievance Cell', () => {
  it('[A-N92] routes to Regional Grievance Cell with explainable ICID and PID reason', async () => {
    await InstitutionIdentifier.create({ pid: '1-7734299101', icid: 'IIC-WST00101', status: 'active' });
    const caseDoc = {
      _id: '507f1f77bcf86cd799439011',
      category: 'Fee Dispute',
      subCategory: 'Overcharging',
      institutionPid: '1-7734299101',
      pidSnapshot: {
        pid: '1-7734299101',
        name: 'Vidyapeeth Institute of Technology',
        region: 'Western',
        institutionType: 'Engineering',
      },
      icidSnapshot: {
        icid: 'IIC-WST00101',
      },
    };

    const instProfile = {
      pid: '1-7734299101',
      region: 'Western',
      icid: 'IIC-WST00101',
      institutionType: 'Engineering',
      status: 'VERIFIED',
      approvalStatus: 'approved',
    };

    const result = await evaluateRouting(caseDoc, instProfile);

    // Primary bureau assigned
    expect(result.primary).toBe('PGRC');

    // Secondary routed to Regional Grievance Cell (Western)
    expect(result.secondary).toBe('Regional Grievance Cell (Western)');

    // Explainable reason stored
    const hasExplainReason = result.reasons.some((r) =>
      r.includes('Region Western from PID 1-7734299101 (ICID IIC-WST00101 MATCH)')
    );
    expect(hasExplainReason).toBe(true);
    expect(result.factors.regionalCell).toBe('Regional Grievance Cell (Western)');
  });

  it('[A-N92] routes accurately across all 6 AICTE regions', async () => {
    const regions = [
      { region: 'Northern', pid: '1-7734299103', icid: 'IIC-NTH00103' },
      { region: 'Western', pid: '1-7734299101', icid: 'IIC-WST00101' },
      { region: 'Southern', pid: '1-7734299104', icid: 'IIC-STH00104' },
      { region: 'Central', pid: '1-7734299105', icid: 'IIC-CTR00105' },
      { region: 'Eastern', pid: '1-7734299106', icid: 'IIC-EST00106' },
      { region: 'North Eastern', pid: '1-7734299107', icid: 'IIC-NER00107' },
    ];

    for (const item of regions) {
      const caseDoc = {
        _id: '507f1f77bcf86cd799439099',
        category: 'Fee Dispute',
        subCategory: 'Overcharging',
        institutionPid: item.pid,
      };

      const instProfile = {
        pid: item.pid,
        region: item.region,
        icid: item.icid,
        institutionType: 'Engineering',
        status: 'VERIFIED',
        approvalStatus: 'approved',
      };

      const result = await evaluateRouting(caseDoc, instProfile);
      expect(result.secondary).toBe(`Regional Grievance Cell (${item.region})`);
      expect(result.reasons.some((r) => r.includes(`Region ${item.region} from PID ${item.pid}`))).toBe(true);
    }
  });

  it('[A-N92] never treats a missing or mismatched IIC ID as a verified match', async () => {
    const base = { _id: new mongoose.Types.ObjectId(), category: 'Fee Dispute', subCategory: 'Overcharging', institutionPid: '1-7734299101' };
    const profile = { pid: base.institutionPid, region: 'Western', approvalStatus: 'approved', status: 'VERIFIED' };
    const missing = await evaluateRouting({ ...base, icidSnapshot: { icid: 'not available' } }, profile);
    expect(missing.factors.icidCheck).toBe('NOT_AVAILABLE');
    expect(missing.reasons.join(' ')).not.toContain('ICID not available MATCH');
    await InstitutionIdentifier.create({ pid: '1-7734299999', icid: 'IIC-WST00101', status: 'active' });
    const mismatch = await evaluateRouting({ ...base, icidSnapshot: { icid: 'IIC-WST00101' } }, profile);
    expect(mismatch.factors.icidCheck).toBe('IDENTITY_REVIEW');
    expect(mismatch.isManualReview).toBe(true);
    expect(mismatch.factors.regionalCell).toBe('Regional Grievance Cell (Western)');
  });

  it('[A-N92] seeds regional officer accounts for all 6 AICTE regions', () => {
    const regionalUsers = DEMO_ACCOUNTS.filter((u) => u.role === 'regional_officer');
    const coveredRegions = regionalUsers.map((u) => u.region);

    expect(coveredRegions).toContain('Northern');
    expect(coveredRegions).toContain('Western');
    expect(coveredRegions).toContain('Southern');
    expect(coveredRegions).toContain('Central');
    expect(coveredRegions).toContain('Eastern');
    expect(coveredRegions).toContain('North Eastern');
  });
});
