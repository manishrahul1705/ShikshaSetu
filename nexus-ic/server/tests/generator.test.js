import { describe, it, expect } from 'vitest';
import { generate } from '../src/modules/additions/n48-data-generator/generator.js';

describe('[A-N48] Realistic test-data generator', () => {
  it('[A-N48] same seed gives identical output', () => {
    const run1 = generate({ count: 100, seed: 42 });
    const run2 = generate({ count: 100, seed: 42 });

    // Institutions should be identical
    expect(run1.institutions.length).toBe(run2.institutions.length);
    for (let i = 0; i < run1.institutions.length; i++) {
      expect(run1.institutions[i].pid).toBe(run2.institutions[i].pid);
      expect(run1.institutions[i].name).toBe(run2.institutions[i].name);
      expect(run1.institutions[i].region).toBe(run2.institutions[i].region);
    }

    // Complainants should be identical
    expect(run1.complainants.length).toBe(run2.complainants.length);
    for (let i = 0; i < run1.complainants.length; i++) {
      expect(run1.complainants[i].pseudonymousId).toBe(run2.complainants[i].pseudonymousId);
    }

    // Complaints should be identical
    expect(run1.complaints.length).toBe(run2.complaints.length);
    for (let i = 0; i < run1.complaints.length; i++) {
      expect(run1.complaints[i].masterCaseId).toBe(run2.complaints[i].masterCaseId);
      expect(run1.complaints[i].narrative).toBe(run2.complaints[i].narrative);
    }
  });

  it('[A-N48] different seed gives different output', () => {
    const run1 = generate({ count: 50, seed: 42 });
    const run2 = generate({ count: 50, seed: 99 });

    // Should differ in at least some PIDs
    const pids1 = run1.institutions.map((i) => i.pid);
    const pids2 = run2.institutions.map((i) => i.pid);
    const overlap = pids1.filter((p) => pids2.includes(p));
    expect(overlap.length).toBeLessThan(pids1.length);
  });

  it('[A-N48] output contains typos, acronyms, Hindi and Tamil spellings', () => {
    // Use a large enough count to statistically hit all categories
    const data = generate({ count: 5000, seed: 42 });
    const allText = data.complaints.map((c) => c.narrative).join(' ');
    const allNames = data.institutions.map((i) => i.name).join(' ');

    // Check for typos (at least one should exist)
    const typoPatterns = ['collge', 'colege', 'collage', 'univrsity', 'engg.', 'engg',
      'enginering', 'admisson', 'mgmt', 'certifcate', 'compaint', 'infra'];
    const hasTypo = typoPatterns.some((t) => allText.toLowerCase().includes(t));
    expect(hasTypo).toBe(true);

    // Check for acronyms
    const acronyms = ['AICTE', 'UGC', 'NBA', 'NAAC', 'PGRC', 'RB'];
    const hasAcronym = acronyms.some((a) => allText.includes(a));
    expect(hasAcronym).toBe(true);

    // Check for Hindi spellings
    const hindiPatterns = ['शिकायत', 'shikayat', 'fees bahut', 'hostel ki',
      'प्रौद्योगिकी', 'Takniki', 'Abhiyantiki', 'Prodyogiki'];
    const hasHindi = hindiPatterns.some((h) => allText.includes(h) || allNames.includes(h));
    expect(hasHindi).toBe(true);

    // Check for Tamil spellings
    const tamilPatterns = ['புகார்', 'pugaar', 'romba', 'தொழில்நுட்ப',
      'Thozhilnutpa', 'Poriyiyal', 'Kalvi'];
    const hasTamil = tamilPatterns.some((t) => allText.includes(t) || allNames.includes(t));
    expect(hasTamil).toBe(true);
  });

  it('[A-N48] every record has synthetic: true', () => {
    const data = generate({ count: 200, seed: 42 });

    for (const inst of data.institutions) {
      expect(inst.synthetic).toBe(true);
    }
    for (const comp of data.complainants) {
      expect(comp.synthetic).toBe(true);
    }
    for (const complaint of data.complaints) {
      expect(complaint.synthetic).toBe(true);
    }
  });

  it('[A-N48] PIDs follow the correct format', () => {
    const data = generate({ count: 100, seed: 42 });
    for (const inst of data.institutions) {
      expect(inst.pid).toMatch(/^1-\d{10}$/);
    }
  });

  it('[A-N48] some institutions have ICID and some do not', () => {
    const data = generate({ count: 500, seed: 42 });
    const withICID = data.institutions.filter((i) => i.icid !== null);
    const withoutICID = data.institutions.filter((i) => i.icid === null);
    expect(withICID.length).toBeGreaterThan(0);
    expect(withoutICID.length).toBeGreaterThan(0);
  });
});
