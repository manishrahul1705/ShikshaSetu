import React, {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../../context/AuthContext.jsx';
import {useI18n} from '../../i18n/index.js';
import {request} from './api.js';
import {PageHeader,CodeText} from '../../components/ui/PageKit.jsx';
export default function AdminImport() {
 const {user}=useAuth(),{t}=useI18n(),[csv,setCsv]=useState(''),[result,setResult]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const review=useQuery({queryKey:['s6a-import-review',user?.id],queryFn:()=>request('/channels/import/review'),retry:false,gcTime:0});
 async function perform(work){setBusy(true);setError('');try{setResult(await work());await review.refetch();}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <main className="max-w-5xl mx-auto min-w-0 space-y-6"><PageHeader eyebrow="REVIEW BEFORE IMPORT" title={t('s6aImport')} purpose={t('s6aCsvNote')} />
 <div className="card card-pad max-w-full overflow-x-auto"><code className="whitespace-nowrap text-xs">reporterId,institutionPid,institutionIcid,category,subCategory,narrative,sourceSystem,sourceRef</code></div>
 <p>{t('s6aReporterNote')}</p><label className="block">CSV<input type="file" accept=".csv,text/csv" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];if(file){setCsv(await file.text());setResult(null);}}}/></label>
 <textarea aria-label="CSV" className="border w-full min-h-32" value={csv} onChange={e=>{setCsv(e.target.value);setResult(null);}}/>
 <button disabled={busy} onClick={()=>perform(()=>request('/channels/import/preview',{csv}))}>{t('s6aPreview')}</button>
 {result && <section className="space-y-3"><p role="status"><CodeText value={result.state} /></p>
 <div className="card overflow-x-auto"><table><thead><tr>{['Row','Reporter','PID','ICID','Source reference','Outcome'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{result.rows?.map(row=><tr key={row.row}><td>{row.row}</td><td>{row.reporterId}</td><td>{row.institutionPid}</td><td>{row.institutionIcid}</td><td>{row.sourceSystem}: {row.sourceRef}</td><td><CodeText value={row.status} /></td></tr>)}</tbody></table></div>
 {result.quarantined?.length>0 && <p role="alert">{t('s6aQuarantine')}</p>}
 <button disabled={busy} onClick={()=>perform(()=>request(`/channels/import/${result.id}/dry-run`,{}))}>{t('s6aDryRun')}</button>
 {['DRY_RUN','COMMITTED'].includes(result.state) && <button disabled={busy} onClick={()=>perform(()=>request(`/channels/import/${result.id}/commit`,{}))}>{t('s6aCommitValid')}</button>}
 {result.ready!==undefined && <p>{t('s6aReady')}: {result.ready}; {t('s6aDuplicates')}: {result.duplicates}</p>}
 {result.created!==undefined && <p>{t('s6aCreated')}: {result.created}; {t('s6aSkipped')}: {result.skipped}; <CodeText value="IDENTITY_REVIEW" />: {result.quarantined.length}</p>}
 </section>}
 {error && <p role="alert">{error}</p>}<section><h2>{t('s6aDataHealth')}</h2>{review.error && <p role="alert">UNKNOWN — {review.error.message}</p>}{review.data?.map(row=><p key={`${row.batchId}:${row.row}`}>{row.batchId} / {row.row}: {row.institutionPid} / {row.institutionIcid} — {row.reason}</p>)}</section>
 </main>;
}
