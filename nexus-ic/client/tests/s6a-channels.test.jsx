import React from 'react';
import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { readFileSync } from 'node:fs';
// Paths resolve from the client folder (Vitest's working directory); under jsdom import.meta.url did not point at this file, so new URL(..., import.meta.url) resolved to C:\.
import { resolve } from 'node:path';
import vm from 'node:vm';
import { URL } from 'node:url';
import { I18nProvider } from '../src/i18n/index.js';
import EmailDraft from '../src/pages/channels/EmailDraft.jsx';
import Channels from '../src/pages/channels/Channels.jsx';
import Integrity from '../src/additions/n57-integrity/Integrity.jsx';
import Benchmark from '../src/pages/benchmark/Benchmark.jsx';
import { installPwa, isStandalone } from '../src/pwa/bootstrap.js';
import en from '../src/i18n/s6a.en.json';
import hi from '../src/i18n/s6a.hi.json';
import s4 from '../src/i18n/s4.en.json';
import s1b from '../src/i18n/s1b.en.json';
import AdminImport from '../src/pages/channels/AdminImport.jsx';
import routes from '../src/routes/s6a.jsx';
const auth=vi.hoisted(()=>({user:{id:'synthetic-user',username:'trust_student_verified',role:'student'}}));
vi.mock('../src/context/AuthContext.jsx',()=>({useAuth:()=>({user:auth.user})}));
let queryClient;
beforeEach(() => { auth.user.role='student'; vi.stubGlobal('fetch', vi.fn(async () => ({ok:true,json:async()=>({})}))); });
afterEach(() => {cleanup(); queryClient?.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks();});
function show(element,path='/channels') {
  queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
  return render(<QueryClientProvider client={queryClient}><I18nProvider><MemoryRouter initialEntries={[path]}><Routes><Route path={path.includes('/email/')?'/channels/email/:id':path} element={element}/></Routes></MemoryRouter></I18nProvider></QueryClientProvider>);
}
it('[N33] channels explains installable PWA, no offline queue, and native apps remain PLANNED-P2 with complete Hindi labels',()=>{
  show(<Channels/>); expect(screen.getByText(en.s6aPwa)).toBeInTheDocument(); expect(screen.getByText(en.s6aNative)).toBeInTheDocument();
  expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
});
it('[N15] manifest is installable and bootstrap registers the same-origin worker without storing session data',async()=>{
  const manifest=JSON.parse(readFileSync(resolve('public/manifest.webmanifest'),'utf8'));
  expect(manifest.name).toBe('AWAAZ DASTAK'); expect(manifest.display).toBe('standalone');
  for(const size of [192,512]) {
    const icon=manifest.icons.find(icon=>icon.sizes===`${size}x${size}`); expect(icon).toBeTruthy();
    const bytes=readFileSync(resolve(`public${icon.src}`)); expect(bytes.readUInt32BE(16)).toBe(size); expect(bytes.readUInt32BE(20)).toBe(size);
  }
  const register=vi.fn(async()=>({})); await installPwa(document,{serviceWorker:{register}});
  expect(readFileSync(resolve('index.html'),'utf8').match(/rel="manifest"/g)).toHaveLength(1); expect(register).toHaveBeenCalledWith('/sw.js',{scope:'/'});
  expect(isStandalone({matchMedia:()=>({matches:true})},{})).toBe(true);expect(isStandalone({matchMedia:()=>({matches:false})},{})).toBe(false);expect(isStandalone({}, {standalone:true})).toBe(true);
});
it('[N15] service worker caches only static shell assets, uses network-only for case/API data and clears caches on logout',async()=>{
 const listeners={},addAll=vi.fn(async()=>{}),put=vi.fn(),remove=vi.fn(async()=>true);
 const network=vi.fn(async input=>input==='/'?{ok:true,text:async()=>'<script src="/assets/app-123.js"></script><link href="/assets/style-123.css"><link href="/api/v1/cases"><script src="https://outside.invalid/assets/leak.js"></script>'}:{body:'ephemeral network response'});
 const match=vi.fn(async key=>key==='/pwa/offline.html'?{body:'You are offline'}:null);
 const context={URL,Response:class{constructor(body){this.body=body;}},self:{location:{origin:'https://synthetic.invalid'},addEventListener:(name,fn)=>{listeners[name]=fn;},skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>({addAll,put}),keys:async()=>['awaaz-s6a-static-v2','awaaz-s6a-offline-v1','other-app'],match,delete:remove},fetch:network};
 vm.runInNewContext(readFileSync(resolve('public/sw.js'),'utf8'),context);
 let pending;listeners.install({waitUntil:p=>{pending=p;}});await pending;
 expect(addAll.mock.calls.flatMap(([urls])=>urls)).toEqual(['/pwa/offline.html','/pwa/icon-192.png','/pwa/icon-512.png','/assets/app-123.js','/assets/style-123.css']);
 for(const request of [{url:'https://synthetic.invalid/api/v1/cases',method:'GET',mode:'navigate'},{url:'https://synthetic.invalid/api/v1/documents/secret/download',method:'GET',mode:'navigate'},{url:'https://synthetic.invalid/api/v1/grievances',method:'POST',mode:'cors'}]) {
  match.mockClear();listeners.fetch({request,respondWith:p=>{pending=p;}});expect((await pending).body).toBe('ephemeral network response');expect(match).not.toHaveBeenCalled();expect(network).toHaveBeenLastCalledWith(request);
 }
 for(const request of [{url:'https://outside.invalid/',method:'GET',mode:'navigate'},{url:'https://synthetic.invalid/non-api-mutation',method:'POST',mode:'cors'}]){const respondWith=vi.fn();listeners.fetch({request,respondWith});expect(respondWith).not.toHaveBeenCalled();}
 const request={url:'https://synthetic.invalid/my/cases/secret',method:'GET',mode:'navigate'};
 listeners.fetch({request,respondWith:p=>{pending=p;}});expect((await pending).body).toBe('ephemeral network response');expect(put).not.toHaveBeenCalled();
 network.mockRejectedValueOnce(new Error('offline'));listeners.fetch({request,respondWith:p=>{pending=p;}});expect((await pending).body).toBe('You are offline');
 listeners.fetch({request:{url:'https://synthetic.invalid/api/v1/auth/logout',method:'POST'},respondWith:p=>{pending=p;}});await pending;
 expect(remove.mock.calls.map(([key])=>key)).toEqual(['awaaz-s6a-static-v2','awaaz-s6a-offline-v1']);expect(remove).not.toHaveBeenCalledWith('other-app');expect(put).not.toHaveBeenCalled();
});
it('[U15] email opens in the portal, previews with real PREVENT panel and confirms only after explicit continue',async()=>{
 const draft={institutionPid:'1-1000000001',category:'Infrastructure',subCategory:'Lab Equipment',narrative:'Synthetic original email complaint'};
 fetch.mockImplementation(async(url,options={})=>({ok:true,json:async()=>{
  if(url.endsWith('/identity/me'))return{status:'verified'};
  if(url.endsWith('/categories'))return{categories:[{name:'Infrastructure',subCategories:['Lab Equipment'],sensitive:false}]};
  if(url.includes('/registry/institutions/'))return{pid:draft.institutionPid,name:'Synthetic S6a institution',icid:'not available',state:'DEMO',region:'Northern'};
  if(url.endsWith('/grievances/draft'))return{grievance:{languageTag:'en'}};
  if(url.endsWith('/preview'))return{draft,previewToken:'synthetic-token'};
  if(url.endsWith('/confirm'))return{masterCaseId:'NX-2026-000042',institutionPid:draft.institutionPid,status:'SUBMITTED'};
  if(url.endsWith('/check-similar'))return{checkId:'check-1',result:'CLEAR',hints:[]};
  if(url.endsWith('/choice'))return{};
  return{draft,status:'AWAITING_CONFIRMATION'};
 }}));
 show(<EmailDraft/>,'/channels/email/aaaaaaaaaaaaaaaaaaaaaaaa');
 await screen.findByDisplayValue(draft.narrative);await screen.findByText('Synthetic S6a institution');
 expect(fetch.mock.calls.some(([url])=>url.endsWith('/confirm'))).toBe(false);expect(document.querySelector('input[type=file]')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:s1b.previewAndConfirm}));
 expect(await screen.findByRole('heading',{name:'AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)'})).toBeInTheDocument();
 expect(fetch.mock.calls.some(([url])=>url.endsWith('/confirm'))).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:s4.s4Continue}));
 expect(await screen.findByText('NX-2026-000042')).toBeInTheDocument();
 expect(fetch.mock.calls.find(([url])=>url.endsWith('/confirm'))[1].body).toBe(JSON.stringify({previewToken:'synthetic-token'}));
 expect(fetch.mock.calls.some(([url])=>url==='/api/v1/grievances')).toBe(false);
});
it('[A-N57] integrity UI exposes immutable daily hashes, admin computation and honest recompute mismatch',async()=>{
 auth.user.role='system_admin';
 fetch.mockImplementation(async url=>({ok:true,json:async()=>url.endsWith('/config/mode')?{mode:'demo'}:url.endsWith('/compare')?{match:false,chainVerified:false}:{fingerprints:[{day:'2026-10-24',rootHash:'a'.repeat(64),eventCount:2,chainVerified:false,computedAt:'2026-10-25T00:00:00Z'}]}}));
 show(<Integrity/>,'/integrity');
 expect(await screen.findByText('Chain verified: NO')).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/delete|edit|overwrite/i})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Recompute and compare'}));expect(await screen.findByText('MISMATCH — current chain verified: NO')).toBeInTheDocument();
 expect(await screen.findByRole('button',{name:'Compute yesterday'})).toBeInTheDocument();
});
it('[A-N48] benchmark shows numerator denominator scope and UNKNOWN without invented percent',async()=>{
  fetch.mockResolvedValue({ok:true,json:async()=>({status:'UNKNOWN',reason:'NO_BENCHMARK_RUN',synthetic:true})});show(<Benchmark/>,'/benchmark');
 expect(await screen.findByText('No evaluation recorded')).toBeInTheDocument();expect(screen.queryByText(/Accuracy \(all labelled pairs\)/)).not.toBeInTheDocument();
 expect(screen.queryByText('UNKNOWN NO_BENCHMARK_RUN')).not.toBeInTheDocument();
});

