import React from 'react';
import CombinedRequests from '../additions/n82-combined-request/CombinedRequests.jsx';
import DocumentLocker from '../additions/n83-document-locker/DocumentLocker.jsx';
import MonthlyReport from '../additions/n87-monthly-report/MonthlyReport.jsx';
import Workload from '../additions/n89-workload/Workload.jsx';
const roles = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'institution_admin'];
export default [
  { path: '/requests/combined', element: <CombinedRequests />, roles },
  { path: '/documents/locker', element: <DocumentLocker />, roles },
  { path: '/reports/monthly', element: <MonthlyReport />, roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor', 'system_admin'] },
  { path: '/officer-workload', element: <Workload />, roles: ['supervisor', 'bureau_officer'] },
];
