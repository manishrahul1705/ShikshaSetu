import React from 'react';
import { Navigate } from 'react-router-dom';
import InstitutionLookup from '../pages/institutions/InstitutionLookup.jsx';
import Institution360 from '../pages/institutions/Institution360.jsx';
import IdentityReviewQueue from '../pages/institutions/IdentityReviewQueue.jsx';
import GrievanceSubmit from '../pages/intake/GrievanceSubmit.jsx';
import MyCases from '../pages/cases/MyCases.jsx';
import TrackCase from '../pages/cases/TrackCase.jsx';
import MasterInstitutions from '../pages/masterdata/MasterInstitutions.jsx';
import MasterCategories from '../pages/masterdata/MasterCategories.jsx';
import MasterRegions from '../pages/masterdata/MasterRegions.jsx';

/**
 * Phase S1b routes (Institutions and Intake).
 * Auto-discovered by client/src/routes/index.jsx via import.meta.glob('./s*.jsx').
 */
const s1bRoutes = [
  {
    path: '/institutions/lookup',
    element: <InstitutionLookup />,
    public: true,
  },
  {
    path: '/institutions/:id',
    element: <Institution360 />,
    roles: [
      'student',
      'faculty',
      'institution_admin',
      'bureau_officer',
      'regional_officer',
      'supervisor',
      'competent_authority',
      'auditor',
    ],
  },
  {
    path: '/review/identity',
    element: <IdentityReviewQueue />,
    roles: ['supervisor', 'regional_officer'],
  },
  {
    path: '/grievances/new',
    element: <GrievanceSubmit />,
    roles: ['student', 'faculty'],
  },
  {
    path: '/my/cases',
    element: <Navigate to="/track" replace />,
    roles: ['student', 'faculty'],
  },
  {
    path: '/my/cases/:caseId',
    element: <TrackCase />,
    roles: [
      'student',
      'faculty',
      'institution_admin',
      'bureau_officer',
      'regional_officer',
      'supervisor',
      'competent_authority',
      'auditor',
    ],
  },
  {
    path: '/admin/master/institutions',
    element: <MasterInstitutions />,
    roles: ['system_admin'],
  },
  {
    path: '/admin/master/categories',
    element: <MasterCategories />,
    roles: ['system_admin'],
  },
  {
    path: '/admin/master/regions',
    element: <MasterRegions />,
    roles: ['system_admin'],
  },
];

export default s1bRoutes;
