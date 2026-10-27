import React from 'react';

export default function TransferTimeline({ transfer }) {
  const accepted = transfer.status === 'ACCEPTED';
  const steps = ['Requested', 'Acceptance Pending', 'Accepted', 'New Owner Active'];
  return <ol aria-label="Transfer timeline" className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4 text-xs">
    {steps.map((step, index) => <li key={step} className={`border-t-4 pt-2 ${index < 2 || accepted ? 'border-blue-800' : 'border-slate-200'}`}>
      <strong>{step}</strong><p>{index < 2 || accepted ? 'Recorded' : 'Not reached'}</p>
      {index === 1 && !accepted && <p>Sender remains accountable. Current transfer: {transfer.status}.</p>}
      {index === 3 && accepted && <p>{transfer.toBureau}</p>}
    </li>)}
  </ol>;
}
