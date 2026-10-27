import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, matchRoutes, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../src/i18n/index.js';
import CoordinationBanner from '../src/additions/n103-coordination/CoordinationBanner.jsx';
import CaseSearch from '../src/additions/n104-case-search/CaseSearch.jsx';
import { SummaryFields } from '../src/additions/n106-case-summary/CaseSummaryCard.jsx';
import { KpiRow } from '../src/components/dashboard/CommandCharts.jsx';
import InstitutionDetailsCard from '../src/components/InstitutionDetailsCard.jsx';
import MonthlyReport from '../src/additions/n87-monthly-report/MonthlyReport.jsx';
import phaseRoutes from '../src/routes/index.jsx';
import SyncPage from '../src/pages/sync/SyncPage.jsx';
import CaseStepper from '../src/components/CaseStepper.jsx';
import { policyDescription } from '../src/additions/n108-reminders/ruleMetadata.js';
const state = vi.hoisted(() => ({ results: {}, role: 'supervisor', queryPaths: [] }));
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => ({ user: { role: state.role } }) }));
vi.mock('../src/pages/closure/api.jsx', async importOriginal => ({ ...await importOriginal(), useS5: path => { state.queryPaths.push(path); return state.results[path.split('?')[0]] || { data: null, isLoading: false }; } }));
afterEach(() => { cleanup(); state.results = {}; state.role = 'supervisor'; state.queryPaths = []; vi.unstubAllGlobals(); });
const wrap = element => render(<MemoryRouter><I18nProvider>{element}</I18nProvider></MemoryRouter>);
it('[A-N103] coordination lists only visible IDs, opaque counts, links and one existing banner heading', () => {
  state.results['/coordination'] = { data: { count: 1, flags: [{ institutionPid: '1-1000000001', institutionName: 'Fictional College', bureaus: ['RB', 'PGRC'], cases: [{ masterCaseId: 'NX-2026-000001' }], restrictedCount: 1 }] } };
  state.results['/prevent/overlaps'] = { data: { pairs: [{ cases: ['NX-2026-000001'] }], restrictedCount: 0 } };
  wrap(<CoordinationBanner showCount />);
  expect(screen.getByRole('heading', { name: 'Cross-bureau coordination' })).toBeInTheDocument();
  expect(screen.queryByText('Potential Overlapping Cases – Coordination Required')).not.toBeInTheDocument();
  expect(screen.getByText('1 restricted entries')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'NEXUS SYNC' })).toHaveAttribute('href', '/sync/1-1000000001');
  expect(screen.getByRole('link', { name: /Cross-bureau institutions/ })).toHaveAttribute('href', '/coordination');
});
it('[A-N104] search filters reflect in URL and static search route outranks case parameter', async () => {
  state.results['/case-search'] = { data: { total: 1, page: 1, rows: [{ masterCaseId: 'NX-2026-000001', institutionName: 'Fictional College', createdAt: '2026-10-01' }] } };
  state.results['/case-search/options'] = { data: { regions: ['Northern'], categories: ['Fee Dispute'], statuses: ['Under Process'] } };
  state.results['/bureaus'] = { data: [{ name: 'Regulation Bureau' }] };
  function Location() { return <output aria-label="Query string">{useLocation().search}</output>; }
  wrap(<><CaseSearch /><Location /></>);
  fireEvent.change(screen.getByLabelText('Institution name'), { target: { value: 'College' } });
  fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'Northern' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search', exact: true }));
  expect(screen.getByLabelText('Query string')).toHaveTextContent('q=College');
  expect(screen.getByLabelText('Query string')).toHaveTextContent('region=Northern');
  fireEvent.click(screen.getByRole('button', { name: 'Clear' })); expect(screen.getByLabelText('Query string')).toBeEmptyDOMElement();
  expect(matchRoutes(phaseRoutes, '/cases/search').at(-1).route.path).toBe('/cases/search');
  expect(matchRoutes(phaseRoutes, '/cases/NX-2026-000001').at(-1).route.path).toBe('/cases/:caseId');
});
it('[A-N105] original six cards stay first and new three provide exact drilldown links', () => {
  const tile = { count: 2, share: { value: 50, numerator: 2, denominator: 4, scope: 'fixture' } };
  wrap(<KpiRow report={{ tiles: { totalComplaints: { count: 4 }, pendingCases: tile, disposedCases: tile, overdueCases: tile, transferDelays: tile, potentialOverlaps: { pairs: 1 } }, psAlignmentTiles: { underProcessCases: tile, transferredCases: tile, escalatedCases: tile } }} />);
  const links = screen.getAllByRole('link'); expect(links).toHaveLength(9);
  expect(links.slice(6).map(l => l.getAttribute('href'))).toEqual(['underProcessCases', 'transferredCases', 'escalatedCases'].map(k => '/impact/cases?row=' + encodeURIComponent('tile:' + k)));
  expect(links[6]).toHaveTextContent('2 of 4');
});
it('[A-N106] summary renders all PS fields, existing next-step text and exact missing fallbacks', () => {
  wrap(<SummaryFields data={{ masterCaseId: 'NX-2026-000001', institutionName: 'Fictional College', institutionPid: '1-1000000001', receivedAt: '2026-10-01', category: 'Fee Dispute', subCategory: 'Refund', status: 'Under Process', bureau: 'RB', officer: 'Not assigned', lastAction: { text: 'Assigned', at: '2026-10-02' }, nextStepKey: 'office', expectedDisposalDate: null, disposalUnavailableReason: 'Not available: POLICY_NOT_CONFIGURED' }} />);
  for (const label of ['Case ID', 'Institution', 'Date of receipt', 'Category / sub-category', 'Current status', 'Presently assigned bureau / cell', 'Assigned officer', 'Last action taken', 'Date of last action', 'Next action required', 'Expected disposal date']) expect(screen.getByText(label)).toBeInTheDocument();
  expect(screen.getByText('Not assigned')).toBeInTheDocument(); expect(screen.getByText('Not available: POLICY_NOT_CONFIGURED')).toBeInTheDocument();
  expect(screen.queryByText('ps.next.office')).not.toBeInTheDocument();
});
it('[A-N107] month remains default and Quarter shows disposal fractions with quarterly downloads', () => {
  state.results['/reports/quarterly'] = { data: { rows: [{ key: 'bureau:RB', name: 'RB', kind: 'bureau', counts: {}, cells: {}, disposalRate: { value: 50, numerator: 1, denominator: 2 } }], denominator: 2 } };
  wrap(<MonthlyReport />); expect(screen.getByRole('button', { name: 'Month', exact: true })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Quarter', exact: true }));
  expect(screen.getByText('50% (1/2)')).toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Quarterly PDF' })).toHaveAttribute('href', expect.stringContaining('/reports/quarterly.pdf?'));
});
it('[A-N109] details card prefers supplied address and retains existing city/district fallback', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  const institution = { pid: '1-1000000001', name: 'Fictional College', city: 'Town', district: 'District', address: 'Provided street' };
  const rendered = wrap(<InstitutionDetailsCard institution={institution} showMap={false} />);
  expect(screen.getByText('Provided street')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Full profile unavailable'));
  rendered.rerender(<MemoryRouter><I18nProvider><InstitutionDetailsCard institution={{ ...institution, address: null }} showMap={false} /></I18nProvider></MemoryRouter>);
  expect(screen.getByText('Town, District')).toBeInTheDocument();
});
it('[PS-ALIGN] decorative case markers keep their animation without presenting a loaded case as a loading skeleton', () => {
  const { container } = wrap(<CaseStepper caseData={{ status: 'Under Process', statusHistory: [] }} />);
  expect(screen.getByText('Recorded case history')).toBeInTheDocument();
  expect(container.querySelector('.status-pulse')).toBeTruthy();
  expect(container.querySelector('.animate-pulse,.skeleton')).toBeNull();
});
it('[PS-ALIGN] system-admin SYNC keeps its shared view without mounting forbidden combined-request queries', async () => {
  state.role = 'system_admin';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ accessibleCases: [], coordinations: [], tasks: [] }) }));
  render(<MemoryRouter initialEntries={['/sync/1-1000000001']}><I18nProvider><Routes><Route path="/sync/:institutionPid" element={<SyncPage />} /></Routes></I18nProvider></MemoryRouter>);
  expect(await screen.findByText('Cases at this Institution')).toBeInTheDocument();
  expect(state.queryPaths.some(p => p.startsWith('/combined-requests'))).toBe(false);
  expect(screen.queryByRole('heading', { name: 'One combined request' })).not.toBeInTheDocument();
});
it('[PS-ALIGN] controlled RuleBook display labels omit banned metadata wording without changing their source', () => {
  const source = 'Synthetic jurisdiction mapping (DEMO-ROUTE-v1)';
  expect(policyDescription(source)).toBe('jurisdiction mapping (Rule v1)');
  expect(source).toBe('Synthetic jurisdiction mapping (DEMO-ROUTE-v1)');
});
