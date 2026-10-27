import crypto from 'node:crypto';
import Document from './Document.js';
import { validateUpload } from '../intake/config.js';
import { scan } from '../intake/MalwareScanSimulator.js';
import { scrub, hashBuffer } from '../intake/metadataScrubber.js';
import { record as recordAudit } from '../audit/audit.js';
import logger from '../../config/logger.js';

/**
 * Retrieve the AES-256-GCM document encryption key.
 * Enforces:
 * 1. DOCS_KEY must be a 64-hex character string (32 bytes).
 * 2. DOCS_KEY must NEVER reuse VAULT_KEY (N31).
 */
export function getDocsKey() {
  const docsKey = process.env.DOCS_KEY;
  if (!docsKey || !/^[a-fA-F0-9]{64}$/.test(docsKey)) {
    throw Object.assign(new Error('DOCS_KEY_NOT_CONFIGURED'), { status: 503, code: 'DOCS_KEY_NOT_CONFIGURED' });
  }

  const vaultKey = process.env.VAULT_KEY;
  if (vaultKey && docsKey.toLowerCase() === vaultKey.toLowerCase()) {
    throw Object.assign(new Error('DOCS_KEY_CANNOT_REUSE_VAULT_KEY'), {
      status: 500,
      code: 'DOCS_KEY_CANNOT_REUSE_VAULT_KEY',
    });
  }

  return Buffer.from(docsKey, 'hex');
}

/**
 * Encrypt a buffer with AES-256-GCM.
 */
export function encryptBuffer(buffer, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedPayload: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Decrypt a base64 payload with AES-256-GCM.
 */
export function decryptBuffer(encryptedPayloadBase64, ivBase64, tagBase64, key) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivBase64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPayloadBase64, 'base64')),
    decipher.final(),
  ]);
}

/**
 * Process a document upload (N31, N52, S12).
 *
 * @param {Object} params
 * @param {Buffer} params.buffer
 * @param {string} params.originalName
 * @param {string} params.mimeType
 * @param {Object} params.user
 * @param {string} [params.caseId]
 * @returns {Promise<Document>}
 */
export async function processUpload({ buffer, originalName, mimeType, user, caseId = null }) {
  // 1. Validation: type and size (S12)
  const validation = validateUpload(mimeType, buffer.length);
  if (!validation.valid) {
    const err = new Error(validation.reason);
    err.status = 400;
    err.code = 'INVALID_UPLOAD';
    throw err;
  }

  // 2. Malware scan (N31, S12)
  const scanResult = scan(buffer);
  if (scanResult.status === 'infected') {
    logger.warn({ action: 'upload_rejected_malware', mimeType, size: buffer.length });
    const err = new Error(`Malware detected: ${scanResult.details || 'Infected file'}`);
    err.status = 400;
    err.code = 'MALWARE_DETECTED';
    throw err;
  }

  // 3. Hidden-data scrubber (N52)
  const { scrubbed, originalHash, stripped } = scrub(buffer, mimeType);
  const scrubbedHash = hashBuffer(scrubbed);

  // 4. Encrypt both original and scrubbed with AES-256-GCM using DOCS_KEY (N31)
  const key = getDocsKey();
  const originalEncrypted = encryptBuffer(buffer, key);
  const scrubbedEncrypted = encryptBuffer(scrubbed, key);

  // 5. Store document record
  const doc = await Document.create({
    caseId,
    originalName,
    mimeType,
    sizeBytes: buffer.length,
    originalHash,
    scrubbedHash,
    encryptedOriginal: originalEncrypted.encryptedPayload,
    originalIv: originalEncrypted.iv,
    originalTag: originalEncrypted.tag,
    encryptedScrubbed: scrubbedEncrypted.encryptedPayload,
    scrubbedIv: scrubbedEncrypted.iv,
    scrubbedTag: scrubbedEncrypted.tag,
    malwareScanStatus: 'clean',
    metadataStripped: stripped,
    uploadedBy: user._id || user.id,
    synthetic: true,
  });

  // Audit event (S09)
  await recordAudit({
    actorId: String(user._id || user.id || user.username),
    actorRole: user.role,
    action: 'document.uploaded',
    targetType: 'Document',
    targetId: String(doc._id),
    meta: {
      originalName,
      mimeType,
      sizeBytes: buffer.length,
      originalHash,
      metadataStripped: stripped,
    },
  });

  return doc;
}

/**
 * Retrieve and decrypt document (N52, S10, S11).
 * Complainant gets original, officers/admins get scrubbed version.
 *
 * @param {Document} doc
 * @param {Object} user
 * @returns {{ buffer: Buffer, mimeType: string, originalName: string, isOriginal: boolean }}
 */
export function getDecryptedDocument(doc, user) {
  const key = getDocsKey();

  // Complainant sees original; officers and institution admins see scrubbed (N52)
  const isComplainant =
    (user.role === 'student' || user.role === 'faculty') &&
    String(doc.uploadedBy) === String(user._id || user.id);

  if (isComplainant) {
    const buffer = decryptBuffer(
      doc.encryptedOriginal,
      doc.originalIv,
      doc.originalTag,
      key
    );
    return {
      buffer,
      mimeType: doc.mimeType,
      originalName: doc.originalName,
      isOriginal: true,
      hash: doc.originalHash,
    };
  }

  // Officers, institution admins, auditors see scrubbed version
  const buffer = decryptBuffer(
    doc.encryptedScrubbed,
    doc.scrubbedIv,
    doc.scrubbedTag,
    key
  );
  return {
    buffer,
    mimeType: doc.mimeType,
    originalName: doc.originalName,
    isOriginal: false,
    hash: doc.scrubbedHash,
  };
}
