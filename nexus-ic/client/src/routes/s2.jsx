import React from 'react';
import RuleBook from '../pages/rulebook/RuleBook.jsx';
import TriageQueue from '../pages/routing/TriageQueue.jsx';

/**
 * Phase S2 routes (Trust, Routing & Case Lifecycle - NEXUS RULEBOOK, NEXUS ROUTE).
 * Auto-discovered by client/src/routes/index.jsx via import.meta.glob('./s*.jsx').
 */
const s2Routes = [
  {
    path: '/rulebook',
    element: <RuleBook />,
    roles: ['system_admin', 'supervisor', 'competent_authority', 'auditor'],
  },
  {
    path: '/triage',
    element: <TriageQueue />,
    roles: ['supervisor', 'competent_authority'],
  },
];

export default s2Routes;
