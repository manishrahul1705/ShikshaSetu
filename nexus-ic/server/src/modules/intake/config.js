/**
 * Intake configuration (DEMO).
 *
 * NOTE: These are DEMO values, not from source. In production,
 * these would be set by AICTE policy (POLICY_NOT_CONFIGURED).
 */

// DEMO: upload limits — not from source; set by AICTE policy
export const UPLOAD_CONFIG = {
  maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
  allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  maxFilesPerCase: 5,
  label: 'DEMO',
  _comment: 'not from source; set by AICTE policy',
};

// DEMO: burst submission threshold — not from source; set by AICTE policy
export const BURST_CONFIG = {
  maxSubmissionsInWindow: 5,
  windowMinutes: 10,
  label: 'DEMO',
  _comment: 'not from source; set by AICTE policy',
};

// DEMO: category list for grievance submission
export const DEMO_CATEGORIES = {
  version: 'DEMO-CATEGORIES-v1',
  label: 'DEMO',
  synthetic: true,
  categories: [
    {
      name: 'Fee Dispute',
      subCategories: ['Overcharging', 'Refund Denial', 'Hidden Fees'],
      sensitive: false,
    },
    {
      name: 'Faculty Shortage',
      subCategories: ['Unfilled Positions', 'Unqualified Faculty', 'Absent Faculty'],
      sensitive: false,
    },
    {
      name: 'Infrastructure',
      subCategories: ['Lab Equipment', 'Building Safety', 'Library', 'Sanitation'],
      sensitive: false,
    },
    {
      name: 'Ragging',
      subCategories: ['Physical', 'Verbal', 'Cyberbullying', 'Coercion'],
      sensitive: true,
    },
    {
      name: 'Admission Irregularity',
      subCategories: ['Seat Allocation', 'Document Fraud', 'Counselling Process'],
      sensitive: false,
    },
    {
      name: 'Affiliation Issue',
      subCategories: ['Unapproved Course', 'Fake Affiliation', 'Expired Approval'],
      sensitive: false,
    },
    {
      name: 'Placement Fraud',
      subCategories: ['False Statistics', 'Fake Offer Letters', 'Forced Placement Fee'],
      sensitive: false,
    },
    {
      name: 'Hostel Complaint',
      subCategories: ['Safety', 'Food Quality', 'Maintenance', 'Overcrowding'],
      sensitive: false,
    },
    {
      name: 'Exam Irregularity',
      subCategories: ['Paper Leak', 'Evaluation Error', 'Impersonation'],
      sensitive: false,
    },
    {
      name: 'Safety Concern',
      subCategories: ['Fire Safety', 'Women Safety', 'Harassment', 'Structural Hazard'],
      sensitive: true,
    },
  ],
};

/**
 * Check whether a category is sensitive (triggers quick-exit N58).
 */
export function isSensitiveCategory(categoryName) {
  const cat = DEMO_CATEGORIES.categories.find((c) => c.name === categoryName);
  return cat ? cat.sensitive : false;
}

/**
 * Validate uploaded file type and size.
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateUpload(mimeType, sizeBytes) {
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(mimeType)) {
    return { valid: false, reason: `File type '${mimeType}' not allowed. Accepted: ${UPLOAD_CONFIG.allowedMimeTypes.join(', ')}` };
  }
  if (sizeBytes > UPLOAD_CONFIG.maxFileSizeBytes) {
    return { valid: false, reason: `File size ${sizeBytes} bytes exceeds limit of ${UPLOAD_CONFIG.maxFileSizeBytes} bytes (5 MB)` };
  }
  return { valid: true };
}
