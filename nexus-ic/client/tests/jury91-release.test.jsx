import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import TransferTimeline from '../src/pages/trace/TransferTimeline.jsx';
import TransfersPage from '../src/pages/trace/TransfersPage.jsx';
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => ({ user: { role: 'bureau_officer' } }) }));
vi.mock('../src/i18n/index.js', () => ({ useI18n: () => ({ t: key => key }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('[N20] transfer timeline shows all four steps without claiming acceptance before the recorded acceptance', () => {
  const { rerender } = render(<TransferTimeline transfer={{ status: 'REQUESTED', toBureau: 'RB' }} />);
  for (const label of ['Requested', 'Acceptance Pending', 'Accepted', 'New Owner Active']) expect(screen.getByText(label)).toBeInTheDocument();
  expect(screen.getAllByText('Not reached')).toHaveLength(2);
  expect(screen.getByText(/Sender remains accountable/)).toBeInTheDocument();
  rerender(<TransferTimeline transfer={{ status: 'ACCEPTED', toBureau: 'RB' }} />);
  expect(screen.queryByText('Not reached')).not.toBeInTheDocument();
  expect(screen.getByText('RB')).toBeInTheDocument();
});

it('[N20] an explicit transfer request uses the real endpoint and preserves the pending sender accountability message', async () => {
  const calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
    calls.push([url, options]);
    return { ok: true, json: async () => url === '/api/v1/bureaus' ? [{ code: 'RB', name: 'Regulation Bureau' }] : { transfers: [] } };
  }));
  render(<TransfersPage />);
  await screen.findByRole('option', { name: 'Regulation Bureau' });
  fireEvent.change(screen.getByLabelText('Transfer Master Case ID'), { target: { value: 'NX-2026-000003' } });
  fireEvent.change(screen.getByLabelText('Destination bureau'), { target: { value: 'Regulation Bureau' } });
  fireEvent.change(screen.getByLabelText('Transfer reason'), { target: { value: 'Synthetic coordination reason' } });
  fireEvent.click(screen.getByRole('button', { name: 'Request transfer' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sender remains accountable'));
  const request = calls.find(([url, options]) => url === '/api/v1/transfers' && options.method === 'POST');
  expect(JSON.parse(request[1].body)).toEqual({ masterCaseId: 'NX-2026-000003', toBureau: 'Regulation Bureau', reason: 'Synthetic coordination reason' });
});
