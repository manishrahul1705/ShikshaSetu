// Appendix W (N68–N80) uses the original Nxx test tags. Approved additions
// N46–N67 and N81 onward use A-Nxx; do not turn real evidence into missing tests.
export function evidenceIds(features) {
  return features.map(id => {
    const number = Number(id.slice(1));
    return (number >= 46 && number <= 67) || number >= 81 ? `A-${id}` : id;
  });
}
