import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TransfersPage from '../src/pages/trace/TransfersPage.jsx';
import SyncPage from '../src/pages/sync/SyncPage.jsx';
import QueryThread from '../src/pages/queries/QueryThread.jsx';
import InsiderAlertsPage from '../src/pages/insider/InsiderAlertsPage.jsx';
import LeaveManagementPage from '../src/pages/absence/LeaveManagementPage.jsx';
import { I18nProvider } from '../src/i18n/index.js';

const authState = vi.hoisted(() => ({
  user: { id: 'officer_01', role: 'bureau_officer', bureau: 'PGRC', displayName: 'Test Officer' },
}));

vi.mock('../src/context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: authState.user, logout: vi.fn() }),
}));

function renderWithProviders(ui, path = '/', pattern = path) {
  const client = new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
  return render(
    <QueryClientProvider client={client}>
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider>
        <Routes>
          <Route path={pattern} element={ui} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('S3 Client UI Components (N20, N21, N54, N60, N70, N75, S17, S18, S24, U20-U23)', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders TransfersPage with incoming transfers, overdue indicator and accept/reject actions', async () => {
    const mockTransfers = [
      {
        _id: 'tr_001',
        masterCaseId: 'NX-2026-000100',
        fromBureau: 'PGRC',
        toBureau: 'RB',
        reason: 'Subject matter involves regulatory affiliation compliance',
        status: 'REQUESTED',
        escalationDueAt: new Date(Date.now() - 3600000).toISOString(), // overdue
      },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transfers: mockTransfers }),
    }));

    renderWithProviders(<TransfersPage />);

    expect(await screen.findByText('NX-2026-000100')).toBeInTheDocument();
    expect(await screen.findByText('REQUESTED')).toBeInTheDocument();
    expect(await screen.findByText(/OVERDUE/i)).toBeInTheDocument();
    expect(await screen.findByText('Accept Transfer')).toBeInTheDocument();
    expect(await screen.findByText('Reject Transfer')).toBeInTheDocument();
  });

  it('renders SyncPage with shared institution view, restricted entries count, and internal notes warning', async () => {
    const mockSyncData = {
      institutionPid: '1-1000000001',
      accessibleCases: [
        {
          _id: 'c_001',
          masterCaseId: 'NX-2026-000200',
          category: 'Infrastructure',
          status: 'Under Process',
          owningBureau: 'PGRC',
          priority: 'NORMAL',
        },
      ],
      restrictedCount: 4,
      coordinations: [
        {
          _id: 'coord_001',
          leadBureau: 'PGRC',
          participatingBureaus: ['PGRC', 'RB'],
          status: 'ACTIVE',
        },
      ],
      tasks: [],
    };

    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/combined-requests/counts')) return Promise.resolve({ok:true,json:async()=>({numerator:0,denominator:0,scope:'Test institution'})});
      if (url.includes('/combined-requests')) return Promise.resolve({ok:true,json:async()=>[]});
      if (url.includes('/internal-notes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            notes: [
              {
                _id: 'n_01',
                authorRole: 'bureau_officer',
                authorBureau: 'PGRC',
                noteText: 'Confidential investigation note',
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockSyncData,
      });
    }));

    renderWithProviders(<SyncPage />, '/sync/1-1000000001', '/sync/:institutionPid');

    expect(await screen.findByText('NX-2026-000200')).toBeInTheDocument();
    expect(await screen.findByText(/4 restricted entries hidden/i)).toBeInTheDocument();
    expect(await screen.findByText(/Internal to officers only - never shown to complainant/i)).toBeInTheDocument();
  });

  it('renders QueryThread with query details, replied state, and response loop', async () => {
    const mockQueries = [
      {
        _id: 'q_001',
        recipientType: 'complainant',
        queryText: 'Please furnish certified fee receipt from your bank.',
        status: 'RESPONDED',
        queriedAt: new Date(Date.now() - 7200000).toISOString(),
        respondedAt: new Date(Date.now() - 3600000).toISOString(),
        responderRole: 'student',
        responseText: 'Attached debit statement showing transaction reference.',
      },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ queries: mockQueries }),
    }));

    renderWithProviders(<QueryThread />, '/queries/NX-2026-000320', '/queries/:caseId');

    expect(await screen.findByText(/certified fee receipt/i)).toBeInTheDocument();
    expect(await screen.findByText(/Attached debit statement/i)).toBeInTheDocument();
    expect(await screen.findByText(/Responded/i)).toBeInTheDocument();
  });

  it('renders InsiderAlertsPage with supervisory notice that alerts never block officers', async () => {
    const mockAlerts = [
      {
        _id: 'alert_001',
        alertType: 'REPEATED_REVEAL_REQUESTS',
        severity: 'HIGH',
        officerId: 'off_99',
        ruleId: 'DEMO-INSIDER-v1',
        count: 5,
        windowMinutes: 60,
        detectedAt: new Date().toISOString(),
      },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ alerts: mockAlerts }),
    }));

    renderWithProviders(<InsiderAlertsPage />);

    expect(await screen.findByText(/Notice: Insider-access alerts are supervisory warnings and never block officer operations/i)).toBeInTheDocument();
    expect(await screen.findByText('Repeated identity requests')).toHaveAttribute('title', 'REPEATED_REVEAL_REQUESTS');
    expect(await screen.findByText('Insider rule v1')).toBeInTheDocument();
    expect(screen.queryByText('REPEATED_REVEAL_REQUESTS')).not.toBeInTheDocument();
  });

  it('renders LeaveManagementPage with transfer handover blocker when active cases exist', async () => {
    vi.stubGlobal('fetch', vi.fn((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'Leave cannot be approved: You are the active accountable owner of open cases.',
            blockingCases: [
              {
                caseId: 'case_block_01',
                masterCaseId: 'NX-2026-000450',
                status: 'Under Process',
                category: 'Governance',
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ isOnLeave: false }),
      });
    }));

    renderWithProviders(<LeaveManagementPage />);

    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2026-11-05' } });
    fireEvent.change(screen.getByLabelText(/Reason for Absence/i), { target: { value: 'Annual Leave' } });
    fireEvent.click(screen.getByRole('button', { name: /Request Leave/i }));

    expect(await screen.findByText(/Leave cannot be approved/i)).toBeInTheDocument();
    expect(await screen.findByText('NX-2026-000450')).toBeInTheDocument();
    expect(await screen.findByText(/Go to NEXUS TRACE Transfers/i)).toBeInTheDocument();
  });
});
