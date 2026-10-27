import React from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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
const pages = [{path:'/',element:<Home/>}, {path:'/login',element:<Login/>}, {path:'/dashboard',element:<Dashboard/>}, ...routes, ...routes.filter(r=>['/impact/cases','/requests/combined','/documents/locker'].includes(r.path)).map(r=>({...r,initialSearch:r.path==='/impact/cases'?'?row=tile:transferDelays':r.path==='/requests/combined'?'?pid=1-7734299133':'?caseId=NX-2026-000803'}))];
let client;
const nativeFetch=globalThis.fetch;
const sessions=new Map(), findings=[];
let studentCase='NX-2026-000803';
const accounts={student:'trust_student_verified',faculty:'faculty1',institution_admin:'inst_admin1',bureau_officer:'rb_officer1',regional_officer:'regional1',supervisor:'supervisor1',competent_authority:'authority1',auditor:'auditor1',system_admin:'sysadmin1'};
beforeAll(async()=>{
 for(const [role,username] of Object.entries(accounts)) {
  const response=await nativeFetch('http://localhost:3100/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password:'demo1234'})});
  if(!response.ok) throw new Error(`Local audit login failed: ${role} (${response.status})`);
  sessions.set(role,{cookie:response.headers.get('set-cookie').split(';')[0],user:(await response.json()).user});
 }
 const response=await nativeFetch('http://localhost:3100/api/v1/track',{headers:{cookie:sessions.get('student').cookie}});
 const cases=await response.json(); studentCase=cases[0]?.masterCaseId || studentCase;
},30000);
afterAll(()=>console.info(`Local API render checks: ${findings.length}; component crashes: ${findings.filter(row=>row.componentCrash).length}. Browser geometry and workflow submissions are not covered.`));
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
});
afterEach(() => { cleanup(); client?.clear(); vi.unstubAllGlobals(); });

describe('Every registered page: live local API rendering (not browser coverage)', () => {
  for (const page of pages) {
    it(`renders ${page.path} with live local API data`, async () => {
      const role = page.path==='/officer-workload' ? 'bureau_officer' : page.roles?.includes('supervisor') ? 'supervisor' : page.roles?.[0] || 'student';
      const session=sessions.get(role), requests=[], pending=new Set();
      auth.user = session.user;
      vi.stubGlobal('fetch', (url, init={}) => {
        const full=new URL(String(url),'http://localhost:3100');
        if(full.origin!=='http://localhost:3100') return Promise.reject(new Error('External network disabled in local audit'));
        if(init.method && init.method!=='GET') return Promise.reject(new Error('Workflow mutations disabled in route audit'));
        const promise=nativeFetch(full,{...init,headers:{...init.headers,cookie:session.cookie},signal:AbortSignal.timeout(7000)}).then(response=>{requests.push({path:full.pathname,status:response.status});return response;});
        pending.add(promise); promise.then(()=>pending.delete(promise),()=>pending.delete(promise));return promise;
      });
      client = new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false}}});
      const path = page.path.replace(':caseId',role==='student'?studentCase:'NX-2026-000803').replace(':institutionPid','1-7734299133').replace(':pid','1-7734299133').replace(':id',page.path.startsWith('/institutions/')?'1-7734299133':'missing-audit-draft');
      let view;
      await act(async () => {
        view = render(<QueryClientProvider client={client}><I18nProvider><MemoryRouter initialEntries={[path+(page.initialSearch || '')]}><Boundary><Routes><Route path={page.path} element={page.element}/><Route path="*" element={<p>Redirected to another page</p>}/></Routes></Boundary></MemoryRouter></I18nProvider></QueryClientProvider>);
      });
      await act(async () => { for(let i=0;i<10;i++){ await Promise.allSettled([...pending]); await new Promise(resolve=>setTimeout(resolve,50)); } });
      findings.push({route:page.path,initialSearch:page.initialSearch || null,role,requests,componentCrash:view.queryByTestId('crash')?.textContent || null,renderedCharacters:view.container.textContent.trim().length});
      expect(view.queryByTestId('crash'), view.queryByTestId('crash')?.textContent).toBeNull();
      expect(view.container.textContent.trim().length).toBeGreaterThan(0);
    },20000);
  }
});
