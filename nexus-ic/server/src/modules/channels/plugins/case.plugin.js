import { importContext } from '../importContext.js';
// Only S6a's import invocation has this context. S1b/S2 behavior elsewhere is untouched.
export default function channelImportPlugin(schema) {
  const channel = schema.path('channel');
  const additions = ['WEB', 'PWA', 'EMAIL', 'IMPORT'].filter(value => !channel.enumValues.includes(value));
  if (additions.length) channel.enum(...additions);
  if (!schema.path('externalRefs').schema.path('sourceRef')) schema.path('externalRefs').schema.add({ sourceRef: { type: String } });
  schema.pre('validate', function () {
    if (!this.isNew) return;
    const context = importContext.getStore();
    const institution = context?.get(this.institutionPid);
    if (institution && this.channel === 'import') this.channel = 'IMPORT';
    if (['EMAIL', 'IMPORT'].includes(this.channel)) {
      for (const ref of this.externalRefs || []) ref.sourceRef = ref.sourceRef || ref.sourceCaseRef;
    }
    if (!institution) return;
    this.pidSnapshot = { pid: institution.pid, name: institution.name, state: institution.state, region: institution.region, type: institution.type, approvalStatus: institution.approvalStatus };
    this.institutionIcid = institution.icid === 'not available' ? null : institution.icid;
    this.icidSnapshot = { icid: institution.icid || 'not available' };
  });
}
