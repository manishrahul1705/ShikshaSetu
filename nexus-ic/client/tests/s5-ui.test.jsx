import React from 'react';
import { I18nProvider } from '../src/i18n/index.js';
import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Track from '../src/pages/track/Track.jsx';
import ClosurePanel from '../src/pages/closure/ClosurePanel.jsx';
import Impact from '../src/pages/impact/Impact.jsx';
import InstitutionWorkspace from '../src/pages/institution/InstitutionWorkspace.jsx';
import Authority from '../src/pages/authority/Authority.jsx';
import RedactionHelper from '../src/additions/n62-redaction/RedactionHelper.jsx';
import s5Routes from '../src/routes/s5.jsx';

const state = vi.hoisted(() => ({ user: { id: 'synthetic-user', role: 'student' } }));
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => ({ user: state.user, logout: vi.fn() }) }));

let client, handler, calls;
beforeEach(() => {
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
    calls.push([url, options.method || 'GET', options.body]);
    const body = await handler(url, options);
    return { ok: !body?.__error, status: body?.__error ? 409 : 200, json: async () => body };
  }));
});
afterEach(() => { cleanup(); client?.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function show(element, path, pattern) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><I18nProvider><MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={element} /></Routes></MemoryRouter></I18nProvider></QueryClientProvider>);
}

const trackView = {
  masterCaseId: 'NX-2026-000777', category: 'Fee Dispute', subCategory: 'Refund Denial', status: 'Closed', accountableOwner: { office: 'Regulation Bureau', role: 'bureau_officer' },
  slaClockSummary: { targetResolutionDate: null, isEscalated: false }, statusHistory: [{ status: 'Registered', at: '2026-10-01T00:00:00Z' }, { status: 'Closed', at: '2026-10-20T00:00:00Z' }],
  closure: { state: 'CLOSED', closureReason: 'Refund issued (synthetic)' }, feedback: [], feedbackOpen: true, appeals: [], appealRule: { result: 'POLICY_NOT_CONFIGURED' }, appealOpen: false,
};

