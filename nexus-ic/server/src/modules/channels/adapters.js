// N32: snapshot/watermark adapter interface only. No network or partner credentials.
export class SourceAdapter {
  async snapshot(_watermark) { throw new Error('CONTRACT_NOT_CONFIGURED'); }
}
class SyntheticAdapter extends SourceAdapter {
  constructor(sourceSystem) { super(); this.sourceSystem = sourceSystem; }
  async snapshot(watermark = null) {
    return { sourceSystem: this.sourceSystem, synthetic: true, contractGated: true, records: [], watermark, status: 'SIMULATOR_NO_EXTERNAL_FEED' };
  }
}
export class AicteSimulator extends SyntheticAdapter { constructor() { super('AICTE'); } }
export class CpgramsSimulator extends SyntheticAdapter { constructor() { super('CPGRAMS'); } }
