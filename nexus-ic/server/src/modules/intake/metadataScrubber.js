import crypto from 'crypto';
import logger from '../../config/logger.js';

/**
 * N52 (Addition): Hidden-data scrubber for uploads.
 *
 * Strips EXIF metadata, device info, GPS, and author headers
 * from JPEG, PNG, and PDF uploads before officers or institution admins can view them.
 * Seals the original with its SHA-256 hash, viewable only by the complainant.
 */

/**
 * Compute SHA-256 hash of a buffer.
 */
export function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Strip EXIF from JPEG.
 * Removes APP1 (EXIF: 0xFFE1) and APP13 (IPTC: 0xFFED) segments.
 * Returns cleaned buffer.
 */
function stripJpegExif(buffer) {
  if (buffer.length < 2 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const result = [Buffer.from([0xff, 0xd8])];
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) break;

    const marker = buffer[offset + 1];

    // SOS (Start of Scan) — rest is image data, copy remaining
    if (marker === 0xda) {
      result.push(buffer.slice(offset));
      break;
    }

    // Get segment length
    if (offset + 3 >= buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset + 2);
    const segmentEnd = offset + 2 + segmentLength;

    // Skip APP1 (EXIF: 0xE1) and APP13 (IPTC: 0xED)
    if (marker === 0xe1 || marker === 0xed) {
      logger.debug({ action: 'metadata_strip_jpeg', marker: `0x${marker.toString(16)}` });
      offset = segmentEnd;
      continue;
    }

    result.push(buffer.slice(offset, segmentEnd));
    offset = segmentEnd;
  }

  return Buffer.concat(result);
}

/**
 * Strip metadata chunks from PNG.
 * Removes tEXt, iTXt, zTXt, eXIf chunks.
 */
function stripPngMetadata(buffer) {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 8 || buffer.compare(PNG_SIG, 0, 8, 0, 8) !== 0) {
    return buffer;
  }

  const METADATA_CHUNKS = ['tEXt', 'iTXt', 'zTXt', 'eXIf'];
  const result = [PNG_SIG];
  let offset = 8;

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;

    const chunkLength = buffer.readUInt32BE(offset);
    const chunkType = buffer.slice(offset + 4, offset + 8).toString('ascii');
    const totalChunkSize = 4 + 4 + chunkLength + 4; // length + type + data + CRC

    if (METADATA_CHUNKS.includes(chunkType)) {
      logger.debug({ action: 'metadata_strip_png', chunkType });
      offset += totalChunkSize;
      continue;
    }

    result.push(buffer.slice(offset, offset + totalChunkSize));
    offset += totalChunkSize;
  }

  return Buffer.concat(result);
}

/**
 * Strip author and edit history metadata from PDF.
 * Strips /Author, /Creator, /Producer, /CreationDate, /ModDate, and XMP packets.
 */
function stripPdfMetadata(buffer) {
  if (buffer.length < 5 || !buffer.slice(0, 5).toString('ascii').startsWith('%PDF-')) {
    return { scrubbed: buffer, stripped: false };
  }

  let str = buffer.toString('binary');
  let stripped = false;

  const patterns = [
    /\/Author\s*\([^)]*\)/gi,
    /\/Creator\s*\([^)]*\)/gi,
    /\/Producer\s*\([^)]*\)/gi,
    /\/CreationDate\s*\([^)]*\)/gi,
    /\/ModDate\s*\([^)]*\)/gi,
    /<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/gi,
  ];

  for (const re of patterns) {
    if (re.test(str)) {
      str = str.replace(re, '');
      stripped = true;
    }
  }

  return { scrubbed: Buffer.from(str, 'binary'), stripped };
}

/**
 * Scrub hidden data from an uploaded file.
 *
 * @param {Buffer} buffer - File content
 * @param {string} mimeType - MIME type ('image/jpeg', 'image/png', 'application/pdf')
 * @returns {{ scrubbed: Buffer, originalHash: string, stripped: boolean }}
 */
export function scrub(buffer, mimeType) {
  const originalHash = hashBuffer(buffer);

  if (mimeType === 'image/jpeg') {
    const scrubbed = stripJpegExif(buffer);
    return { scrubbed, originalHash, stripped: scrubbed.length !== buffer.length };
  }

  if (mimeType === 'image/png') {
    const scrubbed = stripPngMetadata(buffer);
    return { scrubbed, originalHash, stripped: scrubbed.length !== buffer.length };
  }

  if (mimeType === 'application/pdf') {
    const { scrubbed, stripped } = stripPdfMetadata(buffer);
    return { scrubbed, originalHash, stripped };
  }

  return { scrubbed: buffer, originalHash, stripped: false };
}
