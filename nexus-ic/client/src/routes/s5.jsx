import React from 'react';
import Track, { TrackList } from '../pages/track/Track.jsx';
import ClosurePanel from '../pages/closure/ClosurePanel.jsx';
import Appeals from '../pages/appeals/Appeals.jsx';
import RescueAlerts from '../pages/rescue/RescueAlerts.jsx';
import Impact from '../pages/impact/Impact.jsx';
import Authority from '../pages/authority/Authority.jsx';
import InstitutionWorkspace from '../pages/institution/InstitutionWorkspace.jsx';
import RedactionHelper from '../additions/n62-redaction/RedactionHelper.jsx';

/**
 * Phase S5 routes (closure and recovery). Auto-discovered by routes/index.jsx.
 * Every route needs login; /track/:caseId stays behind login for the N63 QR (S21).
 */
const complainants = ['student', 'faculty', 'other_stakeholder'];
const officers = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];

export default [
  { path: '/track', element: <TrackList />, roles: complainants, public: false },
  { path: '/track/:caseId', element: <Track />, roles: complainants, public: false },
  { path: '/closure/:caseId', element: <ClosurePanel />, roles: [...officers, 'auditor'], public: false },
  { path: '/review/appeals', element: <Appeals />, roles: ['supervisor', 'competent_authority', 'auditor'], public: false },
  { path: '/rescue', element: <RescueAlerts />, roles: ['supervisor', 'competent_authority', 'auditor'], public: false },
  { path: '/impact', element: <Impact />, roles: ['supervisor', 'competent_authority', 'auditor', 'system_admin', 'bureau_officer', 'regional_officer'], public: false },
  { path: '/authority', element: <Authority />, roles: ['competent_authority'], public: false },
  { path: '/institution', element: <InstitutionWorkspace />, roles: ['institution_admin'], public: false },
  { path: '/cases/:caseId/redaction', element: <RedactionHelper />, roles: ['bureau_officer', 'regional_officer', 'supervisor'], public: false },
];
