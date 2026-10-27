import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import InstitutionPicker from '../src/components/InstitutionPicker.jsx';
import IndiaMap, { ILLUSTRATIVE_LABEL } from '../src/components/IndiaMap.jsx';
import { I18nProvider } from '../src/i18n/index.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

// Synthetic STAND-IN rows only; no real college data.
const official = { pid: '1-9000000001', icid: 'IIC-STNDIN01', name: 'Sri Example College of Engineering', city: 'Example Nagar', state: 'Tamil Nadu', region: 'Southern', type: 'Engineering', approvalStatus: 'UNKNOWN', icidCheck: 'MATCH', source: { kind: 'official', label: 'Official AICTE list as of 2026-10-01', listDate: '2026-10-01' } };
const fictional = { pid: '1-9000000002', icid: null, name: 'Arohan Example Institute', city: 'Lucknow', state: 'Uttar Pradesh', region: 'Northern', type: 'Engineering', approvalStatus: 'approved', icidCheck: 'NOT_AVAILABLE' };

function stubSearch(rows, profile = null) {
  const fetcher = vi.fn(async url => {
    if (String(url).includes('/institutions/public/')) return { ok: Boolean(profile), json: async () => profile };
    return { ok: true, json: async () => ({ institutions: rows }) };
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}
const renderPicker = props => render(<I18nProvider><InstitutionPicker onSelect={vi.fn()} {...props} /></I18nProvider>);

it('[A-N97] the dropdown waits for two characters and never searches on one', async () => {
  const fetcher = stubSearch([official]);
  renderPicker();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 's' } });
  expect(screen.getByRole('status')).toHaveTextContent('Type at least 2 characters');
  await new Promise(resolve => setTimeout(resolve, 350));
  expect(fetcher).not.toHaveBeenCalled();
});

it('[A-N97] each option shows name, city, state, PID, ICID or "ICID not available", and a source badge', async () => {
  stubSearch([official, fictional]);
  renderPicker();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'sece' } });
  const options = await screen.findAllByRole('option');
  expect(options[0]).toHaveTextContent('Sri Example College of Engineering');
  expect(options[0]).toHaveTextContent('Example Nagar · Tamil Nadu');
  expect(options[0]).toHaveTextContent('1-9000000001 · IIC-STNDIN01');
  expect(options[0]).toHaveTextContent('Official AICTE list as of 2026-10-01');
  expect(options[1]).toHaveTextContent('ICID not available');
  expect(options[1]).toHaveTextContent('Fictional demo data');
  expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Matching institutions');
});

it('[A-N97] keyboard selection: arrows move, Enter picks, Escape closes', async () => {
  const onSelect = vi.fn();
  stubSearch([official, fictional]);
  renderPicker({ onSelect });
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'example' } });
  await screen.findAllByRole('option');
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  expect(input.getAttribute('aria-activedescendant')).toMatch(/-1$/);
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onSelect).toHaveBeenCalledWith(official);
  fireEvent.change(input, { target: { value: 'arohan' } });
  await screen.findAllByRole('option');
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('[A-N97] choosing a match auto-fills PID and ICID and opens the details card with a state-level map pin', async () => {
  const onSelect = vi.fn();
  stubSearch([fictional], { ...fictional, district: 'Lucknow', approvalValidUntil: '2028-06-30' });
  renderPicker({ onSelect, showDetails: true });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'arohan' } });
  fireEvent.click(await screen.findByRole('option'));
  expect(onSelect).toHaveBeenCalledWith(fictional);
  expect(screen.getAllByRole('status')[0]).toHaveTextContent('1-9000000002 · ICID not available');
  const card = await screen.findByTestId('institution-details-card');
  expect(within(card).getByText('Permanent Institute ID (PID)')).toBeInTheDocument();
  expect(within(card).getAllByText('ICID not available').length).toBeGreaterThan(0);
  await waitFor(() => expect(within(card).getByText(/approved \(valid until 2028-06-30\)/)).toBeInTheDocument());
  expect(within(card).getByTestId('map-pin')).toHaveAttribute('data-pin-level', 'state');
  expect(within(card).getByTestId('map-pin-caption')).toHaveTextContent('Location shown at state level (Uttar Pradesh, Northern region)');
});

