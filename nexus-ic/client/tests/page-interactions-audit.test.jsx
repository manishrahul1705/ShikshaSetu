import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SortableTable } from '../src/components/ui/PageKit.jsx';
import Notifications from '../src/pages/notifications/Notifications.jsx';
import Workload from '../src/additions/n89-workload/Workload.jsx';
import EmailDrafts from '../src/pages/channels/EmailDrafts.jsx';
import { I18nProvider } from '../src/i18n/index.js';
vi.mock('../src/context/AuthContext.jsx', () => ({useAuth:()=>({user:{id:'interaction-student',role:'student'}})}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function mount(element, data) {
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>data})));
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
 return render(<QueryClientProvider client={client}><I18nProvider><MemoryRouter>{element}</MemoryRouter></I18nProvider></QueryClientProvider>);
}
it('report tables filter, sort numeric values, paginate and recover from empty results',()=>{
 mount(<SortableTable rows={[{id:'a',name:'Alpha',count:20},{id:'b',name:'Beta',count:3},{id:'c',name:'Gamma',count:11}]} columns={[{key:'name',label:'Institution'},{key:'count',label:'Cases'}]} label="Find institution" pageSize={2}/>);
 expect(screen.queryByText('Gamma')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Next'}));expect(screen.getByText('Gamma')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/Cases/}));
 expect(screen.getAllByRole('row')[1]).toHaveTextContent('Beta');
 expect(screen.getByRole('columnheader',{name:/Cases/})).toHaveAttribute('aria-sort','ascending');
 fireEvent.change(screen.getByLabelText('Find institution'),{target:{value:'absent'}});
 expect(screen.getByText('No records match the current filters.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Clear search'}));
 expect(screen.getByText('Beta')).toBeInTheDocument();expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
});
it('notifications combine search and type filters, sort chronologically and preserve destination links',async()=>{
 mount(<Notifications/>,{items:[{kind:'CASE_UPDATE',text:'Case Alpha updated',link:'/track/alpha',at:'2026-10-27T10:00:00Z'},{kind:'REQUEST',text:'Case Beta request',link:'/track/beta',at:'2026-10-28T10:00:00Z'}]});
 await screen.findByText('Case Beta request');
 expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Beta');
 fireEvent.click(screen.getByRole('button',{name:'Newest first'}));expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Alpha');
 fireEvent.change(screen.getByLabelText('Notification type'),{target:{value:'REQUEST'}});
 expect(screen.queryByText('Case Alpha updated')).toBeNull();
 expect(screen.getByRole('link',{name:'Open notification: REQUEST'})).toHaveAttribute('href','/track/beta');
 fireEvent.change(screen.getByLabelText('Search notifications'),{target:{value:'Alpha'}});
 expect(screen.getByText('No notifications match your filters.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));expect(screen.getAllByRole('listitem')).toHaveLength(2);
});
it('email drafts filter by language and status and clear back to the complete list',async()=>{
 mount(<EmailDrafts/>,[{id:'draft-a',status:'PENDING',languageTag:'en',receivedAt:'2026-10-28T10:00:00Z'},{id:'draft-b',status:'CONFIRMED',languageTag:'hi',receivedAt:'2026-10-27T10:00:00Z'}]);
 await screen.findByLabelText('Find a draft');
 fireEvent.change(screen.getByLabelText('Find a draft'),{target:{value:'hi'}});
 expect(screen.getByRole('link',{name:/Open email draft/i})).toHaveAttribute('href','/my/email-drafts/draft-b');
 fireEvent.change(screen.getByLabelText('Draft status'),{target:{value:'PENDING'}});
 expect(screen.getByText('No drafts match your filters.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));expect(screen.getAllByRole('link',{name:/Open email draft/i})).toHaveLength(2);
});

it('workload explains missing bureau scope without making a forbidden API call',()=>{
 mount(<Workload/>,{});
 expect(screen.getByRole('status')).toHaveTextContent('This account has no assigned bureau');
 expect(fetch).not.toHaveBeenCalled();
 expect(screen.getByRole('link',{name:'Open the case queue'})).toHaveAttribute('href','/cases');
});
it('notifications retry a failed request and recover without leaving the page',async()=>{
 mount(<Notifications/>,{items:[]});
 fetch.mockImplementationOnce(async()=>({ok:false,status:503,json:async()=>({error:'Unavailable'})}));
 cleanup();
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
 render(<QueryClientProvider client={client}><MemoryRouter><Notifications/></MemoryRouter></QueryClientProvider>);
 await screen.findByRole('alert');
 fireEvent.click(screen.getByRole('button',{name:'Try again'}));
 expect(await screen.findByText('You are up to date')).toBeInTheDocument();
});
