import React from 'react';
import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../src/i18n/index.js';
import Home from '../src/pages/Home.jsx';
import Dashboard from '../src/pages/Dashboard.jsx';
import InstitutionLookup from '../src/pages/institutions/InstitutionLookup.jsx';
import Reports from '../src/pages/reports/Reports.jsx';
import AuditTrail from '../src/pages/audit/AuditTrail.jsx';
import Notifications from '../src/pages/notifications/Notifications.jsx';
import s7Routes from '../src/routes/s7.jsx';
import RegionalView from '../src/pages/regional/RegionalView.jsx';

const state = vi.hoisted(() => ({ user: null }));
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => ({ user: state.user, logout: vi.fn() }) }));

let client, handler;
beforeEach(() => {
  state.user = null;
  vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
    const body = await handler(String(url), options);
    return { ok: true, status: 200, json: async () => body };
  }));
});
afterEach(() => { cleanup(); client?.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function show(element, path = '/', pattern = path) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><I18nProvider><MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={element} /></Routes></MemoryRouter></I18nProvider></QueryClientProvider>);
}

const queue = {
  scope: 'Cases routed to Regulation Bureau', counts: { open: 1, assignedToMe: 1, overdue: 0, nearDue: 0, noSlaClock: 1 },
  cases: [{ masterCaseId: 'NX-2026-000950', status: 'Under Process', transferStatus: 'NONE', accountableOwner: { office: 'Regulation Bureau', role: 'bureau_officer' }, assignedToMe: true, sla: { result: 'POLICY_NOT_CONFIGURED' } }],
  tasks: [], incomingTransfers: [], myRecentActions: [],
};

it('[N13] (Appendix V) the landing page carries the pillars, key outcomes, manager expectations and the footer', () => {
  handler = async () => ({});
  show(<Home />);
  for (const p of ['Transparent, Accountable', 'Student & Faculty Focused', 'Institution-Centric View', 'Actionable Insights for Better Governance']) expect(screen.getByText(p)).toBeInTheDocument();
  expect(screen.getByText('KEY OUTCOMES')).toBeInTheDocument();
  expect(screen.getByText('Manager Expectations Implemented')).toBeInTheDocument();
  expect(screen.getByText('RIGHT INSTITUTION | VERIFIED REPORTER | RIGHT BUREAU | NO LOST TRANSFERS | FASTER ACCOUNTABLE RESOLUTION | TRANSPARENT GOVERNANCE')).toBeInTheDocument();
});

it('[N28] the officer dashboard shows my cases with the four lanes and the never-revert warning, not a placeholder', async () => {
  state.user = { id: 'synthetic-officer', role: 'bureau_officer', bureau: 'Regulation Bureau', displayName: 'Synthetic officer', username: 'rb_officer1' };
  handler = async (url) => (url.includes('/workspace/queue') ? queue : url.includes('/prevent/overlaps') ? { result: 'CLEAR', pairs: [], restrictedCount: 0 } : []);
  show(<Dashboard />, '/dashboard');
  expect(await screen.findByRole('link', { name: 'NX-2026-000950' })).toHaveAttribute('href', '/cases/NX-2026-000950');
  expect(screen.getByRole('note')).toHaveTextContent('Transferred cases must NEVER revert to Submitted status.');
  expect(screen.getByText('No approved policy')).toHaveAttribute('title', 'POLICY_NOT_CONFIGURED');
  expect(screen.queryByText('POLICY_NOT_CONFIGURED')).not.toBeInTheDocument();
  expect(screen.queryByText(/Role Workspace Placeholder/)).toBeNull();
  expect(s7Routes.map((r) => r.path)).toEqual(['/cases', '/reports', '/audit', '/notifications', '/regional']);
});

