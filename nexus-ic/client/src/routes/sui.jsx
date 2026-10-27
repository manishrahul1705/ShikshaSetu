import React from 'react';
import CaseJourney from '../pages/cases/CaseJourney.jsx';

/** UI redesign routes (officer case journey). Auto-discovered by routes/index.jsx. */
export default [
  { path: '/cases/:caseId', element: <CaseJourney />, roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor', 'system_admin'], public: false },
];
