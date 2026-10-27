import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';
import AuditChainCheck from '../src/additions/n66-integrity-banner/AuditChainCheck.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';

describe('[A-N66] Synthetic-data banner and chain-check button', () => {
  beforeEach(() => {
    // Mock global fetch for session/config calls
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/v1/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { username: 'testadmin', role: 'system_admin', displayName: 'Test Admin' } }),
        });
      }
      if (url === '/api/v1/config/mode') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ mode: 'demo' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('[A-N66] Manish override removes data labels on every route while retaining the integrity control', async () => {
    const routesToTest = ['/', '/login', '/dashboard'];

    for (const route of routesToTest) {
      const { unmount } = render(
        <AuthProvider>
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        </AuthProvider>
      );

      // Explicit 25 October override: disclosure moves to documents and spoken script.
      expect(screen.queryByText(/SYNTHETIC DATA/i)).not.toBeInTheDocument();

      unmount();
    }
  });

  it('[A-N66] chain-check button hidden in production mode', () => {
    // Case 1: In production mode, button must NOT render even for system_admin
    const { unmount: unmountProd } = render(
      <AuditChainCheck userRole="system_admin" appMode="production" />
    );
    expect(screen.queryByRole('button', { name: /check audit chain/i })).toBeNull();
    unmountProd();

    // Case 2: In demo mode for authorized role, button MUST render
    const { unmount: unmountDemo } = render(
      <AuditChainCheck userRole="system_admin" appMode="demo" />
    );
    expect(screen.getByRole('button', { name: /check audit chain/i })).toBeInTheDocument();
    unmountDemo();

    // Case 3: In demo mode for non-admin role (e.g. student), button must NOT render
    const { unmount: unmountStudent } = render(
      <AuditChainCheck userRole="student" appMode="demo" />
    );
    expect(screen.queryByRole('button', { name: /check audit chain/i })).toBeNull();
    unmountStudent();
  });
});
