import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useText, Frame, Button, StateNote } from './TrustUI.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
export default function OtpInbox() {
  const ui = useText(), { t } = ui;
  const { user } = useAuth();
  const mode = useQuery({ queryKey: ['s1a', 'mode'], queryFn: () => api('/config/mode'), retry: false });
  const inbox = useQuery({ queryKey: ['s1a', user?.id, 'otp-inbox'], queryFn: () => api('/dev/otp-inbox'), enabled: mode.data?.mode === 'demo', retry: false, gcTime: 0, staleTime: 0 });
  return <Frame ui={ui} title="inbox">{mode.data?.mode !== 'demo' ? <p>{t('demoOnly')}</p> : <><StateNote query={inbox} t={t} /><Button onClick={() => inbox.refetch()}>{t('refresh')}</Button>{inbox.data?.entries.length === 0 && <p>{t('emptyInbox')}</p>}{inbox.data?.entries.map((row) => <article className="bg-white border rounded p-6" key={row.expiresAt}><p className="text-3xl font-mono">{row.otp}</p><p>{t('expiresAt')}: {new Date(row.expiresAt).toLocaleString()}</p></article>)}</>}</Frame>;
}
