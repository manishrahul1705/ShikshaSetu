import React from 'react';
import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../src/i18n/index.js';
import Dashboard from '../src/pages/Dashboard.jsx';
import Institution360 from '../src/pages/institutions/Institution360.jsx';
import ReviewPage from '../src/pages/prevent/ReviewPage.jsx';
import PreventPanel from '../src/pages/prevent/PreventPanel.jsx';
import ActionCheck from '../src/pages/prevent/ActionCheck.jsx';
import { CoSign } from '../src/pages/prevent/CoSign.jsx';
import en from '../src/i18n/s4.en.json';
import hi from '../src/i18n/s4.hi.json';
import intake from '../src/i18n/s1b.en.json';
const state = vi.hoisted(()=>({user:{id:'synthetic-officer',role:'bureau_officer',bureau:'RB',displayName:'Synthetic officer'}}));
vi.mock('../src/context/AuthContext.jsx',()=>({useAuth:()=>({user:state.user,logout:vi.fn()})}));
let client, handler;
const banner='Potential Overlapping Cases – Coordination Required';
const pairs=[{cases:['NX-2026-000001','NX-2026-000002'],score:65,identity:'NOT_AVAILABLE',signals:[{name:'issue',weight:25,contribution:25,reason:'EVIDENCE_AGREES'}],reasons:['SIMILAR_ISSUE_EVIDENCE'],counterReasons:['PERIOD_NOT_AVAILABLE']}];
beforeEach(()=>{
  state.user={id:'synthetic-officer',role:'bureau_officer',bureau:'RB',displayName:'Synthetic officer'};
  vi.spyOn(navigator,'language','get').mockReturnValue('en-IN');
  handler=async url=>url.includes('/prevent/overlaps')?{result:'REVIEW',pairs,restrictedCount:1}:url.includes('/prevent/alerts')?[]:url.endsWith('/co-sign')?{count:14}:url.includes('/360')?{institution:{pid:'1-1000000001',name:'Synthetic institution',region:'Northern',state:'DEMO',type:'DEMO',aliases:[],campuses:[]},jurisdiction:{region:'Northern',statesUnderRegion:'DEMO',referenceTable:'DEMO-REGIONS-v1'},icidMapping:[],attentionIndicators:[],grievances:{total:0,visible:[]}}:{};
  vi.stubGlobal('fetch',vi.fn(async(url,options={})=>{const body=await handler(url,options);return {ok:true,status:200,json:async()=>body};}));
});
afterEach(()=>{cleanup();client?.clear();vi.restoreAllMocks();vi.unstubAllGlobals();});
function show(element,path='/',pattern=path){client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});return render(<QueryClientProvider client={client}><I18nProvider><MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={element}/></Routes></MemoryRouter></I18nProvider></QueryClientProvider>);}
it('[N17] exact overlap banner appears on dashboard, institution and review with authorized links only',async()=>{
  for(const [element,path,pattern]of[[<Dashboard/>,'/dashboard','/dashboard'],[<Institution360/>,'/institutions/1-1000000001','/institutions/:id'],[<ReviewPage/>,'/review','/review']]){
    show(element,path,pattern);expect(await screen.findByRole('heading',{name:banner})).toBeInTheDocument();
    for(const id of pairs[0].cases)expect(screen.getByRole('link',{name:id})).toHaveAttribute('href',`/cases/${id}`);
    expect(screen.getByText('1 restricted entries')).toBeInTheDocument();expect(screen.queryByText('NX-2026-999999')).not.toBeInTheDocument();
    cleanup();client.clear();
  }
});
it('[S23] generic intake hints expose no third-party link and continuing remains available',async()=>{
  state.user={id:'synthetic-student',role:'student'};
  handler=async()=>({checkId:'synthetic-check',result:'REVIEW',canProceed:true,reasons:['SIMILAR_ISSUE_EVIDENCE'],hints:[{generic:true,notice:'a similar open matter exists',reasons:['SIMILAR_ISSUE_EVIDENCE'],counterReasons:['ADVISORY_ONLY']}]});
  const proceed=vi.fn();show(<PreventPanel draft={{institutionPid:'1-1000000001',narrative:'own synthetic draft'}} onContinue={proceed}/>);
  expect(await screen.findByText('a similar open matter exists')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:en.s4ViewEarlier})).not.toBeInTheDocument();expect(screen.queryByRole('link')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:en.s4Continue}));await waitFor(()=>expect(proceed).toHaveBeenCalledOnce());
  expect(fetch.mock.calls.some(([url,options])=>url.endsWith('/choice')&&JSON.parse(options.body).choice==='continue')).toBe(true);
});
it('[U14] own-case view, cancel and unavailable-check continuation never gate the user',async()=>{
  const cancel=vi.fn();handler=async()=>({checkId:'synthetic-check',result:'REVIEW',hints:[{caseId:'NX-2026-000001',reasons:['SIMILAR_ISSUE_EVIDENCE'],signals:[],counterReasons:[]}]});
  show(<PreventPanel draft={{narrative:'own draft'}} onCancel={cancel}/>);
  expect(await screen.findByRole('button',{name:en.s4ViewEarlier})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:en.s4Cancel}));await waitFor(()=>expect(cancel).toHaveBeenCalledOnce());
  cleanup();client.clear();handler=async()=>{throw new Error('offline');};const proceed=vi.fn();show(<PreventPanel draft={{narrative:'own draft'}} onContinue={proceed}/>);
  await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:en.s4Continue}));expect(proceed).toHaveBeenCalledOnce();
});
it('[N17] action form shows reasons and counter-reasons and Proceed works for every result',async()=>{
  for(const result of ['CLEAR','REVIEW','UNKNOWN']){
    const proceed=vi.fn();handler=async url=>url.endsWith('/proceed')?{proceeded:true}:{checkId:'synthetic-check',result,canProceed:true,reasons:['NO_NAMED_CONFLICT_FOUND'],counterReasons:['HUMAN_DECIDES'],relatedCases:[]};
    show(<ActionCheck onProceed={proceed}/>);
    fireEvent.change(screen.getByLabelText(en.s4CaseId),{target:{value:'NX-2026-000001'}});fireEvent.change(screen.getByLabelText(en.s4Subject),{target:{value:'Synthetic receipt'}});
    fireEvent.click(screen.getByRole('button',{name:en.s4Check}));await screen.findByText(en.s4_NO_NAMED_CONFLICT_FOUND);expect(screen.getByText(en.s4_HUMAN_DECIDES)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(result==='CLEAR'?'No overlapping action found':result==='REVIEW'?'Potential overlapping action':'Not available');
    if(result==='REVIEW') {
      expect(screen.getByRole('button',{name:'Proceed anyway'})).toBeDisabled();
      fireEvent.change(screen.getByRole('textbox',{name:'Reason to proceed anyway'}),{target:{value:'Reviewed the evidence; a separate instruction remains necessary.'}});
    }
    fireEvent.click(screen.getByRole('button',{name:result==='REVIEW'?'Proceed anyway':en.s4Proceed}));await waitFor(()=>expect(proceed).toHaveBeenCalledOnce());
    cleanup();client.clear();
  }
});
it('[A-N59] officer view is a count only and eligible students receive an anonymous button',async()=>{
  show(<CoSign caseId="NX-2026-000001"/>);expect(await screen.findByText('14 verified co-signers')).toBeInTheDocument();
  cleanup();client.clear();state.user={id:'synthetic-student',role:'student'};let signed=false;
  handler=async(url,options)=>{if(options.method==='POST')signed=true;return {eligible:true,signed};};
  show(<CoSign caseId="NX-2026-000001"/>);fireEvent.click(await screen.findByRole('button',{name:en.s4Back}));expect(await screen.findByRole('button',{name:en.s4Signed})).toBeDisabled();
  expect(Object.keys(en).sort()).toEqual(Object.keys(hi).sort());
});
it('[S23] switching accounts immediately removes the previous account own-case hints',async()=>{
  state.user={id:'first-student',role:'student'};
  handler=async()=>({checkId:'synthetic-check',result:'REVIEW',hints:[{caseId:'NX-2026-000009',reasons:[],signals:[],counterReasons:[]}]});
  const draft={narrative:'same draft'};
  const wrapper=({children})=><I18nProvider><MemoryRouter>{children}</MemoryRouter></I18nProvider>;
  const view=render(<PreventPanel draft={draft}/>,{wrapper});
  await screen.findByText('NX-2026-000009');
  state.user={id:'second-student',role:'student'};
  handler=async()=>({checkId:'second-check',result:'CLEAR',hints:[]});
  view.rerender(<PreventPanel draft={draft}/>);
  expect(screen.queryByText('NX-2026-000009')).not.toBeInTheDocument();
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('CLEAR'));
});
it('[U14] existing preview confirm and edit controls also log choices without being gated',async()=>{
  handler=async()=>({checkId:'synthetic-check',result:'CLEAR',hints:[],reasons:[]});
  const confirm=vi.fn(),edit=vi.fn();
  show(<div><PreventPanel draft={{narrative:'own synthetic draft'}}/><button type="button" onClick={confirm}>{intake.confirmAndSubmit}</button><button type="button" onClick={edit}>{intake.editGrievance}</button></div>);
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('CLEAR'));
  fireEvent.click(screen.getByRole('button',{name:intake.confirmAndSubmit}));expect(confirm).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button',{name:intake.editGrievance}));expect(edit).toHaveBeenCalledOnce();
  await waitFor(()=>expect(fetch.mock.calls.filter(([url])=>url.endsWith('/choice'))).toHaveLength(2));
  expect(fetch.mock.calls.filter(([url])=>url.endsWith('/choice')).map(([,options])=>JSON.parse(options.body).choice)).toEqual(['continue','cancel']);
});
