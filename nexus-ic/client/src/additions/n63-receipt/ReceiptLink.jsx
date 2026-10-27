import React from 'react';

/** N63: download the case receipt (Master Case ID, status history, QR to /track/:caseId after login). */
export default function ReceiptLink({ caseId }) {
  return (
    <a className="px-3 py-1 border rounded text-sm text-blue-900" href={`/api/v1/track/${encodeURIComponent(caseId)}/receipt`} download>
      Download receipt
    </a>
  );
}
