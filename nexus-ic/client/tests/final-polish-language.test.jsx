import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider, useI18n } from '../src/i18n/index.js';
import InstitutionPicker from '../src/components/InstitutionPicker.jsx';
import SyncPage from '../src/pages/sync/SyncPage.jsx';

vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => ({ user: { role: 'bureau_officer', bureau: 'RB' } }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function Hindi() { const { setLang } = useI18n(); return <button onClick={() => setLang('hi')}>Hindi</button>; }

it('[N64] the institution picker switches its label and search guidance to the Hindi bundle', () => {
  render(<I18nProvider><Hindi /><InstitutionPicker onSelect={() => {}} /></I18nProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Hindi' }));
  expect(screen.getByRole('combobox', { name: 'संस्थान खोजें' })).toHaveAttribute('placeholder', 'नाम, शहर, राज्य, PID या ICID');
  expect(screen.queryByText('Find an institution')).not.toBeInTheDocument();
});

it('[N21] SYNC without a PID asks for an institution and never fetches a default institution', () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  render(<I18nProvider><MemoryRouter initialEntries={['/sync']}><SyncPage /></MemoryRouter></I18nProvider>);
  expect(screen.getByRole('combobox', { name: 'Find an institution' })).toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
});
