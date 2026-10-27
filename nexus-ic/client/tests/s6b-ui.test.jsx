import React from 'react';
import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import JudgeMode from '../src/additions/n46-judge-mode/JudgeMode.jsx';
import DrillDown from '../src/additions/n47-drilldown/DrillDown.jsx';
import OverlapTimeline from '../src/additions/n50-overlap-timeline/OverlapTimeline.jsx';
import PatternAlerts from '../src/additions/n61-patterns/PatternAlerts.jsx';
import InstitutionGraph from '../src/pages/graph/InstitutionGraph.jsx';
import Impact from '../src/pages/impact/Impact.jsx';
import s6bRoutes from '../src/routes/s6b.jsx';

vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => ({ user: { id: 'synthetic', role: 'supervisor' }, logout: vi.fn() }) }));

let client, handler;
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
    const body = await handler(url, options);
    return { ok: true, status: 200, json: async () => body };
  }));
});
afterEach(() => { cleanup(); client?.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function show(element, path, pattern) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={element} /></Routes></MemoryRouter></QueryClientProvider>);
}

const BANNER = 'Potential Overlapping Cases – Coordination Required';

it('[A-N46] Judge Mode resets with one click and plays a captioned tour; hidden in production mode', async () => {
  handler = async (url) => (url.includes('/config/mode') ? { mode: 'demo' } : {
    banner: BANNER, note: 'All demo accounts use the password demo1234.',
    steps: [{ n: 1, caption: 'Two verified complainants report the same refund issue', link: '/institutions/1-1000000001', loginAs: 'supervisor1' }, { n: 2, caption: `The banner "${BANNER}" appears`, link: '/dashboard', loginAs: 'rb_officer1' }],
  });
  show(<JudgeMode />, '/judge', '/judge');
  fireEvent.click(await screen.findByRole('button', { name: 'Prepare walkthrough' }));
  expect(await screen.findByText(/Two verified complainants/)).toBeInTheDocument();
  expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText(new RegExp(BANNER))).toBeInTheDocument();
  expect(s6bRoutes.find((r) => r.path === '/judge').public).toBe(false);
  cleanup();
  handler = async () => ({ mode: 'production' });
  show(<JudgeMode />, '/judge', '/judge');
  expect(await screen.findByText(/not available in production mode/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Reset demo/ })).toBeNull();
});

it('[A-N47] IMPACT numbers link to their cases, and the drill-down lists exactly those cases with the synthetic label', async () => {
  const share = { value: 100, numerator: 1, denominator: 1, scope: 'All cases' };
  handler = async (url) => (url.includes('/impact/cases') ? {
    rowId: 'tile:pendingCases', label: 'SYNTHETIC DATA: results are synthetic until a pilot exists', scope: 'All cases', count: 1,
    cases: [{ masterCaseId: 'NX-2026-000901', category: 'Fee Dispute', subCategory: 'Refund Denial', status: 'Registered', owningBureau: null, institutionPid: '1-1000000001' }],
  } : {
    label: 'SYNTHETIC DATA', scope: 'All cases',
    tiles: { totalComplaints: { count: 1 }, pendingCases: { count: 1, share }, disposedCases: { count: 0, share }, overdueCases: { count: 0, share }, transferDelays: { count: 0, share }, potentialOverlaps: { pairs: 0, restrictedEntries: 0 }, bureauWiseWorkload: { rows: [{ rowId: 'bureau:Unrouted', bureau: 'Unrouted', total: 1, open: 1, disposed: 0 }] }, institutionWiseHistory: { rows: [] }, trendsAndInsights: { rows: [] } },
    resolutionTime: { result: 'UNKNOWN', reason: 'NO_CLOSED_CASES' }, duplicateActions: { flagged: 0, flaggedShare: share, avoided: { reason: 'NO_AVOIDANCE_RECORD' } }, regionWise: [], recommendations: [],
  });
  show(<Impact />, '/impact', '/impact');
  const pending = await screen.findByRole('region', { name: 'Pending Cases' });
  expect(pending.querySelector('a')).toHaveAttribute('href', '/impact/cases?row=tile%3ApendingCases');
  expect(screen.getByRole('region', { name: 'Bureau-wise Workload' }).querySelector('a')).toHaveAttribute('href', '/impact/cases?row=bureau%3AUnrouted');
  cleanup();
  show(<DrillDown />, '/impact/cases?row=tile:pendingCases', '/impact/cases');
  expect(await screen.findByText('NX-2026-000901')).toBeInTheDocument();
  expect(screen.queryByText(/SYNTHETIC DATA/)).not.toBeInTheDocument();
  expect(screen.getByText(/1 cases. Scope: All cases/)).toBeInTheDocument();
});

