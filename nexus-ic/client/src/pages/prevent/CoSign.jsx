import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import { usePreventQuery, request, OFFICERS } from './api.jsx';
export function CoSign({ caseId }) {
  const {user}=useAuth(), {t}=useI18n(), [error,setError]=useState('');
  const query=usePreventQuery(`/cases/${encodeURIComponent(caseId)}/co-sign`,!!caseId);
  if(!caseId)return null;
  async function sign(){try{await request(`/cases/${encodeURIComponent(caseId)}/co-sign`,{});await query.refetch();}catch{setError(t('s4NotEligible'));}}
  return <div>{OFFICERS.includes(user?.role) && query.data?.count!==undefined && <p>{query.data.count} {t('s4VerifiedCosigners')}</p>}
    {user?.role==='student' && query.data?.eligible && <button className="underline" type="button" disabled={query.data.signed} onClick={sign}>{query.data.signed?t('s4Signed'):t('s4Back')}</button>}{(error||query.error) && <p role="alert">{error||t('s4NotEligible')}</p>}</div>;
}
export default function CoSignPage(){const {t}=useI18n();const [caseId,setId]=useState(''),[chosen,setChosen]=useState('');return <section><h1>{t('s4Back')}</h1><form onSubmit={e=>{e.preventDefault();setChosen(caseId);}}><label>{t('s4CaseId')}<input className="border p-2" value={caseId} onChange={e=>setId(e.target.value)} /></label><button>{t('s4Check')}</button></form><CoSign caseId={chosen}/></section>;}
