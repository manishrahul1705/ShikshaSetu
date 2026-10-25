// Presentation labels only. Preserve source records and authoritative identifiers.
export function registryLabel(row) {
  if (!row?.source || row.source.kind === 'fictional') return 'Local registry record';
  return row.source.label || 'Registry record';
}
