import React from 'react';
import Verify from '../pages/trust/Verify.jsx';
import Consents from '../pages/trust/Consents.jsx';
import ManualVerification from '../pages/trust/ManualVerification.jsx';
import RevealRequests from '../pages/trust/RevealRequests.jsx';
import OtpInbox from '../pages/trust/OtpInbox.jsx';
import Admin from '../pages/admin/Admin.jsx';
export default [
  { path: '/verify', element: <Verify />, public: false },
  { path: '/my/consents', element: <Consents />, public: false },
  { path: '/officer/manual-verification', element: <ManualVerification />, roles: ['bureau_officer', 'regional_officer'], public: false },
  { path: '/officer/reveal-requests', element: <RevealRequests />, roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'], public: false },
  { path: '/admin', element: <Admin />, roles: ['system_admin'], public: false },
  { path: '/dev/otp-inbox', element: <OtpInbox />, public: false },
];
