import React from 'react';
import { it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CaseJourney from '../src/pages/cases/CaseJourney.jsx';
import InstitutionGraph from '../src/pages/graph/InstitutionGraph.jsx';
import { classify } from '../src/components/GlobalSearch.jsx';
import { navFor } from '../src/components/navigation.js';
const auth=vi.hoisted(()=>({role:'bureau_officer'}));
vi.mock('../src/context/AuthContext.jsx',()=>({useAuth:()=>({user:{role:auth.role}})}));

let client;
afterEach(() => { cleanup(); client?.clear(); vi.unstubAllGlobals(); auth.role='bureau_officer'; });

const journey = {
  synthetic: true,
  case: { masterCaseId: 'NX-2026-001002', status: 'Closed', category: 'Faculty Shortage', subCategory: 'Unqualified Faculty', priority: 'normal', channel: 'import', owningBureau: 'TL', currentOwner: { office: 'TL', role: 'bureau_officer' }, transferStatus: 'ACCEPTED', createdAt: '2026-10-12T00:00:00Z', updatedAt: '2026-10-20T00:00:00Z', documentCount: 0 },
  institution: { pid: '1-0194978623', icid: 'IIC-SYNTH001', icidResult: 'MATCH', snapshot: { name: 'Synthetic institution', region: 'Southern', state: 'Kerala' }, registry: null },
  sources: [{ kind: 'CHANNEL', system: 'IMPORT', ref: 'Bulk import (adapter)', at: '2026-10-12T00:00:00Z' }, { kind: 'EXTERNAL_REF', system: 'CPGRAMS_SIMULATOR', ref: 'CPG-SIM-100001', at: null }],
  routing: [], transfers: [{ fromBureau: 'AB', toBureau: 'TL', status: 'ACCEPTED', requestedAt: '2026-10-13T00:00:00Z', acknowledgedAt: '2026-10-13T10:00:00Z' }],
  milestones: [{ at: '2026-10-12T00:00:00Z', kind: 'REGISTERED', label: 'Registered via IMPORT', by: 'complainant' }, { at: '2026-10-13T10:00:00Z', kind: 'TRANSFER_ACCEPTED', label: 'Transfer accepted by TL', by: 'TL' }],
  events: [{ seq: 49, at: '2026-10-25T00:00:00Z', actorRole: 'system', action: 'case.showcase_seeded', hash: 'df8b0f85898a' }],
};

it('[N09] the officer case journey shows the Master Case ID, PID, ICID with its check, the source trail and the timeline', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => journey })));
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/cases/NX-2026-001002']}><Routes><Route path="/cases/:caseId" element={<CaseJourney />} /></Routes></MemoryRouter></QueryClientProvider>);
  expect(await screen.findByText('NX-2026-001002')).toBeInTheDocument();
  expect(screen.getByText('1-0194978623')).toBeInTheDocument();
  expect(screen.getByText('IIC-SYNTH001')).toBeInTheDocument();
  expect(screen.getByText('ICID matches PID')).toBeInTheDocument();
  expect(screen.getByText('CPGRAMS reference')).toHaveAttribute('title', 'CPGRAMS_SIMULATOR');
  expect(screen.queryByText('CPGRAMS_SIMULATOR')).not.toBeInTheDocument();
  expect(screen.getByText('Transfer accepted by TL')).toBeInTheDocument();
  expect(screen.getByText(/No routing decision recorded for this case \(UNKNOWN\)/)).toBeInTheDocument();
});

it('[R32] global search sends a Master Case ID to the case, a PID to Institution 360, and anything else to ICID resolution', () => {
  expect(classify('nx-2026-000801')).toEqual({ kind: 'case', value: 'NX-2026-000801' });
  expect(classify('1-0194978623')).toEqual({ kind: 'pid', value: '1-0194978623' });
  expect(classify(' IIC-228M6C2D ')).toEqual({ kind: 'icid', value: 'IIC-228M6C2D' });
  expect(classify('   ')).toBeNull();
});

it('[S02] the sidebar shows each role only the modules its routes allow', () => {
  const paths = (role) => navFor(role).flatMap((g) => g.items.map((i) => i.to));
  expect(paths('student')).toEqual(expect.arrayContaining(['/grievances/new', '/track']));
  expect(paths('student')).not.toContain('/audit');
  expect(paths('auditor')).toEqual(expect.arrayContaining(['/audit', '/impact']));
  expect(paths('auditor')).not.toContain('/grievances/new');
  expect(paths('system_admin')).toContain('/admin');
});
it('[S02] case action links match auditor and administrator route permissions',async()=>{
 for(const role of ['auditor','system_admin']) {
  auth.role=role;
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>journey})));
  client=new QueryClient({defaultOptions:{queries:{retry:false}}});
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/cases/NX-2026-001002']}><Routes><Route path="/cases/:caseId" element={<CaseJourney />} /></Routes></MemoryRouter></QueryClientProvider>);
  await screen.findByText('NX-2026-001002');
  if(role==='auditor') {
   expect(screen.queryByRole('link',{name:'NEXUS SYNC'})).not.toBeInTheDocument();
   expect(screen.queryByRole('link',{name:'NEXUS TRACE'})).not.toBeInTheDocument();
   expect(screen.getByRole('link',{name:'Closure & proof'})).toHaveAttribute('href','/closure/NX-2026-001002');
  } else {
   expect(screen.queryByRole('link',{name:'Closure & proof'})).not.toBeInTheDocument();
   expect(screen.queryByRole('link',{name:'Institution 360'})).not.toBeInTheDocument();
   expect(screen.queryByRole('link',{name:'Overlap timeline'})).not.toBeInTheDocument();
   expect(screen.getByRole('link',{name:'NEXUS SYNC'})).toHaveAttribute('href','/sync/1-0194978623');
  }
  cleanup();client.clear();
 }
});
it('[S02] graph readers never call the officer-only overlap API or receive its action link',async()=>{
 for(const role of ['auditor','system_admin']) {
  auth.role=role;
  const fetch=vi.fn(async url=>({ok:true,json:async()=>url.includes('/radar')?{axes:[],note:'Scoped operational indicators'}:{nodes:[],edges:[],restrictedEntries:0}}));
  vi.stubGlobal('fetch',fetch);
  client=new QueryClient({defaultOptions:{queries:{retry:false}}});
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/graph/institutions/1-0194978623']}><Routes><Route path="/graph/institutions/:pid" element={<InstitutionGraph />} /></Routes></MemoryRouter></QueryClientProvider>);
  await screen.findByText('Scoped operational indicators');
  expect(fetch.mock.calls.some(([url])=>url.includes('/prevent/overlaps'))).toBe(false);
  expect(screen.queryByRole('link',{name:'PREVENT review'})).not.toBeInTheDocument();
  cleanup();client.clear();
 }
});
