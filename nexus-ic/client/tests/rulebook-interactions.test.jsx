import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup, act } from '@testing-library/react';
import { I18nProvider } from '../src/i18n/index.js';
import RuleBook from '../src/pages/rulebook/RuleBook.jsx';
import { policyDifferences } from '../src/pages/rulebook/RuleComparison.jsx';
const auth=vi.hoisted(()=>({user:{id:'reviewer',role:'supervisor'}}));
vi.mock('../src/context/AuthContext.jsx',()=>({useAuth:()=>auth}));
const base={_id:'active',family:'JURISDICTION',version:'DEMO-ROUTE-v1',status:'approved',effectiveFrom:'2026-01-01',createdAt:'2026-01-01',requestedBy:{_id:'other',username:'requester'},body:{threshold:10,enabled:true},dryRunPassed:true};
let rows;
beforeEach(()=>{
 auth.user={id:'reviewer',role:'supervisor'};
 rows=[base,{...base,_id:'draft',version:'DEMO-ROUTE-v2',status:'draft',description:'Updated jurisdiction thresholds',body:{threshold:20,newFlag:false},dryRunPassed:false}];
 vi.stubGlobal('fetch',vi.fn(async(url)=>{
  if(String(url).endsWith('/families'))return {ok:true,json:async()=>({families:['JURISDICTION','SLA'],activeRules:{JURISDICTION:{version:base.version},SLA:{status:'POLICY_NOT_CONFIGURED'}}})};
  if(String(url).includes('/dry-run')){rows=rows.map(v=>v._id==='draft'?{...v,status:'pending_approval',dryRunPassed:true}:v);return {ok:true,json:async()=>({passed:true,totalCases:3})};}
  return {ok:true,json:async()=>String(url).includes('family=SLA')?[]:rows};
 }));
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const show=()=>render(<I18nProvider><RuleBook/></I18nProvider>);
it('inspects draft parameters and compares added, removed and changed values',async()=>{
 show();fireEvent.click(await screen.findByRole('button',{name:'Inspect DEMO-ROUTE-v2'}));
 expect(within(screen.getByRole('region',{name:'Policy inspector'})).getByText('Proposed value')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Find a policy parameter'),{target:{value:'absent'}});
 expect(screen.getByText('No policy parameters match your search.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Clear parameter search'}));
 fireEvent.click(screen.getByText('Compare policy versions'));
 expect(screen.getByText('3 of 3 parameter changes')).toBeInTheDocument();
 for(const kind of ['Added','Removed','Changed'])expect(screen.getByText(kind)).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Find a changed parameter'),{target:{value:'threshold'}});
 expect(screen.getByText('1 of 3 parameter changes')).toBeInTheDocument();
});
it('filters family and version lists, clears filters and switches families',async()=>{
 show();await screen.findByRole('button',{name:'Inspect DEMO-ROUTE-v2'});
 fireEvent.change(screen.getByLabelText('Version status'),{target:{value:'draft'}});
 expect(screen.queryByRole('button',{name:'Inspect DEMO-ROUTE-v1'})).toBeNull();
 fireEvent.change(screen.getByLabelText('Find a version'),{target:{value:'absent'}});
 expect(screen.getByText('No versions match your filters.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Clear version filters'}));
 fireEvent.change(screen.getByLabelText('Find a policy family'),{target:{value:'sla'}});
 const nav=screen.getByRole('navigation',{name:'Policy families'});
 expect(within(nav).queryByRole('button',{name:/Jurisdiction/})).toBeNull();
 fireEvent.click(within(nav).getByRole('button',{name:/Sla/i}));
 expect(await screen.findByText('No versions recorded for this policy family.')).toBeInTheDocument();
});
it('retains dry-run feedback and allows approval after the version becomes pending',async()=>{
 show();fireEvent.click(await screen.findByRole('button',{name:'Inspect DEMO-ROUTE-v2'}));
 expect(screen.getByRole('button',{name:'Approve'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Run Dry-Run'}));
 await screen.findByText('Dry-run PASSED: 3 fixture cases evaluated.');
 await waitFor(()=>expect(screen.getByRole('button',{name:'Approve'})).toBeEnabled());
 expect(screen.getByText('Dry-run PASSED: 3 fixture cases evaluated.')).toBeInTheDocument();
});
it('preserves auditor read-only access and blocks requester self-approval',async()=>{
 auth.user={id:'other',role:'supervisor'};rows[1]={...rows[1],dryRunPassed:true,status:'pending_approval'};
 show();fireEvent.click(await screen.findByRole('button',{name:'Inspect DEMO-ROUTE-v2'}));
 expect(screen.getByRole('button',{name:'Approve'})).toBeDisabled();expect(screen.getByText(/You requested this version/)).toBeInTheDocument();
 cleanup();auth.user={id:'audit-user',role:'auditor'};show();
 fireEvent.click(await screen.findByRole('button',{name:'Inspect DEMO-ROUTE-v2'}));
 expect(screen.queryByRole('button',{name:'Approve'})).toBeNull();expect(screen.queryByRole('button',{name:'Run Dry-Run'})).toBeNull();
 expect(screen.getByText(/Read-only access/)).toBeInTheDocument();expect(screen.getByRole('button',{name:'What-If Preview'})).toBeEnabled();
});
it('distinguishes missing, null, typed zero and nested array parameters',()=>{
 expect(policyDifferences({a:null,b:0,list:['a'],same:{x:true}},{b:'0',list:['a','b'],same:{x:true}})).toEqual([{path:'/a',before:null,after:undefined,kind:'Removed'},{path:'/b',before:0,after:'0',kind:'Changed'},{path:'/list/1',before:undefined,after:'b',kind:'Added'}]);
});

it('ignores a late response from the previous family after selection changes',async()=>{
 let finishOld;
 fetch.mockImplementation(async url=>{
  if(String(url).endsWith('/families'))return {ok:true,json:async()=>({families:['JURISDICTION','SLA'],activeRules:{}})};
  if(String(url).includes('family=JURISDICTION'))return new Promise(resolve=>{finishOld=()=>resolve({ok:true,json:async()=>rows});});
  return {ok:true,json:async()=>[]};
 });
 show();
 fireEvent.click(await screen.findByRole('button',{name:/Sla.*No active policy recorded/i}));
 await screen.findByText('No versions recorded for this policy family.');
 await act(async()=>{finishOld();await new Promise(resolve=>setTimeout(resolve,0));});
 await waitFor(()=>expect(screen.queryByRole('button',{name:'Inspect DEMO-ROUTE-v1'})).toBeNull());
 expect(screen.getByText('No versions recorded for this policy family.')).toBeInTheDocument();
});
it('shows load errors and recovers using Try again without presenting a failed feed as zero',async()=>{
 const working=fetch.getMockImplementation();
 fetch.mockImplementationOnce(working).mockImplementationOnce(async()=>({ok:false,json:async()=>({})}));
 show();
 await screen.findByRole('alert');
 expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0);
 fireEvent.click(screen.getByRole('button',{name:'Try again'}));
 expect(await screen.findByRole('button',{name:'Inspect DEMO-ROUTE-v1'})).toBeInTheDocument();
});