it('[A-N97] no results shows "No match" with a hint, never an empty box', async () => {
  stubSearch([]);
  renderPicker();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzqq' } });
  expect(await screen.findByTestId('picker-no-match')).toHaveTextContent('No match. Try the acronym');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('[A-N100] states are individually selectable, list their colleges and open the details on click', async () => {
  const onSelectInstitution = vi.fn();
  vi.stubGlobal('fetch', vi.fn(async url => ({ ok: true, json: async () => (String(url).includes('state-counts') ? { states: { 'Tamil Nadu': { fictional: 3, official: 1 } } } : { institutions: [official] }) })));
  render(<IndiaMap explorer interactive={false} onSelectInstitution={onSelectInstitution} />);
  const tamilNadu = await screen.findByRole('button', { name: /Tamil Nadu\s*4/ });
  expect(tamilNadu).toHaveAttribute('title', 'Tamil Nadu · Southern region · 4 colleges in active registry sources');
  fireEvent.focus(tamilNadu);
  expect(screen.getByText(/Tamil Nadu · Southern region · 4 colleges/)).toBeInTheDocument();
  fireEvent.click(tamilNadu);
  expect(tamilNadu).toHaveAttribute('aria-pressed', 'true');
  expect(document.querySelector('[data-region="Southern"]')).toHaveClass('fill-saffron-400');
  fireEvent.click(await screen.findByRole('button', { name: /Sri Example College of Engineering/ }));
  expect(onSelectInstitution).toHaveBeenCalledWith(official);
  expect(screen.getByRole('button', { name: 'Kerala' })).toBeInTheDocument();
});

it('[A-N100] zoom, pan and reset change the view; a chosen college highlights its region and drops a pin', () => {
  render(<IndiaMap selectedState="Tamil Nadu" institutionName="Sri Example College of Engineering" institutionPid="1-9000000001" interactive={false} />);
  const svg = document.querySelector('svg');
  expect(svg.getAttribute('viewBox')).toBe('0 0 600 650');
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(svg.getAttribute('viewBox')).not.toBe('0 0 600 650');
  fireEvent.click(screen.getByRole('button', { name: 'Pan left' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reset map' }));
  expect(svg.getAttribute('viewBox')).toBe('0 0 600 650');
  expect(document.querySelector('[data-region="Southern"]')).toHaveClass('fill-saffron-400');
  expect(screen.getByTestId('map-pin')).toHaveAttribute('data-pin-level', 'state');
  expect(screen.getByRole('button', { name: 'Tamil Nadu' })).toHaveAttribute('aria-pressed', 'true');
  for (const name of ['Zoom in', 'Zoom out', 'Reset map']) expect(screen.getByRole('button', { name }).className).toContain('min-h-10');
});

it('[A-N100] the map is labelled illustrative and pins at city level only when the record has coordinates', () => {
  const { rerender } = render(<IndiaMap selectedRegion="Northern" interactive={false} />);
  expect(screen.getByTestId('map-illustrative-label')).toHaveTextContent(ILLUSTRATIVE_LABEL);
  expect(ILLUSTRATIVE_LABEL).toBe('Illustrative map, boundaries not official');
  expect(screen.queryByTestId('map-pin')).not.toBeInTheDocument();
  rerender(<IndiaMap selectedState="Uttar Pradesh" selectedCity="Lucknow" institutionName="Arohan Example Institute" interactive={false} />);
  expect(screen.getByTestId('map-pin')).toHaveAttribute('data-pin-level', 'state');
  rerender(<IndiaMap selectedState="Uttar Pradesh" institutionName="Arohan Example Institute" coordinates={{ x: 310, y: 230 }} interactive={false} />);
  expect(screen.getByTestId('map-pin')).toHaveAttribute('data-pin-level', 'city');
  expect(screen.getByTestId('map-pin-caption')).toHaveTextContent('city location from the college record');
});

it('[A-N99] the self-check panel is labelled simulated, never shows the full number back and confirms instantly', async () => {
  const { default: SelfCheckPanel } = await import('../src/pages/trust/SelfCheckPanel.jsx');
  const calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    const data = String(url).endsWith('/lookup')
      ? { status: 'confirm_details', last4: '3001', details: { name: 'Aarav Sharma', institutionPid: '1-7734299133', programme: 'B.Tech Computer Science (synthetic)', enrolment: 'Active' } }
      : { status: 'verified', last4: '3001', selfService: true };
    return { ok: true, json: async () => data };
  }));
  const onVerified = vi.fn();
  render(<SelfCheckPanel onVerified={onVerified} />);
  expect(screen.getByTestId('simulated-label')).toHaveTextContent('Simulated check, not a government verification');
  fireEvent.change(screen.getByLabelText(/Your ABC ID/), { target: { value: '1000-2000-3001' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Fetch my details' }));
  expect(await screen.findByText('B.Tech Computer Science (synthetic)')).toBeInTheDocument();
  expect(document.body.textContent).not.toContain('1000-2000-3001');
  expect(document.body.textContent).toContain('••••3001');
  fireEvent.click(screen.getByRole('button', { name: 'Yes, these are my details' }));
  expect(await screen.findByText(/Verified instantly \(simulated\)/)).toBeInTheDocument();
  expect(onVerified).toHaveBeenCalled();
  expect(calls[1].body).toMatchObject({ kind: 'abc', detailsAreMine: true });
  fireEvent.click(screen.queryByRole('tab', { name: /ABC/ }) || document.body);
});

it('[A-N99] a student without an ABC ID can switch to the synthetic Aadhaar check', async () => {
  const { default: SelfCheckPanel } = await import('../src/pages/trust/SelfCheckPanel.jsx');
  render(<SelfCheckPanel />);
  fireEvent.click(screen.getByRole('tab', { name: 'I don’t have an ABC ID' }));
  expect(screen.getByLabelText(/Aadhaar number \(synthetic test number only/)).toBeInTheDocument();
  expect(screen.getByText(/Verhoeff checksum/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Fetch my details' })).toBeDisabled();
});
