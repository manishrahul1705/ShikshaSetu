import { describe, expect, it } from 'vitest';
import { fictionalAdapter, liveAdapter, parseOfficialCsv, validateRegistryRow } from '../src/modules/registry/adapters.js';

describe('[A-N96] institution registry adapters', () => {
  it('[A-N96] validates AICTE PID and optional ICID without guessing values', () => {
    expect(validateRegistryRow({ pid: '1-1234567890', icid: 'IIC-ABC12345', name: 'Synthetic College', state: 'Delhi' }).valid).toBe(true);
    expect(validateRegistryRow({ pid: 'unknown', name: 'Synthetic College', state: 'Delhi' }).valid).toBe(false);
  });

  it('[A-N96] parses an official CSV and rejects invalid rows', () => {
    const result = parseOfficialCsv('pid,name,state,icid,aliases\n1-1234567890,Synthetic College,Delhi,IIC-ABC12345,SC;Synthetic College\nbad,Broken College,Delhi,');
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.rows[0].aliases).toEqual(['SC', 'Synthetic College']);
  });

  it('[A-N96] keeps the fictional catalogue clearly labelled', () => {
    const row = fictionalAdapter.getByPid(fictionalAdapter.search('Arohan')[0].pid);
    expect(row.synthetic).toBe(true);
    expect(fictionalAdapter.describe().label).toBe('Fictional demo data');
  });

  it('[A-N96] exposes the live adapter as disabled and never performs a network call', () => {
    expect(liveAdapter.describe().enabled).toBe(false);
    expect(() => liveAdapter.getByIcid('IIC-ABC12345')).toThrow('LIVE_IIC_AICTE_LOOKUP_NOT_CONFIGURED');
  });
});
