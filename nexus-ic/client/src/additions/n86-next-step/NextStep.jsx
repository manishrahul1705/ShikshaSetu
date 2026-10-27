import React, { useState } from 'react';
import { useI18n } from '../../i18n/index.js';
import { s5Request } from '../../pages/closure/api.jsx';
export default function NextStep({ data, onReply }) {
  const { t } = useI18n(); const [active, setActive] = useState(null), [text, setText] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function reply(e, id) { e.preventDefault(); setBusy(true); setError(''); try { await s5Request(`/queries/${id}/respond`, { method: 'POST', body: { responseText: text } }); setText(''); setActive(null); await onReply?.(); } catch { setError(t('ps.replyError')); } finally { setBusy(false); } }
  return <section className="rounded-xl bg-ink-50 p-4 space-y-3"><h2 className="card-title">{t('ps.next')}</h2><p>{t(`ps.next.${data.nextStepKey || 'office'}`)}</p>
    <p className="text-sm">{t('ps.owner')}: {data.accountableOwner?.office} · {data.accountableOwner?.role?.replaceAll('_', ' ')}</p>
    <p className="text-sm">{t('ps.clock')}: {data.policyClock?.unavailable || !data.policyClock ? t('ps.noPolicy') : `${Math.abs(data.policyClock.remainingDays)} ${t(data.policyClock.remainingDays < 0 ? 'ps.overdueDays' : 'ps.daysLeft')}`}</p>
    {data.queries?.length > 0 && <h3 className="font-semibold">{t('ps.inbox')}</h3>}
    {data.queries?.map(q => <article key={q.id} className="rounded-lg bg-white border p-3 space-y-2"><p className="text-xs text-slate-500">{q.office} · {new Date(q.queriedAt).toLocaleDateString()}</p><p>{q.text}</p><p className="text-xs">{t('ps.replyBy')}: {q.replyBy ? new Date(q.replyBy).toLocaleDateString() : t('ps.noPolicy')}</p>{q.responseText && <p>{q.responseText}</p>}{q.status === 'PENDING' && (active === q.id ? <form onSubmit={e => reply(e, q.id)}><label>{t('ps.reply')}<textarea className="w-full block" required value={text} onChange={e => setText(e.target.value)} /></label><button className="btn-primary mt-2" disabled={busy}>{t('ps.send')}</button></form> : <button className="btn-ghost" onClick={() => setActive(q.id)}>{t('ps.reply')}</button>)}</article>)}
    {error && <p role="alert">{error}</p>}
  </section>;
}
