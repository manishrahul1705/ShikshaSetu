import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import InstitutionPicker from '../src/components/InstitutionPicker.jsx';
import { I18nProvider } from '../src/i18n/index.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const institution = { pid: '1-1000000001', icid: 'IIC-228M6C2D', name: 'Arohan Vidyarekha Institute', city: 'Lucknow', state: 'Uttar Pradesh', region: 'Northern', type: 'Engineering', icidCheck: 'MATCH' };

it('[R32] the picker searches public metadata and keyboard selection returns the PID with ICID', async () => {
  const selected = vi.fn();
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ institutions: [institution] }) });
  vi.stubGlobal('fetch', fetcher);
  render(<I18nProvider><InstitutionPicker onSelect={selected} /></I18nProvider>);
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'Lucknow' } });
  const option = await screen.findByRole('option');
  expect(option).toHaveTextContent('Uttar Pradesh · Northern · Engineering');
  expect(option).toHaveTextContent('IIC-228M6C2D');
  expect(fetcher).toHaveBeenCalledWith('/api/v1/institutions/search?q=Lucknow', expect.objectContaining({ credentials: 'include' }));
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(selected).toHaveBeenCalledWith(institution);
  expect(screen.queryByRole('option')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('IIC-228M6C2D · MATCH');
});

it('[U04] a missing ICID is explicitly not available and does not block selecting its PID', async () => {
  const selected = vi.fn();
  const missing = { ...institution, icid: null, icidCheck: 'NOT_AVAILABLE' };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ institutions: [missing] }) }));
  render(<I18nProvider><InstitutionPicker onSelect={selected} /></I18nProvider>);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: missing.pid } });
  const option = await screen.findByRole('option');
  expect(option).toHaveTextContent('ICID not available');
  fireEvent.click(option);
  expect(selected).toHaveBeenCalledWith(missing);
  expect(screen.getByRole('status')).toHaveTextContent('ICID not available · NOT_AVAILABLE');
});
