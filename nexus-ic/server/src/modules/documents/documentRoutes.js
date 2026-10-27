import { Router } from 'express';
import authorize from '../../middleware/authorize.js';
import Document from './Document.js';
import Case from '../cases/Case.js';
import { processUpload, getDecryptedDocument } from './documentService.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { record as recordAudit } from '../audit/audit.js';

const router = Router();

/**
 * POST /api/v1/documents/upload (N31, N52, S12)
 *
 * Upload a document (base64 payload).
 * Enforces:
 * - Allowed types (PDF, PNG, JPEG) and max 5MB (S12)
 * - Malware scan via MalwareScanSimulator (rejects EICAR) (N31, S12)
 * - Metadata scrubber (strips EXIF/device/author metadata) (N52)
 * - AES-256-GCM encryption with DOCS_KEY (N31)
 * - SHA-256 hash stored (S12)
 */
router.post(
  '/upload',
  authorize('student', 'faculty', 'institution_admin', 'bureau_officer', 'regional_officer'),
  async (req, res) => {
    try {
      const { bufferBase64, originalName, mimeType, caseId } = req.body;

      if (!bufferBase64 || !originalName || !mimeType) {
        return res.status(400).json({ error: 'Missing bufferBase64, originalName, or mimeType' });
      }

      const buffer = Buffer.from(bufferBase64, 'base64');

      const doc = await processUpload({
        buffer,
        originalName,
        mimeType,
        user: req.user,
        caseId: caseId || null,
      });

      res.status(201).json({
        documentId: doc._id,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        fileHash: doc.scrubbedHash,
        originalHash: doc.originalHash,
        metadataStripped: doc.metadataStripped,
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
  }
);

/**
 * GET /api/v1/documents/:id/download (N52, S10, S11)
 *
 * Server-proxied document download.
 * Raw storage paths and keys are NEVER exposed to the client (S11).
 * Re-checks authorization and case access on every download (S10).
 * Complainant gets original sealed version; officers/admins get scrubbed (N52).
 */
router.get(
  '/:id/download',
  authorize(),
  async (req, res) => {
    try {
      const documentId = req.params.id;
      const doc = await Document.findById(documentId);

      if (!doc) {
        await recordAudit({
          actorId: String(req.user._id || req.user.id),
          actorRole: req.user.role,
          action: 'document.access_denied_idor',
          targetType: 'Document',
          targetId: String(documentId),
          meta: { reason: 'DOCUMENT_NOT_FOUND' },
        });
        return res.status(404).json({ error: 'Document not found' });
      }

      // Locker files must always pass their case/officer/expiry grant gate,
      // including when an administrator knows the underlying document ID.
      const { LockerVersion, download } = await import('../additions/n83-document-locker/service.js');
      const lockerVersion = await LockerVersion.findOne({ documentId: doc._id }).lean();
      if (lockerVersion) {
        const data = await download(req.user, String(lockerVersion._id), req.query.caseId);
        return res.set('Cache-Control', 'no-store').type(data.mimeType).send(data.buffer);
      }

      // Check case scoping authorization (S10, S02)
      if (doc.caseId) {
        const caseDoc = await Case.findById(doc.caseId);
        if (!caseDoc) {
          await recordAudit({
            actorId: String(req.user._id || req.user.id),
            actorRole: req.user.role,
            action: 'document.access_denied_idor',
            targetType: 'Document',
            targetId: String(doc._id),
            meta: { reason: 'CASE_NOT_FOUND' },
          });
          return res.status(404).json({ error: 'Document not found' });
        }
        const allowed = await canAccessCase(req.user, caseDoc);
        if (!allowed) {
          await recordAudit({
            actorId: String(req.user._id || req.user.id),
            actorRole: req.user.role,
            action: 'document.access_denied_idor',
            targetType: 'Document',
            targetId: String(doc._id),
            meta: { reason: 'IDOR_DENIED' },
          });
          return res.status(404).json({ error: 'Document not found' });
        }

        // Anti-retaliation check (S25): Confirmed sensitive cases block institution_admin
        const { canAccessSensitiveNarrative } = await import('../lifecycle/accessControl.js');
        const canAccessSensitive = await canAccessSensitiveNarrative(req.user, caseDoc);
        if (!canAccessSensitive) {
          await recordAudit({
            actorId: String(req.user._id || req.user.id),
            actorRole: req.user.role,
            action: 'document.access_denied_sensitive',
            targetType: 'Document',
            targetId: String(doc._id),
            meta: { reason: 'SENSITIVE_CASE_RESTRICTED' },
          });
          return res.status(404).json({ error: 'Document not found' });
        }
      } else {
        // Unlinked draft document: only the uploader or system admins can download
        const isUploader = String(doc.uploadedBy) === String(req.user._id || req.user.id);
        const isAdmin = ['supervisor', 'competent_authority', 'system_admin', 'auditor'].includes(req.user.role);
        if (!isUploader && !isAdmin) {
          await recordAudit({
            actorId: String(req.user._id || req.user.id),
            actorRole: req.user.role,
            action: 'document.access_denied_idor',
            targetType: 'Document',
            targetId: String(doc._id),
            meta: { reason: 'DRAFT_IDOR_DENIED' },
          });
          return res.status(404).json({ error: 'Document not found' });
        }
      }

      // Decrypt document (complainant gets original, others get scrubbed) (N52)
      const decrypted = getDecryptedDocument(doc, req.user);

      // Record audit event for document download (S09, S10)
      await recordAudit({
        actorId: String(req.user._id || req.user.id || req.user.username),
        actorRole: req.user.role,
        action: 'document.downloaded',
        targetType: 'Document',
        targetId: String(doc._id),
        meta: {
          isOriginal: decrypted.isOriginal,
          mimeType: decrypted.mimeType,
          originalName: decrypted.originalName,
        },
      });

      // Stream / send file directly through server proxy (S11)
      res.setHeader('Content-Type', decrypted.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(decrypted.originalName)}"`
      );
      res.setHeader('X-Document-Hash', decrypted.hash);
      res.setHeader('X-Document-Original', decrypted.isOriginal ? 'true' : 'false');

      res.send(decrypted.buffer);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
  }
);

export default router;
