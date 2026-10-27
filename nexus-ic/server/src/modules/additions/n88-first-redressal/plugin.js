export default function firstRedressal(schema) {
  schema.add({ institutionRedressal: { answer: { type: String, enum: ['YES', 'NO', 'NOT_APPLICABLE'] }, raisedAt: Date, outcome: String } });
}
// Optional context never acts as an intake gate. No regulation is assumed.
export function normalizeRedressal(value) {
  if (!value || !['YES', 'NO', 'NOT_APPLICABLE'].includes(value.answer)) return undefined;
  const result = { answer: value.answer };
  if (value.answer === 'YES') {
    const date = new Date(value.raisedAt);
    if (value.raisedAt && Number.isFinite(date.getTime())) result.raisedAt = date;
    if (typeof value.outcome === 'string') result.outcome = value.outcome.trim().slice(0, 2000);
  }
  return result;
}
