// A small, dependency-free PDF writer for a text ledger. No case narratives or identities.
const literal = value => String(value).replace(/[^\x20-\x7e]/g, '?').replace(/([\\()])/g, '\\$1');
export function monthlyPdf(report, mark) {
  const lines = [`ShikshaSetu - powered by NEXUS-IC`, 'Connecting Institutions. Coordinating Action. Resolving Grievances.', report.quarter ? `Quarterly pendency: ${report.quarter}` : `Monthly pendency: ${report.month}`, report.scope,
    `Scoped cases: ${report.denominator}. Calendar: Asia/Kolkata.`,
    `Incomplete historical evidence: ${report.incompleteHistoryCases}.`,
    'O: opening; R: received; D: disposed; OUT/IN: accepted transfers; C: closing.',
    ...report.rows.flatMap(r => [`${r.kind}: ${r.name}`,
      `O ${r.counts.opening} | R ${r.counts.received} | D ${r.counts.disposed} | OUT ${r.counts.transferredOut} | IN ${r.counts.transferredIn} | C ${r.counts.closing}`,
      `Escalated ${r.counts.escalated} | Age 0-15 ${r.counts.age0to15}, 16-30 ${r.counts.age16to30}, 31-60 ${r.counts.age31to60}, >60 ${r.counts.ageOver60}`,
      `Balance difference: ${r.difference}. ${r.reconciles ? 'Reconciled' : 'Not certified'}.`,
      ...(report.quarter ? [`Disposal rate: ${r.disposalRate.value === null ? 'Not available' : r.disposalRate.value + '%'} (${r.disposalRate.numerator}/${r.disposalRate.denominator}).`] : [])])];
  const wrapped = lines.flatMap(line => String(line).match(/.{1,100}/g) || ['']);
  const pages = Array.from({length: Math.max(1, Math.ceil(wrapped.length / 43))}, (_,i) => wrapped.slice(i*43,(i+1)*43));
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pageIds = [];
  for (const [i, page] of pages.entries()) {
    const pageId = objects.length + 1, streamId = pageId + 1; pageIds.push(pageId);
    const stream = `BT /F1 10 Tf 40 800 Td 15 TL ${page.map(line => `(${literal(line)}) Tj T*`).join('\n')} ET\nBT /F1 7 Tf 40 60 Td (${literal(mark.footer)}) Tj 0 -12 Td (Page ${i+1} of ${pages.length}) Tj ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`, `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] >>`;
  const hidden = Buffer.from(mark.invisible, 'utf16le'); hidden.swap16();
  objects.push(`<< /Subject <FEFF${hidden.toString('hex')}> /Keywords (${literal(mark.code)}) >>`);
  let pdf = '%PDF-1.4\n', offsets = [0];
  objects.forEach((obj,i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i+1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
