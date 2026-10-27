import { generate } from '../additions/n48-data-generator/generator.js';
import { listInstitutions, lookup } from '../registry/RegistrySimulator.js';
export const ADAPTER_SOURCES = Object.freeze(['AICTE systems', 'institution registry', 'CPGRAMS']);
export class SourceAdapter {
  async snapshot(_watermark = null) { return { result: 'CONTRACT_NOT_CONFIGURED' }; }
}
export class RealAdapter extends SourceAdapter {
  constructor(sourceSystem) { super(); this.sourceSystem = sourceSystem; }
  async snapshot() { return { result: 'CONTRACT_NOT_CONFIGURED' }; }
}
export class SimulatorAdapter extends SourceAdapter {
  constructor(sourceSystem) {
    super(); if (!ADAPTER_SOURCES.includes(sourceSystem)) throw new Error('UNKNOWN_ADAPTER');
    this.sourceSystem = sourceSystem;
  }
  async snapshot(watermark = null) {
    if (this.sourceSystem === 'institution registry') {
      const snapshots = listInstitutions(3).map(row => lookup(row.pid));
      if (snapshots.some(row => !row.found)) return { sourceSystem: this.sourceSystem, synthetic: true, watermark, result: 'UNKNOWN', reason: 'REGISTRY_UNAVAILABLE' };
      return { sourceSystem: this.sourceSystem, synthetic: true, watermark, records: snapshots.map(({profile:row}) => ({ institutionIdentifiers: { pid: row.pid, icid: row.icid || null }, snapshot: { ...row, synthetic: true } })) };
    }
    const { complaints } = generate({ count: 10, seed: `S6a-${this.sourceSystem}` });
    return { sourceSystem: this.sourceSystem, synthetic: true, watermark, records: complaints.map(row => ({
      institutionIdentifiers: { pid: row.institutionPid, icid: row.institutionIcid || null },
      externalRefs: { sourceSystem: this.sourceSystem, sourceRef: row.masterCaseId },
      snapshot: { category: row.category, subCategory: row.subCategory, narrative: row.narrative, synthetic: true },
    })) };
  }
}
export const adapters = Object.fromEntries(ADAPTER_SOURCES.map(source => [source, { simulator: new SimulatorAdapter(source), real: new RealAdapter(source) }]));
