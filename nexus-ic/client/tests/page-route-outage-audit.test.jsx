import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import routes from '../src/routes/index.jsx';
import Home from '../src/pages/Home.jsx';
import Login from '../src/pages/Login.jsx';
import Dashboard from '../src/pages/Dashboard.jsx';
import { I18nProvider } from '../src/i18n/index.js';

const auth = vi.hoisted(() => ({ user: null, loading: false, login: vi.fn(), logout: vi.fn(), setUser: vi.fn() }));
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => auth }));
class Boundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? <div data-testid="crash">{this.state.error.message}</div> : this.props.children; }
}
const pages = [{path:'/',element:<Home/>}, {path:'/login',element:<Login/>}, {path:'/dashboard',element:<Dashboard/>}, ...routes];
let client;
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
});
afterEach(() => { cleanup(); client?.clear(); vi.unstubAllGlobals(); });

describe('Every registered page: service outage rendering (not live browser coverage)', () => {
  for (const page of pages) {
    it(`renders ${page.path} without a component crash when services are unavailable`, async () => {
      const role = page.roles?.[0] || 'student';
      auth.user = {id:'audit-user', _id:'audit-user', username:'audit-user', role, reporterId:'RP-AUDIT', verificationStatus:'verified', bureau:'Regulation Bureau', region:'Northern'};
      vi.stubGlobal('fetch', vi.fn(async () => ({ok:false,status:503,json:async()=>({error:'Service unavailable for route outage check'}),text:async()=>'Service unavailable'})));
      client = new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false}}});
      const path = page.path.replace(':caseId','NX-2026-000803').replace(':institutionPid','1-7734299133').replace(':pid','1-7734299133').replace(':id','audit-record');
      let view;
      await act(async () => {
        view = render(<QueryClientProvider client={client}><I18nProvider><MemoryRouter initialEntries={[path]}><Boundary><Routes><Route path={page.path} element={page.element}/><Route path="*" element={<p>Redirected to another page</p>}/></Routes></Boundary></MemoryRouter></I18nProvider></QueryClientProvider>);
      });
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 80)); });
      expect(view.queryByTestId('crash'), view.queryByTestId('crash')?.textContent).toBeNull();
      expect(view.container.textContent.trim().length).toBeGreaterThan(0);
    });
  }
});
