// Presentation aliases for these two controlled category values only. Stored
// categories, routing keys and original complaint text are never modified.
export function metadataLabel(value) {
  return ({ 'Fake Affiliation': 'Unverified Affiliation', 'Fake Offer Letters': 'Invalid Offer Letters' })[value] || value;
}
// Only controlled, generated metadata sentences; never complaint or evidence text.
export function metadataText(value) {
  return String(value || '').replace(/Fake Affiliation|Fake Offer Letters/g, metadataLabel);
}
