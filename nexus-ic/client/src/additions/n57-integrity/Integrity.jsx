import React,{useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../../context/AuthContext.jsx';
import {request} from '../../pages/channels/api.js';
import {PageHeader, Metrics, EmptyState} from '../../components/ui/PageKit.jsx';
export default function Integrity() {
 const {user}=useAuth(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[checks,setChecks]=useState({});
 const query=useQuery({queryKey:['s6a-integrity'],queryFn:()=>request('/integrity'),gcTime:0,retry:false});
 const mode=useQuery({queryKey:['s6a-mode'],queryFn:()=>request('/config/mode'),retry:false});
 async function compute(){setBusy(true);setError('');try{await request('/integrity/compute',{});await query.refetch();}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function compare(day){setError('');try{const value=await request(`/integrity/${day}/compare`,{});setChecks(previous=>({...previous,[day]:value}));}catch(e){setError(e.message);}}
 return <main className="mx-auto max-w-6xl space-y-6"><PageHeader eyebrow="AUDIT ASSURANCE" title="Daily integrity fingerprint" purpose="Inspect the published daily roots and independently compare them with the recorded audit chain." />
 <p>An outside proof for the tamper-evident audit log, not a blockchain. Completed UTC days only. Published rows cannot be edited or deleted. Retain hashes independently.</p>
 {user.role==='system_admin' && mode.data?.mode==='demo' && <button className="btn-primary" disabled={busy} onClick={compute}>Compute yesterday</button>}
 {query.data && <><Metrics items={[{label:'Published days',value:query.data.fingerprints.length},{label:'Verified chains',value:query.data.fingerprints.filter(row=>row.chainVerified).length},{label:'Recorded events',value:query.data.fingerprints.reduce((total,row)=>total+row.eventCount,0)}]} /><section className="card card-pad"><h2 className="card-title">30-day chain calendar</h2><p className="mt-2 text-sm text-ink-500">A tick confirms chain verification. Days with no events have no root hash.</p><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-7">{query.data.fingerprints.slice(0,30).map(row=><a key={row.day} href={`#day-${row.day}`} className={`rounded-xl border p-3 text-center text-xs ${row.chainVerified?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-rose-200 bg-rose-50 text-rose-800'}`}><span className="block text-xl" aria-label={row.chainVerified?'Chain verified':'Chain verification failed'}>{row.chainVerified?'✓':'!'}</span>{row.day.slice(5)}<span className="mt-1 block">{row.eventCount} events</span></a>)}</div></section></>}
 {(error || query.error) && <p role="alert">UNKNOWN — {error || query.error.message}</p>}{query.isPending && <p>UNKNOWN — Loading</p>}
 {query.data?.fingerprints.length===0 && <EmptyState icon="lock" title="No published daily fingerprint" text="Completed daily roots will appear here after the integrity job runs." to="/dashboard" action="Return to command centre" />}
 {query.data?.fingerprints.map(row=><article id={`day-${row.day}`} className="card card-pad break-all space-y-2" key={row.day}><h2 className="font-bold">{row.day} UTC</h2><p>Root hash: {row.rootHash || 'NO EVENTS FOR THIS DAY'}</p><p>Event count: {row.eventCount}</p><p className={row.chainVerified?'text-emerald-700':'text-red-700'}>Chain verified: {row.chainVerified?'YES':'NO'}</p><time>{row.computedAt}</time><button className="btn-secondary block" onClick={()=>compare(row.day)}>Recompute and compare</button>
 {checks[row.day] && <p role="status">{checks[row.day].match?'MATCH':'MISMATCH'} — current chain verified: {checks[row.day].chainVerified?'YES':'NO'}</p>}</article>)}
 </main>;
}
