import React from 'react';
import Coordination from '../additions/n103-coordination/Coordination.jsx';
import CaseSearch from '../additions/n104-case-search/CaseSearch.jsx';
export default [
  { path: '/cases/search', element: <CaseSearch />, roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor'], public: false },
  { path: '/coordination', element: <Coordination />, roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'], public: false },
];
