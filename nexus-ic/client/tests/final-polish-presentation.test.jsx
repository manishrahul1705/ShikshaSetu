import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PresentStory from '../src/components/PresentStory.jsx';
import { I18nProvider } from '../src/i18n/index.js';
import { institutionMonths } from '../src/components/InstitutionTrend.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('[N26] the presentation uses the live mean rather than median and preserves unavailable results', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ scope: 'Authorized scope', tiles: { totalComplaints: { count: 12 } }, resolutionTime: { meanDays: 7, medianDays: 3 }, duplicateActions: { flagged: 2 } }) }));
  render(<I18nProvider><PresentStory onClose={() => {}} /></I18nProvider>);
  for (let index = 0; index < 6; index++) fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(await screen.findByText('12')).toBeInTheDocument();
  expect(screen.getByText('7')).toBeInTheDocument();
  expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  expect(screen.queryByText('3')).not.toBeInTheDocument();
  expect(screen.getByText('Scope: Authorized scope')).toBeInTheDocument();
});
it('[N12] the institution trend counts only supplied records in the last twelve UTC months', () => {
  const months = institutionMonths([{ createdAt: '2026-10-02' }, { createdAt: '2026-10-03' }, { createdAt: '2024-01-01' }, {}], new Date('2026-10-26T00:00:00Z'));
  expect(months).toHaveLength(12);
  expect(months[0].month).toBe('2025-11');
  expect(months[11]).toEqual({ month: '2026-10', count: 2 });
  expect(months.reduce((sum, row) => sum + row.count, 0)).toBe(2);
});
