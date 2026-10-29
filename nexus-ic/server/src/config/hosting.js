// Accept serialized HTTP(S) origins only, without paths or wildcards.
export function parseClientOrigins(value, canonicalOrigin) {
  const entries = value?.trim() ? value.split(',').map((entry) => entry.trim()) : [canonicalOrigin];
  for (const entry of entries) {
    let url;
    try { url = new URL(entry); } catch { throw new Error('CLIENT_ORIGINS must contain exact HTTP(S) origins'); }
    if (!['http:', 'https:'].includes(url.protocol) || entry.includes('*') || url.origin !== entry) {
      throw new Error('CLIENT_ORIGINS must contain exact HTTP(S) origins');
    }
  }
  return Object.freeze([...new Set(entries)]);
}

export function parseTrustProxyHops(value = '0') {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
  }
  return Number(value);
}
