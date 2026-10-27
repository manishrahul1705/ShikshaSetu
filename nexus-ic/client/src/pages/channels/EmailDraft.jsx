import React from 'react';
import {Link,useParams} from 'react-router-dom';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../../context/AuthContext.jsx';
import {useI18n} from '../../i18n/index.js';
import QuickExitButton from '../../components/QuickExitButton.jsx';
import {request} from './api.js';
import GrievanceSubmit from '../intake/GrievanceSubmit.jsx';
import {StatusChip} from '../../components/ui/PageKit.jsx';
export default function EmailDraft() {
 const {id}=useParams(),{user}=useAuth();return <EmailDraftBody key={`${user?.id}:${id}`}/>;
}
function EmailDraftBody() {
 const {id}=useParams(),{user}=useAuth(),{t}=useI18n(),cache=useQueryClient();
 const key=['s6a-email',user?.id,id];
 const query=useQuery({queryKey:key,queryFn:()=>request(`/channels/email/${id}`),gcTime:0,retry:false});
 // The email draft runs through the same S1b form, preview and PREVENT panel; it confirms through the EMAIL service, never /grievances.
 const token=React.useRef(null);
 const onPreview=async payload=>{token.current=(await request(`/channels/email/${id}/preview`,payload)).previewToken;};
 const onConfirm=()=>request(`/channels/email/${id}/confirm`,{previewToken:token.current});
 return <main className="max-w-3xl mx-auto p-6 space-y-4"><h1>{t('s6aOpenDraft')}</h1><QuickExitButton onExit={()=>cache.removeQueries({queryKey:key})}/>
 <p>{t('s6aAttachmentsDropped')}</p>
 {query.isPending && <p>{t('s6aLoading')}</p>}{query.error && <p role="alert">{query.error.message}</p>}
 {query.data && <><StatusChip value={query.data.status} /><GrievanceSubmit initialDraft={query.data.draft} onPreview={onPreview} onConfirm={onConfirm} allowUploads={false}/></>}
 <Link to="/my/email-drafts">{t('s6aMyEmailDrafts')}</Link></main>;
}
