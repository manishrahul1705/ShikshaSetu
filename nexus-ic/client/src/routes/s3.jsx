import React from 'react';
import TransfersPage from '../pages/trace/TransfersPage.jsx';
import SyncPage from '../pages/sync/SyncPage.jsx';
import QueryThread from '../pages/queries/QueryThread.jsx';
import FieldVerificationPanel from '../pages/fieldwork/FieldVerificationPanel.jsx';
import InsiderAlertsPage from '../pages/insider/InsiderAlertsPage.jsx';
import LeaveManagementPage from '../pages/absence/LeaveManagementPage.jsx';

/**
 * Phase S3 routes (NEXUS TRACE, NEXUS SYNC 2.0, Queries, Fieldwork, Insider, Absence).
 * Auto-discovered by client/src/routes/index.jsx.
 */
const s3Routes = [
  {
    path: '/transfers',
    element: <TransfersPage />,
    roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'system_admin'],
  },
  {
    path: '/sync/:institutionPid',
    element: <SyncPage />,
    roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'system_admin'],
  },
  {
    path: '/sync',
    element: <SyncPage />,
    roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'system_admin'],
  },
  {
    path: '/queries/:caseId',
    element: <QueryThread />,
    roles: [
      'student',
      'faculty',
      'other_stakeholder',
      'institution_admin',
      'bureau_officer',
      'regional_officer',
      'supervisor',
      'competent_authority',
      'system_admin',
    ],
  },
  {
    path: '/fieldwork/:caseId',
    element: <FieldVerificationPanel />,
    roles: ['regional_officer', 'bureau_officer', 'supervisor', 'competent_authority', 'system_admin'],
  },
  {
    path: '/insider/alerts',
    element: <InsiderAlertsPage />,
    roles: ['supervisor', 'system_admin', 'competent_authority'],
  },
  {
    path: '/leave',
    element: <LeaveManagementPage />,
    roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'],
  },
];

export default s3Routes;
