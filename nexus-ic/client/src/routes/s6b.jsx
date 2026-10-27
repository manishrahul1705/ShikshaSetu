import React from 'react';
import JudgeMode from '../additions/n46-judge-mode/JudgeMode.jsx';
import DrillDown from '../additions/n47-drilldown/DrillDown.jsx';
import OverlapTimeline from '../additions/n50-overlap-timeline/OverlapTimeline.jsx';
import InstitutionGraph from '../pages/graph/InstitutionGraph.jsx';
import ComparePage from '../additions/n84-compare/ComparePage.jsx';
import CoveragePage from '../additions/n85-problem-coverage/CoveragePage.jsx';

/** Phase S6b routes. Auto-discovered by routes/index.jsx. /judge needs any signed-in account and refuses itself in production mode. */
const impactRoles = ['supervisor', 'competent_authority', 'auditor', 'system_admin', 'bureau_officer', 'regional_officer'];
const graphRoles = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor', 'system_admin'];

export default [
  { path: '/judge', element: <JudgeMode />, public: false },
  { path: '/walkthrough/compare', element: <ComparePage />, roles: graphRoles, public: false },
  { path: '/coverage', element: <CoveragePage />, roles: graphRoles, public: false },
  { path: '/impact/cases', element: <DrillDown />, roles: impactRoles, public: false },
  { path: '/overlap-timeline/:pid', element: <OverlapTimeline />, roles: ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor'], public: false },
  { path: '/graph/institutions/:pid', element: <InstitutionGraph />, roles: graphRoles, public: false },
];
