import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../../context/AuthContext.jsx';
import {useI18n} from '../../i18n/index.js';
import {request} from './api.js';
import {PageHeader, StatusChip, EmptyState} from '../../components/ui/PageKit.jsx';
export default function EmailDrafts() {
 const {user}=useAuth(),{t}=useI18n();
 const [search,setSearch]=useState(''),[status,setStatus]=useState('');
 const query=useQuery({queryKey:['s6a-email-list',user?.id],queryFn:()=>request('/channels/email'),gcTime:0,retry:false});
 const rows=query.data || [];
 const statuses=[...new Set(rows.map(row=>row.status))].sort();
 const filtered=rows.filter(row=>(!status || row.status===status) && `${row.id} ${row.status} ${row.languageTag}`.toLowerCase().includes(search.trim().toLowerCase()));
 return <main className="max-w-3xl mx-auto space-y-6"><PageHeader eyebrow="EMAIL INTAKE" title={t('s6aMyEmailDrafts')} purpose={t('s6aEmailNote')} />
 {query.isPending && <p>{t('s6aLoading')}</p>}{query.error && <p role="alert">{query.error.message} <button className="btn-secondary" onClick={()=>query.refetch()}>Try again</button></p>}
 {query.data && rows.length>0 && <section className="card card-pad border-t-4 border-t-orange-400 space-y-3"><div className="grid sm:grid-cols-2 gap-3"><label>Find a draft<input className="input w-full mt-1" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Draft ID, language or status" /></label><label>Draft status<select className="input w-full mt-1" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label></div><p role="status" className="text-sm">{filtered.length} of {rows.length} drafts {(search || status) && <button className="underline text-orange-800 ml-3" onClick={()=>{setSearch('');setStatus('');}}>Clear filters</button>}</p></section>}
 {rows.length>0 && filtered.length===0 && <p role="status">No drafts match your filters.</p>}
 {query.data?.length===0 && <EmptyState icon="inbox" title={t('s6aNoDrafts')} text="Confirmed cases remain available in your case tracker." to="/track" action="Track my cases" />}
 {filtered.map(row=><article className="card card-pad space-y-3" key={row.id}><p><StatusChip value={row.status} /> · Email · {row.languageTag}</p><time className="block text-xs text-ink-500">{new Date(row.receivedAt).toLocaleString()}</time><Link className="btn-primary" to={`/my/email-drafts/${row.id}`}>{t('s6aOpenDraft')}</Link></article>)}
 </main>;
}
