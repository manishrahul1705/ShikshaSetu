import crypto from 'node:crypto';
function key() {
  const value = process.env.VAULT_KEY;
  if (!/^[a-fA-F0-9]{64}$/.test(value || '')) throw Object.assign(new Error('VAULT_KEY_NOT_CONFIGURED'), { status: 503, code: 'VAULT_KEY_NOT_CONFIGURED' });
  return Buffer.from(value, 'hex');
}
export function seal(payload, reporterId) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(reporterId));
  const encryptedPayload = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]).toString('base64');
  return { encryptedPayload, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), keyRef: 'VAULT_KEY-v1' };
}
export function open(row, reporterId) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(row.iv, 'base64'));
  decipher.setAAD(Buffer.from(reporterId));
  decipher.setAuthTag(Buffer.from(row.tag, 'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(row.encryptedPayload, 'base64')), decipher.final()]).toString('utf8'));
}
export const fingerprint = (value) => crypto.createHmac('sha256', key()).update(value).digest('hex');