it('[N29] the complainant workspace shows status, owner as office and role, history, closure reason, receipt link and feedback without changing status', async () => {
  state.user = { id: 'synthetic-student', role: 'student' };
  handler = async (url, o) => (o.method === 'POST' ? { id: 'f1', rating: 5, caseStatus: 'Closed' } : trackView);
  show(<Track />, '/track/NX-2026-000777', '/track/:caseId');
  expect(await screen.findByTestId('track-status')).toHaveTextContent('Closed');
  expect(screen.getByText(/Regulation Bureau \(bureau_officer\)/)).toBeInTheDocument();
  expect(screen.getByText(/Closure reason: Refund issued/)).toBeInTheDocument();
  expect(screen.getByText('No approved policy')).toHaveAttribute('title', 'POLICY_NOT_CONFIGURED');
  expect(screen.queryByText(/POLICY_NOT_CONFIGURED/)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Download receipt' })).toHaveAttribute('href', '/api/v1/track/NX-2026-000777/receipt');
  expect(screen.getByText(/does not close, reopen or change your case/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  await waitFor(() => expect(calls.some(([u, m]) => m === 'POST' && u === '/api/v1/cases/NX-2026-000777/feedback')).toBe(true));
  expect(s5Routes.find((r) => r.path === '/track/:caseId')).toMatchObject({ public: false, roles: ['student', 'faculty', 'other_stakeholder'] });
});

it('[N22] the PROOF panel lists the four gate checks and keeps Close disabled until all pass', async () => {
  state.user = { id: 'synthetic-sup', role: 'supervisor' };
  handler = async () => ({
    masterCaseId: 'NX-2026-000778', status: 'Resolution Proposed', feedback: [{ rating: 4, text: 'Synthetic feedback' }],
    records: [{ state: 'PROPOSED', closureReason: 'Synthetic', packetHash: 'a'.repeat(64) }],
    gate: { tasksComplete: 'FAIL', transfersAcknowledged: 'PASS', evidenceAttached: 'PASS', approvalExists: 'FAIL', passed: false, ruleVersion: 'DEMO-CLOSURE-v1' },
  });
  show(<ClosurePanel />, '/closure/NX-2026-000778', '/closure/:caseId');
  expect(await screen.findByText(/Every task complete/)).toHaveTextContent('FAIL');
  expect(screen.getByText(/Every transfer acknowledged/)).toHaveTextContent('PASS');
  expect(screen.getByRole('button', { name: 'Close case' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  expect(screen.getByText(/Rating 4: Synthetic feedback/)).toBeInTheDocument();
});

it('[N77] the IMPACT page shows the nine tiles with numerator, denominator and scope, and the synthetic label', async () => {
  state.user = { id: 'synthetic-sup', role: 'supervisor' };
  const share = { value: 50, numerator: 1, denominator: 2, scope: 'All cases visible to this role' };
  handler = async () => ({
    label: 'SYNTHETIC DATA: results are synthetic until a pilot exists', scope: 'All cases visible to this role',
    tiles: {
      totalComplaints: { count: 2 }, pendingCases: { count: 1, share }, disposedCases: { count: 1, share }, overdueCases: { count: 0, share: { value: null, numerator: 0, denominator: 0, scope: 'x', reason: 'NO_DENOMINATOR' } },
      transferDelays: { result: 'UNKNOWN', reason: 'TRACE_NOT_AVAILABLE' }, potentialOverlaps: { pairs: 0, restrictedEntries: 0 },
      bureauWiseWorkload: { rows: [] }, institutionWiseHistory: { rows: [] }, trendsAndInsights: { rows: [] },
    },
    resolutionTime: { result: 'UNKNOWN', reason: 'NO_CLOSED_CASES' }, duplicateActions: { flagged: 1, flaggedShare: share, avoided: { result: 'UNKNOWN', reason: 'NO_AVOIDANCE_RECORD' } },
    regionWise: [], recommendations: [],
  });
  show(<Impact />, '/impact', '/impact');
  await screen.findByRole('region', { name: 'Total Complaints' });
  expect(screen.queryByText(/SYNTHETIC DATA/)).not.toBeInTheDocument();
  for (const name of ['Total Complaints', 'Pending Cases', 'Disposed Cases', 'Overdue Cases', 'Transfer Delays', 'Potential Overlaps', 'Bureau-wise Workload', 'Institution-wise History', 'Trends and Insights']) {
    expect(screen.getByRole('region', { name })).toBeInTheDocument();
  }
  expect(screen.getByRole('region', { name: 'Pending Cases' })).toHaveTextContent('50% (1 of 2; scope: All cases visible to this role)');
  expect(screen.getByRole('region', { name: 'Transfer Delays' })).toHaveTextContent('Not available: Trace not available');
  expect(screen.getByRole('region', { name: 'Transfer Delays' }).querySelector('[title="TRACE_NOT_AVAILABLE"]')).toBeInTheDocument();
  expect(screen.getByText(/never counted as avoided/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Download report (CSV)' })).toHaveAttribute('href', '/api/v1/impact/report.csv');
});

it('[N30] the institution workspace shows only the released redacted form and no reporter identity', async () => {
  state.user = { id: 'synthetic-admin', role: 'institution_admin' };
  handler = async (url) => (url.includes('status-summary')
    ? { total: 1, byStatus: { 'Under Process': 1 } }
    : { cases: [{ masterCaseId: 'NX-2026-000779', category: 'Fee Dispute', subCategory: 'Refund Denial', status: 'Under Process', accountableOwner: { office: 'RB' }, pendingRequests: 1, institutionFacingForm: { result: 'NOT_RELEASED' } }] });
  const { container } = show(<InstitutionWorkspace />, '/institution', '/institution');
  expect(await screen.findByText('NX-2026-000779')).toBeInTheDocument();
  expect(screen.getByText(/1 cases: Under Process 1/)).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/RP-[A-Z0-9]{4}/);
});

it('[N80] the Competent Authority workspace shows the member designation, approvals and escalations, and no narrative', async () => {
  state.user = { id: 'synthetic-ca', role: 'competent_authority' };
  handler = async () => ({
    designation: 'Chairperson', pending: 1, overdue: { count: 0 }, transferred: 0, feedback: { count: 0, averageRating: null },
    approvals: { closuresAwaitingApproval: [{ masterCaseId: 'NX-2026-000780' }], appealsAwaitingReview: 0 },
    escalations: { openRescueAlerts: [], escalatedCases: [] }, notifications: { retaliationWatch: [] },
    cases: [{ masterCaseId: 'NX-2026-000780', institutionPid: '1-1000000001', status: 'Resolution Proposed', accountableOwner: { office: 'RB' } }],
    regionWise: [], bureauWise: [], auditAndEvidence: { recentAudit: [], closurePackets: [] }, impact: { label: 'SYNTHETIC DATA' },
  });
  show(<Authority />, '/authority', '/authority');
  expect(await screen.findByText(/Signed in as: Chairperson/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'NX-2026-000780' })).toHaveAttribute('href', '/closure/NX-2026-000780');
  fireEvent.click(screen.getByRole('button', { name: 'Decide' }));
  expect(screen.getByLabelText('Decision kind')).toBeInTheDocument();
});

it('[A-N62] the redaction helper enables Confirm only after the officer decides every highlight', async () => {
  state.user = { id: 'synthetic-officer', role: 'bureau_officer' };
  handler = async (url, o) => (o.method === 'POST'
    ? { redactedText: 'my name is [REDACTED NAME]' }
    : { masterCaseId: 'NX-2026-000781', narrative: 'my name is Ravi Kumar, phone 9876543210', currentForm: null, highlights: [{ id: 'H1', type: 'NAME', text: 'Ravi Kumar' }, { id: 'H2', type: 'PHONE', text: '9876543210' }] });
  show(<RedactionHelper />, '/cases/NX-2026-000781/redaction', '/cases/:caseId/redaction');
  const button = await screen.findByRole('button', { name: 'Confirm institution-facing form' });
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByLabelText('Redact Ravi Kumar'));
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByLabelText('Keep 9876543210'));
  expect(button).toBeEnabled();
  fireEvent.click(button);
  await waitFor(() => expect(calls.find(([u, m]) => m === 'POST')?.[2]).toBe(JSON.stringify({ decisions: [{ id: 'H1', accept: true }, { id: 'H2', accept: false }] })));
  expect(await screen.findByText(/Institution-facing form: my name is \[REDACTED NAME\]/)).toBeInTheDocument();
});
