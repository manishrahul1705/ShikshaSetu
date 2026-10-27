import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DrillDown from '../src/additions/n47-drilldown/DrillDown.jsx';
import OfficerWorkspace from '../src/pages/workspace/OfficerWorkspace.jsx';
import { TrackList } from '../src/pages/track/Track.jsx';

let client;
afterEach(()=>{cleanup();client?.clear();vi.unstubAllGlobals();});
function show(node, route = '/') {
 client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[route]}>{node}</MemoryRouter></QueryClientProvider>);
}
it('[A-N47] a direct drill-down offers accessible measures and makes no empty-row API request',()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch);show(<DrillDown />, '/impact/cases');
 expect(screen.getByRole('heading',{name:'Explore the cases behind a number'})).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Pending cases →'})).toHaveAttribute('href','/impact/cases?row=tile:pendingCases');
 expect(fetch).not.toHaveBeenCalled();
});
it('[N29] case tracking shows twelve cases at a time and every filtered case remains reachable',async()=>{
 const cases=Array.from({length:25},(_,index)=>({masterCaseId:`NX-2026-${String(index+1).padStart(6,'0')}`,category:'Fee Dispute',subCategory:'Refund Denial',status:'Under Process'}));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>cases})));
 show(<TrackList />, '/track');
 expect(await screen.findByRole('link',{name:'NX-2026-000001'})).toHaveAttribute('href','/track/NX-2026-000001');
 expect(screen.queryByRole('link',{name:'NX-2026-000013'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByRole('link',{name:'NX-2026-000013'})).toBeInTheDocument();
 fireEvent.change(screen.getByRole('textbox',{name:'Search queue'}),{target:{value:'000025'}});
 expect(screen.getByRole('link',{name:'NX-2026-000025'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Previous'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();
});
it('[N28] queue pagination and filtering retain clickable case IDs and explain a missing SLA without exposing its code',async()=>{
 const rows=Array.from({length:25},(_,index)=>({masterCaseId:`NX-2026-${String(index+1).padStart(6,'0')}`,status:index===24?'Registered':'Under Process',transferStatus:'REQUESTED',accountableOwner:{office:'Regulation Bureau',role:'bureau_officer'},sla:{result:'POLICY_NOT_CONFIGURED'}}));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({scope:'Regulation Bureau',counts:{open:25},cases:rows,tasks:[],incomingTransfers:[],myRecentActions:[]})})));
 show(<OfficerWorkspace />);
 expect(await screen.findByRole('link',{name:'NX-2026-000001'})).toHaveAttribute('href','/cases/NX-2026-000001');
 expect(screen.queryByRole('link',{name:'NX-2026-000025'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByRole('link',{name:'NX-2026-000025'})).toBeInTheDocument();
 fireEvent.change(screen.getByRole('textbox',{name:'Search queue'}),{target:{value:'000025'}});
 await waitFor(()=>expect(screen.getAllByRole('link',{name:/NX-2026/})).toHaveLength(1));
 expect(screen.getByText('No approved policy')).toHaveAttribute('title','POLICY_NOT_CONFIGURED');
 expect(screen.queryByText('POLICY_NOT_CONFIGURED')).not.toBeInTheDocument();
});