it('[N10] (Appendix V) the PID lookup shows the auto-fetch checklist and the six-region panel; missing values are UNKNOWN or not available', async () => {
  handler = async () => ({ found: true, status: 'AVAILABLE', profile: { pid: '1-1000000001', name: 'Synthetic College', state: 'DEMO', region: 'Southern', type: null, approvalStatus: null, icid: null, campuses: [] } });
  show(<InstitutionLookup />, '/institutions/lookup');
  expect(screen.getByPlaceholderText('Enter AICTE Permanent Institute ID (PID), e.g., 1-1234567890')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText(/Enter AICTE Permanent Institute ID/), { target: { value: '1-1000000001' } });
  fireEvent.submit(screen.getByPlaceholderText(/Enter AICTE Permanent Institute ID/).closest('form'));
  const checklist = await screen.findByLabelText('Fetch Institution Details (Auto)');
  expect(checklist).toHaveTextContent('IIC ID / ICID (if available): not available');
  expect(checklist).toHaveTextContent('Approval status: UNKNOWN');
  const regions = screen.getByLabelText('REGION-WISE CLASSIFICATION');
  for (const r of ['Northern', 'Western', 'Southern', 'Central', 'Eastern', 'North Eastern']) expect(regions).toHaveTextContent(r);
  expect(screen.queryByText(/Approved \(As of/)).toBeNull();
});

it('[N09] /reports shows trends, performance, region-wise insights and the institution ICID column', async () => {
  const share = { value: 0, numerator: 0, denominator: 1, scope: 'All' };
  handler = async () => ({
    label: 'SYNTHETIC DATA', scope: 'All',
    tiles: { overdueCases: { share }, bureauWiseWorkload: { rows: [] }, trendsAndInsights: { rows: [{ rowId: 'month:2026-10', month: '2026-10', registered: 2, disposed: 1 }] }, institutionWiseHistory: { rows: [{ rowId: 'institution:1-1000000001', pid: '1-1000000001', icid: 'IIC-DEMO0001', name: 'Synthetic', total: 2, open: 1, disposed: 1 }] } },
    resolutionTime: { result: 'UNKNOWN', reason: 'NO_CLOSED_CASES' }, regionWise: [],
  });
  show(<Reports />, '/reports');
  const inst = await screen.findByRole('region', { name: 'Institution-wise report' });
  expect(inst).toHaveTextContent('ICID');
  expect(inst).toHaveTextContent('IIC-DEMO0001');
  expect(screen.getByRole('region', { name: 'Trends' })).toHaveTextContent('2026-10');
});

it('[S09] /audit shows the chain check and the event list; notifications list the SMS sandbox', async () => {
  handler = async (url) => (url.includes('/audit-trail')
    ? { chain: { intact: true, count: 3 }, total: 3, events: [{ seq: 3, at: '2026-10-25T00:00:00Z', actorRole: 'auditor', action: 'audit.trail.viewed', targetType: 'AuditTrail', targetId: 'all', hash: 'a'.repeat(64) }] }
    : { channels: { inApp: 'ACTIVE', email: 'EmailSimulator', sms: 'SmsSimulator (sandbox until approved)' }, items: [{ kind: 'STATUS', at: '2026-10-25T00:00:00Z', text: 'AWAAZ DASTAK: case NX-2026-000951 status is now "Closed". Log in to view details.', link: '/track/NX-2026-000951' }] });
  show(<AuditTrail />, '/audit');
  expect(await screen.findByText(/Hash chain: intact \(3 events\)/)).toBeInTheDocument();
  cleanup();
  show(<Notifications />, '/notifications');
  expect(await screen.findByText('Email and SMS delivery: sandbox')).toBeInTheDocument();
  expect(screen.queryByText(/EmailSimulator|SmsSimulator/)).not.toBeInTheDocument();
  expect(screen.getByText(/NX-2026-000951/)).toBeInTheDocument();
});

it('[N11] the regional view shows region-scoped figures with drill-down links, institutions with ICID, and the queue', async () => {
  state.user = { id: 'synthetic-ro', role: 'regional_officer', region: 'Northern' };
  const share = { value: 50, numerator: 1, denominator: 2, scope: 'Cases in Northern region' };
  handler = async (url) => (url.includes('/workspace/queue') ? queue : {
    label: 'SYNTHETIC DATA', tiles: { totalComplaints: { count: 2 }, pendingCases: { count: 1, share }, overdueCases: { count: 0, share }, disposedCases: { count: 1 }, institutionWiseHistory: { rows: [{ rowId: 'institution:1-1000000001', pid: '1-1000000001', icid: 'not available', name: 'Synthetic', total: 2, open: 1 }] } },
    regionWise: [{ rowId: 'region:Northern', region: 'Northern', total: 2, open: 1, overdue: 0 }],
  });
  show(<RegionalView />, '/regional');
  expect(await screen.findByText('Regional view: Northern region')).toBeInTheDocument();
  expect(await screen.findByRole('region', { name: 'Region-wise' })).toHaveTextContent('Northern');
  expect(screen.getByRole('region', { name: 'Institutions in scope' })).toHaveTextContent('not available');
  expect(screen.getByRole('region', { name: 'Region-wise' }).querySelector('a')).toHaveAttribute('href', '/impact/cases?row=region%3ANorthern');
  expect(await screen.findByRole('link', { name: 'NX-2026-000950' })).toHaveAttribute('href', '/cases/NX-2026-000950');
});
