import React from 'react';
import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ImpactCharts from '../src/pages/impact/ImpactCharts.jsx';
import DrillLink from '../src/additions/n47-drilldown/DrillLink.jsx';
import { InstitutionGraphView } from '../src/pages/graph/InstitutionGraph.jsx';

let client;
afterEach(() => { cleanup(); client?.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const report = {
  label: 'SYNTHETIC DATA', scope: 'Regulation Bureau', regionWise: [{ rowId: 'region:Southern', region: 'Southern', total: 3 }],
  tiles: {
    totalComplaints: { count: 3 }, pendingCases: { count: 2 }, disposedCases: { count: 1 }, overdueCases: { count: 1 }, transferDelays: { count: 1 }, potentialOverlaps: { pairs: 1 },
    bureauWiseWorkload: { rows: [{ rowId: 'bureau:RB', bureau: 'RB', total: 3 }] },
    institutionWiseHistory: { rows: [{ rowId: 'institution:1-1000000001', pid: '1-1000000001', total: 3 }] },
    trendsAndInsights: { rows: [{ rowId: 'month:2026-10', month: '2026-10', registered: 3 }] },
  },
};
function Location() { const at = useLocation(); return <output data-testid="location">{at.pathname}{at.search}</output>; }
function charts(value = report) {
  return render(<MemoryRouter><ImpactCharts report={value} /><DrillLink row="bureau:RB">Bureau number</DrillLink><DrillLink row="month:2026-10">Month number</DrillLink><Location /></MemoryRouter>);
}

it('[N26] real Recharts bars and trend points render the report counts and preserve UNKNOWN measures', async () => {
  charts({ ...report, tiles: { ...report.tiles, overdueCases: { result: 'UNKNOWN', reason: 'SLA_FEED_UNAVAILABLE' } } });
  expect(await screen.findByRole('link', { name: 'Open Total Complaints: 3 cases' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open Potential Overlaps: 1 pairs' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open 2026-10: 3 cases' })).toBeInTheDocument();
  expect(screen.getByText('Overdue Cases: UNKNOWN (SLA_FEED_UNAVAILABLE)')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Open Overdue Cases/ })).not.toBeInTheDocument();
  expect(screen.getByText(/Scope: Regulation Bureau/)).toBeInTheDocument();
});

it('[A-N47] a real chart bar and line point navigate to the same row URL as their corresponding numeric links', async () => {
  charts();
  const bar = await screen.findByRole('link', { name: 'Open RB: 3 cases' });
  const bureauNumber = screen.getByRole('link', { name: 'Bureau number' });
  expect(bar.getAttribute('href')).toBe(bureauNumber.getAttribute('href'));
  fireEvent.click(bar);
  expect(screen.getByTestId('location')).toHaveTextContent('/impact/cases?row=bureau%3ARB');
  const point = screen.getByRole('link', { name: 'Open 2026-10: 3 cases' });
  expect(point.getAttribute('href')).toBe(screen.getByRole('link', { name: 'Month number' }).getAttribute('href'));
  fireEvent.keyDown(point, { key: 'Enter' });
  expect(screen.getByTestId('location')).toHaveTextContent('/impact/cases?row=month%3A2026-10');
});

it('[N12] real React Flow renders institution, case and bureau nodes from the authorized API without inventing labels', async () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('DOMMatrixReadOnly', class { constructor() { this.m22 = 1; } });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(180);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(60);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ restrictedEntries: 2,
    nodes: [{ id: 'institution:1', type: 'institution', label: 'Synthetic institution' }, { id: 'case:1', type: 'case', label: 'NX-2026-000003' }, { id: 'bureau:RB', type: 'bureau', label: 'Regulation Bureau' }],
    edges: [{ from: 'case:1', to: 'institution:1', kind: 'concerns' }, { from: 'case:1', to: 'bureau:RB', kind: 'transfer' }],
  }) })));
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { container } = render(<QueryClientProvider client={client}><MemoryRouter><InstitutionGraphView pid="1-1000000001" /></MemoryRouter></QueryClientProvider>);
  await screen.findByText('Synthetic institution');
  expect(screen.getByText('NX-2026-000003')).toBeInTheDocument();
  expect(screen.getByText('Regulation Bureau')).toBeInTheDocument();
  await waitFor(() => expect(container.querySelectorAll('.react-flow__node')).toHaveLength(3));
  expect(container.querySelector('.react-flow')).toBeInTheDocument();
  expect(screen.getByText(/Restricted entries: 2/)).toBeInTheDocument();
});
