import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Verify from '../src/pages/trust/Verify.jsx';
import Consents from '../src/pages/trust/Consents.jsx';
import RevealRequests from '../src/pages/trust/RevealRequests.jsx';
import OtpInbox from '../src/pages/trust/OtpInbox.jsx';
import Admin from '../src/pages/admin/Admin.jsx';
import routes from '../src/routes/s1a.jsx';
import s1bRoutes from '../src/routes/s1b.jsx';
import en from '../src/i18n/s1a.en.json';
import hi from '../src/i18n/s1a.hi.json';
import ProtectedRoute from '../src/components/ProtectedRoute.jsx';
const auth = vi.hoisted(() => ({ user: { id: 'student-id', role: 'student' } }));
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => ({ user: auth.user, loading: false }) }));
let handler;
let client;
beforeEach(() => {
  auth.user = { id: 'student-id', role: 'student' };
  handler = async () => ({ status: 200, body: {} });
  vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
    const result = await handler(url, options);
    return { ok: result.status >= 200 && result.status < 300, status: result.status, json: async () => result.body };
  }));
  document.documentElement.lang = 'en';
});
afterEach(() => { cleanup(); client?.clear(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function show(element, path = '/verify') {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path={path} element={element} /></Routes></MemoryRouter></QueryClientProvider>);
}
it('[N01] /verify renders the exact USER VERIFICATION (NEXUS TRUST) title', () => {
  handler = async () => ({ status: 404, body: { error: 'REPORTER_NOT_FOUND' } });
  show(<Verify />);
  expect(screen.getByRole('heading', { name: 'USER VERIFICATION (NEXUS TRUST)' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Student ID verification' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'ABC ID' })).toBeChecked();
  expect(screen.getByLabelText('Student ID number')).toBeInTheDocument();
});
it('[N07] student verification requires consent and OTP before displaying the verified badge and pseudonym', async () => {
  let status='unverified';
  handler=async(url,options={})=>{
    if(url.endsWith('/student/lookup'))return {status:200,body:{status:'confirm_details',last4:'3001',details:{name:'Test Student',institutionPid:'1-7734299133',programme:'B.Tech',enrolment:'Active'},channels:{email:'st***@example.invalid',sms:'Phone ending 0001'}}};
    if(url.endsWith('/student/send-otp'))return {status:200,body:{status:'otp_pending',channel:'email',destination:'st***@example.invalid',expiresAt:'2026-10-28T10:00:00Z'}};
    if(url.endsWith('/student/confirm-otp')){expect(JSON.parse(options.body)).toEqual({code:'271828'});status='verified';}
    return {status:200,body:{reporterId:'RP-7K2Q',status,channel:'email'}};
  };
  show(<Verify/>);
  fireEvent.change(screen.getByLabelText('Student ID number'),{target:{value:'100020003001'}});
  expect(screen.getByRole('button',{name:'Fetch linked details'})).toBeDisabled();
  expect(screen.queryByText('No proxy / verified reporter')).toBeNull();
  fireEvent.click(screen.getByLabelText(/I consent to checking/));fireEvent.click(screen.getByRole('button',{name:'Fetch linked details'}));
  await screen.findByText('Test Student');expect(screen.queryByText('No proxy / verified reporter')).toBeNull();
  fireEvent.click(screen.getByLabelText('These details belong to me.'));fireEvent.click(screen.getByRole('button',{name:'Send verification code'}));
  await screen.findByLabelText('One-time code');expect(screen.queryByText('No proxy / verified reporter')).toBeNull();
  fireEvent.change(screen.getByLabelText('One-time code'),{target:{value:'271828'}});fireEvent.click(screen.getByRole('button',{name:'Verify and complete'}));
  expect(await screen.findByText('No proxy / verified reporter')).toBeInTheDocument();expect(screen.getByText('RP-7K2Q')).toBeInTheDocument();
  await screen.findByRole('heading',{name:'Student verification completed'});
  expect(screen.getByText('No proxy / verified reporter')).toBeInTheDocument();expect(screen.getByText('RP-7K2Q')).toBeInTheDocument();
  expect(fetch.mock.calls.some(([url])=>url.endsWith('/auth/verify/student'))).toBe(false);
});
it('[S26] consent withdrawal updates the displayed state and includes the legal review note', async () => {
  let state = 'granted';
  handler = async (url) => {
    if (url.endsWith('/withdraw')) { state = 'withdrawn'; return { status: 200, body: { retention: { result: 'POLICY_NOT_CONFIGURED' } } }; }
    return { status: 200, body: [{ id: 'grant-1', reporterId: 'RP-7K2Q', purpose: 'verification', scope: 'student', grantedAt: new Date().toISOString(), state }] };
  };
  show(<Consents />, '/my/consents');
  expect(screen.getByText(/Retention is not available: no approved retention policy/)).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: en.withdraw }));
  await waitFor(() => expect(screen.getByRole('button', { name: en.withdraw })).toBeDisabled());
  expect(screen.getByText(/Status: Withdrawn/)).toBeInTheDocument();
});
it('[U09] approved identity is removed when its expiry passes and is absent from Query cache', async () => {
  const expiresAt = new Date(Date.now() + 60_000).toISOString();
  handler = async (url) => ({ status: 200, body: url.endsWith('/view') ? { reporterId: 'RP-7K2Q', expiresAt, identity: { name: 'Synthetic secret identity' } } : [{ id: 'grant-1', reporterId: 'RP-7K2Q', state: 'approved', expiresAt }] });
  show(<RevealRequests />, '/officer/reveal-requests');
  fireEvent.click(await screen.findByRole('button', { name: en.viewIdentity }));
  expect(await screen.findByText('Synthetic secret identity')).toBeInTheDocument();
  const cachedSummaries = client.getQueryData(['s1a', 'student-id', '/identity/reveal-requests']);
  expect(cachedSummaries[0].reporterId).toBe('RP-7K2Q');
  expect(JSON.stringify(cachedSummaries)).not.toContain('Synthetic secret identity');
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse(expiresAt) + 1);
  await waitFor(() => expect(screen.queryByText('Synthetic secret identity')).not.toBeInTheDocument());
});
it('[N04] production hides the demo OTP inbox and never fetches an OTP', async () => {
  handler = async () => ({ status: 200, body: { mode: 'production' } });
  show(<OtpInbox />, '/dev/otp-inbox'); await screen.findByText(en.demoOnly);
  expect(fetch.mock.calls.some(([url]) => url.endsWith('/dev/otp-inbox'))).toBe(false);
});
it('[N79] master data links match every eligible S1b route and rules remain in RuleBook', async () => {
  handler = async () => ({ status: 200, body: [] });
  show(<Admin />, '/admin'); fireEvent.click(screen.getByRole('tab', { name: en.masterData }));
  const eligible = s1bRoutes.filter(route => /institutions|categories|regions/.test(route.path) && route.roles?.includes('system_admin'));
  expect(eligible.map(route => route.path)).toEqual(expect.arrayContaining(['/admin/master/institutions', '/admin/master/categories', '/admin/master/regions']));
  const masterLinks = screen.queryAllByRole('link').filter(link => [en.institutions, en.categories, en.regions].includes(link.textContent));
  expect(masterLinks).toHaveLength(eligible.length);
  for (const route of eligible) {
    const href = route.path.startsWith('/') ? route.path : `/admin/${route.path}`;
    expect(masterLinks.some(link => link.getAttribute('href') === href)).toBe(true);
  }
  if (eligible.length) expect(screen.queryByText(en.masterPending)).not.toBeInTheDocument();
  else expect(screen.getByText(en.masterPending)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: en.rules })); expect(screen.getByText('Managed in RuleBook')).toBeInTheDocument();
});
it('[N79] system_admin follows all three actual master links through protected routes and loads their data', async () => {
  auth.user = { id: 'synthetic-admin', role: 'system_admin' };
  const pages = [
    { path: '/admin/master/institutions', label: en.institutions, title: 'Master Data: Institutions Registry', endpoint: '/institutions/master/institutions', text: 'Synthetic master institution', body: { institutions: [{ pid: '1-1000000001', name: 'Synthetic master institution', state: 'DEMO', region: 'Northern' }] } },
    { path: '/admin/master/categories', label: en.categories, title: 'Master Data: Grievance Categories', endpoint: '/grievances/master/categories', text: 'Synthetic master category', body: { categories: [{ name: 'Synthetic master category', subCategories: ['DEMO'], sensitive: false }] } },
    { path: '/admin/master/regions', label: en.regions, title: 'Master Data: AICTE Six-Region Classification', endpoint: '/institutions/master/regions', text: 'Synthetic master region', body: { regions: [{ code: 'Northern', name: 'Synthetic master region', states: ['DEMO'] }] } },
  ];
  handler = async url => ({ status: 200, body: pages.find(page => url.endsWith(page.endpoint))?.body || [] });
  for (const page of pages) {
    const route = s1bRoutes.find(route => route.path === page.path);
    expect(route.roles).toContain('system_admin');
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/admin']}><Routes><Route path="/admin" element={<ProtectedRoute allowedRoles={['system_admin']}><Admin /></ProtectedRoute>} /><Route path={route.path} element={<ProtectedRoute allowedRoles={route.roles}>{route.element}</ProtectedRoute>} /></Routes></MemoryRouter></QueryClientProvider>);
    fireEvent.click(screen.getByRole('tab', { name: en.masterData }));
    const link = screen.getByRole('link', { name: page.label, exact: true });
    expect(link).toHaveAttribute('href', page.path);
    fireEvent.click(link);
    expect(await screen.findByRole('heading', { name: page.title })).toBeInTheDocument();
    expect(await screen.findByText(page.text)).toBeInTheDocument();
    expect(fetch.mock.calls.some(([url, options]) => url.endsWith(page.endpoint) && options.credentials === 'include')).toBe(true);
    cleanup(); client.clear();
  }
});
it('[N79] a student cannot open any of the three protected master-data pages', () => {
  for (const path of ['/admin/master/institutions', '/admin/master/categories', '/admin/master/regions']) {
    const route = s1bRoutes.find(route => route.path === path);
    show(<ProtectedRoute allowedRoles={route.roles}>{route.element}</ProtectedRoute>, path);
    expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
    cleanup(); client.clear();
  }
  expect(fetch).not.toHaveBeenCalled();
});
it('[N79] populated glob result renders all authorized master links and excludes other routes', async () => {
  // Mock the module returned by Admin's eager import.meta.glob, not S1b source.
  vi.resetModules();
  vi.doMock('../src/routes/s1b.jsx', () => ({ default: [
    ...['institutions', 'categories', 'regions'].map(kind => ({ path: `/admin/${kind}`, roles: ['system_admin'] })),
    { path: '/admin/institutions/archive', roles: ['system_admin'] },
    { path: '/admin/categories/private', roles: ['student'] },
    { path: '/admin/unrelated', roles: ['system_admin'] },
  ] }));
  try {
    const { default: MockedAdmin } = await import('../src/pages/admin/Admin.jsx');
    handler = async () => ({ status: 200, body: [] });
    show(<MockedAdmin />, '/admin');
    fireEvent.click(screen.getByRole('tab', { name: en.masterData }));
    const links = screen.queryAllByRole('link').filter(link => [en.institutions, en.categories, en.regions].includes(link.textContent));
    expect(links.map(link => link.getAttribute('href'))).toEqual(['/admin/institutions', '/admin/categories', '/admin/regions', '/admin/institutions/archive']);
    expect(screen.queryByText(en.masterPending)).not.toBeInTheDocument();
  } finally { vi.doUnmock('../src/routes/s1b.jsx'); vi.resetModules(); }
});
it('[N79] empty glob result preserves the master-data placeholder', async () => {
  vi.resetModules();
  vi.doMock('../src/routes/s1b.jsx', () => ({ default: [] }));
  try {
    const { default: MockedAdmin } = await import('../src/pages/admin/Admin.jsx');
    handler = async () => ({ status: 200, body: [] });
    show(<MockedAdmin />, '/admin');
    fireEvent.click(screen.getByRole('tab', { name: en.masterData }));
    expect(screen.getByText(en.masterPending)).toBeInTheDocument();
    expect(screen.queryAllByRole('link').filter(link => [en.institutions, en.categories, en.regions].includes(link.textContent))).toHaveLength(0);
  } finally { vi.doUnmock('../src/routes/s1b.jsx'); vi.resetModules(); }
});
it('[N68] route registry includes all six pages and localization has complete Hindi key parity', () => {
  expect(routes.map((row) => row.path)).toEqual(['/verify', '/my/consents', '/officer/manual-verification', '/officer/reveal-requests', '/admin', '/dev/otp-inbox']);
  expect(routes.every((row) => row.public === false)).toBe(true);
  expect(routes.find((row) => row.path === '/admin').roles).toEqual(['system_admin']);
  expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
});
