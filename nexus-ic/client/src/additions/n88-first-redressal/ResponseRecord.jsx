import React from 'react';
import { useS5 } from '../../pages/closure/api.jsx';
export default function ResponseRecord({pid}) {
  const q=useS5(`/institution-response-record?pid=${encodeURIComponent(pid || '')}`);
  const combined=useS5(`/combined-requests/counts?pid=${encodeURIComponent(pid || '')}`,!!pid);
  if(!q.data?.queriesOnTime || !q.data?.combinedAnswered)return <p>Response record is {q.isLoading?'loading':'not available'}.</p>;
  const r=q.data;
  return <section className="card card-pad space-y-3"><h2 className="card-title">Response record</h2><p className="text-xs text-slate-500">{r.scope}</p><p>AICTE queries answered on time: {r.queriesOnTime.unavailable?'Not available: policy not configured':`${r.queriesOnTime.numerator} of ${r.queriesOnTime.denominator} dated items`}</p><p>Combined request items answered: {r.combinedAnswered.numerator} of {r.combinedAnswered.denominator}</p><p>Documents in locker: {r.documentsInLocker} versions</p>{combined.data && <p>Requests combined: {combined.data.numerator} of {combined.data.denominator} eligible query items</p>}</section>;
}