it('[N15] admin import shows S2 row outcomes and preserves quarantined rows visibly',async()=>{
 auth.user.role='system_admin';
 fetch.mockImplementation(async(url,options={})=>({ok:true,json:async()=>url.endsWith('/review')?[]:{id:'batch-1',state:'PREVIEW',quarantined:[2],rows:[{row:1,reporterId:'RP-7K2Q',institutionPid:'1-1000000001',sourceSystem:'Synthetic',sourceRef:'SYN-1',status:'WOULD_CREATE'},{row:2,reporterId:'RP-7K2Q',institutionPid:'1-1000000002',sourceSystem:'Synthetic',sourceRef:'SYN-2',status:'IDENTITY_REVIEW'}]}}));
 show(<AdminImport/>,'/admin/import');fireEvent.change(screen.getByRole('textbox',{name:'CSV'}),{target:{value:'synthetic CSV'}});fireEvent.click(screen.getByRole('button',{name:en.s6aPreview}));
 expect(await screen.findByText('Would create')).toHaveAttribute('title','WOULD_CREATE');expect(screen.getByText('Identity review required')).toHaveAttribute('title','IDENTITY_REVIEW');expect(screen.getByText(en.s6aQuarantine)).toBeInTheDocument();
 expect(routes.find(row=>row.path==='/admin/import').roles).toEqual(['system_admin']);expect(routes.find(row=>row.path==='/benchmark').roles).toEqual(['system_admin','supervisor']);expect(routes.some(row=>row.path==='/my/email-drafts')).toBe(true);
});
