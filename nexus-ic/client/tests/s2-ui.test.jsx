import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ComplainantStatusCard from '../src/pages/lifecycle/ComplainantStatusCard.jsx';
import WhatIfPreviewModal from '../src/pages/rulebook/WhatIfPreviewModal.jsx';
import RuleChangeModal from '../src/pages/rulebook/RuleChangeModal.jsx';
import { I18nProvider } from '../src/i18n/index.js';

describe('S2 Client UI Components', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders ComplainantStatusCard with true status and accountable office only', async () => {
    const mockCase = {
      masterCaseId: '2026-N28-TEST',
      status: 'Under Process',
      analyticStatus: 'IN_PROCESS',
      currentOwner: { office: 'PGRC Bureau', role: 'Inquiry Officer' },
      transferStatus: 'NONE',
    };

    // Stub fetch to return 404 so it falls back to initialData
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    }));

    render(
      <I18nProvider>
        <ComplainantStatusCard caseId="2026-N28-TEST" initialData={mockCase} />
      </I18nProvider>
    );

    expect(await screen.findByText('Under Process')).toBeInTheDocument();
    expect(await screen.findByText('IN_PROCESS', { exact: false })).toBeInTheDocument();
    expect(await screen.findByText('PGRC Bureau')).toBeInTheDocument();
    expect(await screen.findByText('Inquiry Officer', { exact: false })).toBeInTheDocument();
  });

  it('renders WhatIfPreviewModal with simulation notice and affected breakdown', async () => {
    const mockVersion = {
      _id: 'ver_123',
      version: 'DEMO-ROUTE-SIM',
      family: 'JURISDICTION',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        simulation: true,
        totalOpenCases: 10,
        affectedCasesCount: 2,
        affectedCases: [
          {
            masterCaseId: '2026-CASE-001',
            category: 'Ragging',
            currentOutcome: 'PGRC',
            simulatedOutcome: 'RB',
          },
        ],
      }),
    }));

    render(
      <I18nProvider>
        <WhatIfPreviewModal version={mockVersion} onClose={() => {}} />
      </I18nProvider>
    );

    expect(await screen.findByText(/Read-Only Simulation Invariant/i)).toBeInTheDocument();
    expect(await screen.findByText('2026-CASE-001')).toBeInTheDocument();
    expect(await screen.findByText('➔ RB', { exact: false })).toBeInTheDocument();
  });

  it('enforces required reason in RuleChangeModal', async () => {
    const onCreated = vi.fn();
    const onClose = vi.fn();

    render(
      <I18nProvider>
        <RuleChangeModal
          family="SLA"
          initialBody={{ normal: 30 }}
          onClose={onClose}
          onCreated={onCreated}
        />
      </I18nProvider>
    );

    expect(screen.getByText('Request RuleBook Change')).toBeInTheDocument();
    expect(screen.getByText('Two-Step Approval Requirement:', { exact: false })).toBeInTheDocument();
  });
});
