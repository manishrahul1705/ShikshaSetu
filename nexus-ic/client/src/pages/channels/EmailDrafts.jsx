import React from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../../context/AuthContext.jsx';
import {useI18n} from '../../i18n/index.js';
import {request} from './api.js';
import {PageHeader, StatusChip, EmptyState} from '../../components/ui/PageKit.jsx';
export default function EmailDrafts() {
 const {user}=useAuth(),{t}=useI18n();
 const query=useQuery({queryKey:['s6a-email-list',user?.id],queryFn:()=>request('/channels/email'),gcTime:0,retry:false});
 return <main className="max-w-3xl mx-auto space-y-6"><PageHeader eyebrow="EMAIL INTAKE" title={t('s6aMyEmailDrafts')} purpose={t('s6aEmailNote')} />
 {query.isPending && <p>{t('s6aLoading')}</p>}{query.error && <p role="alert">{query.error.message}</p>}
 {query.data?.length===0 && <EmptyState icon="inbox" title={t('s6aNoDrafts')} text="Confirmed cases remain available in your case tracker." to="/track" action="Track my cases" />}
 {query.data?.map(row=><article className="card card-pad space-y-3" key={row.id}><p><StatusChip value={row.status} /> · Email · {row.languageTag}</p><time className="block text-xs text-ink-500">{new Date(row.receivedAt).toLocaleString()}</time><Link className="btn-primary" to={`/my/email-drafts/${row.id}`}>{t('s6aOpenDraft')}</Link></article>)}
 </main>;
}
