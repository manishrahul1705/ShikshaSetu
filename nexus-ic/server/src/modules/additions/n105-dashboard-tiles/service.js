export function additionalTileCases(cases, transfers) {
  const accepted = new Set((transfers || []).filter(t => t.status === 'ACCEPTED').map(t => String(t.caseId)));
  return {
    underProcessCases: cases.filter(c => c.analyticStatus === 'IN_PROCESS'),
    transferredCases: cases.filter(c => accepted.has(String(c._id))),
    escalatedCases: cases.filter(c => c.isEscalated === true),
  };
}
export function additionalTiles(cases, transfers, scope, pct) {
  return Object.fromEntries(Object.entries(additionalTileCases(cases, transfers)).map(([key, rows]) => [key,
    key === 'transferredCases' && transfers === null ? { rowId: `tile:${key}`, result: 'UNKNOWN', reason: 'TRACE_NOT_AVAILABLE', count: null, share: null } :
      { rowId: `tile:${key}`, count: rows.length, share: pct(rows.length, cases.length, scope) }]));
}
