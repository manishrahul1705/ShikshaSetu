import React from 'react';
import CaseQueue from '../pages/workspace/CaseQueue.jsx';
import Reports from '../pages/reports/Reports.jsx';
import AuditTrail from '../pages/audit/AuditTrail.jsx';
import Notifications from '../pages/notifications/Notifications.jsx';
import RegionalView from '../pages/regional/RegionalView.jsx';

/** S7 release fix: SPEC 12.1 workspaces that had no route. Auto-discovered by routes/index.jsx. */
const officers = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];

export default [
  { path: '/cases', element: <CaseQueue />, roles: officers, public: false },
  { path: '/reports', element: <Reports />, roles: ['supervisor', 'competent_authority', 'auditor', 'system_admin', 'bureau_officer', 'regional_officer'], public: false },
  { path: '/audit', element: <AuditTrail />, roles: ['auditor', 'system_admin', 'competent_authority', 'supervisor'], public: false },
  { path: '/notifications', element: <Notifications />, public: false },
  { path: '/regional', element: <RegionalView />, roles: ['regional_officer', 'supervisor', 'competent_authority'], public: false },
];
