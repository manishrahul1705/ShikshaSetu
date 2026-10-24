import React from 'react';
import StudentVerificationPanel from './StudentVerificationPanel.jsx';

export const SIMULATED_LABEL = 'Test verification; not a government check';
// Retain the component entry point while using the required linked-OTP workflow.
export default function SelfCheckPanel({ institutionPid = null, onVerified = null }) {
  return <StudentVerificationPanel institutionPid={institutionPid} onVerified={onVerified} />;
}
