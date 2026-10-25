import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import IndiaMap from '../src/components/IndiaMap.jsx';
import { INDIA_STATES } from '../src/components/maps/indiaStates.js';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('[A-N100] geographic map renders all 36 state/UT paths and keyboard selection fetches the chosen state', async () => {
  const selected = vi.fn();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ institutions: [], nextOffset: null }) })));
  render(<IndiaMap explorer onSelectState={selected} stateCounts={{}} />);
  expect(INDIA_STATES).toHaveLength(36);
  expect(document.querySelectorAll('path[data-map-state]')).toHaveLength(36);
  expect(new Set(INDIA_STATES.map(s => s.name)).size).toBe(36);
  const tamil = document.querySelector('path[data-map-state="Tamil Nadu"]');
  fireEvent.keyDown(tamil, { key: 'Enter' });
  expect(selected).toHaveBeenCalledWith('Tamil Nadu', 'Southern');
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('state=Tamil%20Nadu'), expect.any(Object)));
  expect(screen.getByTestId('map-illustrative-label')).toHaveTextContent('boundaries not official');
});

it('[A-N100] failed state feeds display UNKNOWN and do not present an empty successful list', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
  render(<IndiaMap explorer stateCounts={{}} />);
  fireEvent.click(document.querySelector('path[data-map-state="Kerala"]'));
  expect(await screen.findByText('College list unavailable (UNKNOWN). Try again.')).toBeInTheDocument();
});

it('[A-N100] loading the next state page retains institutions from the first page', async () => {
  vi.stubGlobal('fetch', vi.fn(async url => ({ ok: true, json: async () => String(url).includes('offset=50')
    ? { institutions: [{ pid: '1-12345678', name: 'Second page college' }], nextOffset: null }
    : { institutions: [{ pid: '1-4166771', name: 'First page college' }], nextOffset: 50 } })));
  render(<IndiaMap explorer stateCounts={{}} />);
  fireEvent.click(document.querySelector('path[data-map-state="Tamil Nadu"]'));
  expect(await screen.findByText('First page college')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Load more institutions' }));
  expect(await screen.findByText('Second page college')).toBeInTheDocument();
  expect(screen.getByText('First page college')).toBeInTheDocument();
});