it('[A-N50] the overlap timeline shows two lanes and marks the conflict point; other bureaus stay opaque', async () => {
  handler = async () => ({
    institutionPid: '1-1000000001', readOnly: true,
    lanes: [{ bureau: 'Regulation Bureau', events: [{ at: '2026-10-20T10:00:00Z', actionType: 'DOCUMENT_REQUEST', opaque: true }] }, { bureau: 'Public Grievance Redressal Cell', events: [{ at: '2026-10-21T10:00:00Z', actionType: 'DOCUMENT_REQUEST', masterCaseId: 'NX-2026-000902' }] }],
    conflicts: [{ at: '2026-10-21T10:00:00Z', source: 'PREVENT Stage 2', result: 'REVIEW', actionType: 'DOCUMENT_REQUEST', bureau: 'Public Grievance Redressal Cell', reasons: ['REPEATED_DOCUMENT_REQUEST'], proceeded: true }],
  });
  show(<OverlapTimeline />, '/overlap-timeline/1-1000000001', '/overlap-timeline/:pid');
  expect(await screen.findByRole('region', { name: 'Lane Regulation Bureau' })).toHaveTextContent('details withheld');
  expect(screen.getByRole('region', { name: 'Lane Public Grievance Redressal Cell' })).toHaveTextContent('NX-2026-000902');
  expect(screen.getByRole('region', { name: 'Conflict points' })).toHaveTextContent('REPEATED_DOCUMENT_REQUEST');
  expect(screen.getByText(/Read-only/)).toBeInTheDocument();
});

it('[A-N61] pattern alerts show the suggestion, the share with its denominator, the cited cases and the DEMO rule label', async () => {
  handler = async () => ({
    label: 'SYNTHETIC DATA', ruleVersion: 'DEMO-PATTERN-v1', ruleNote: 'Window and minimum are DEMO values, not from source', windowDays: 30, minInstitutions: 3,
    alerts: [{ id: 'PAT-1', suggestion: 'Suggest a policy review of "Affiliation Issue / Fake Affiliation" in the Northern region', share: { value: 100, numerator: 3, denominator: 3, scope: 'Northern institutions' }, citedRows: ['NX-2026-000903', 'NX-2026-000904', 'NX-2026-000905'] }],
  });
  show(<PatternAlerts />, '/', '/');
  const section = await screen.findByRole('region', { name: 'Cross-institution patterns' });
  expect(section).toHaveTextContent('Suggest a policy review');
  expect(section).toHaveTextContent('Unverified Affiliation');
  expect(section).not.toHaveTextContent('Fake Affiliation');
  expect(section).toHaveTextContent('100% (3 of 3; scope: Northern institutions)');
  expect(section).toHaveTextContent('NX-2026-000903, NX-2026-000904, NX-2026-000905');
  expect(section).toHaveTextContent('Pattern rule v1');
  expect(section).not.toHaveTextContent('DEMO-PATTERN-v1');
});

it('[E07] (hint only) the graph page draws the institution graph and the attention radar with UNKNOWN shown as UNKNOWN', async () => {
  handler = async (url) => (url.endsWith('/radar') ? {
    note: 'Counts per attention-indicator reason. Not a score.', axes: [{ type: 'OVERDUE_TASKS', label: 'Overdue', value: 2, reason: '2 cases' }, { type: 'SOURCE_CONFLICT', label: 'Conflict', value: 1, reason: '1 mapping' }, { type: 'ATTENDANCE_FEED', label: 'Attendance', value: null, result: 'UNKNOWN', reason: 'feed not connected' }],
  } : { nodes: [{ id: 'institution:1-1000000001', type: 'institution', label: 'Synthetic' }, { id: 'case:NX-2026-000906', type: 'case', label: 'NX-2026-000906' }], edges: [{ from: 'case:NX-2026-000906', to: 'institution:1-1000000001', kind: 'about' }], restrictedEntries: 2 });
  show(<InstitutionGraph />, '/graph/institutions/1-1000000001', '/graph/institutions/:pid');
  expect(await screen.findByRole('img', { name: 'Institution graph' })).toHaveTextContent('NX-2026-000906');
  expect(screen.getByText(/Restricted entries: 2/)).toBeInTheDocument();
  expect(await screen.findByRole('img', { name: 'Attention radar' })).toHaveTextContent('Attendance: UNKNOWN');
  expect(screen.getByText(/Not a score/)).toBeInTheDocument();
});
