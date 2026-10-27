import React from 'react';
import { useI18n } from '../../i18n/index.js';
import { usePreventQuery } from './api.jsx';
export default function AlertList() {
  const {t}=useI18n(), query=usePreventQuery('/prevent/alerts');
  return <section className="border rounded p-4"><h2 className="font-bold">{t('s4Alerts')}</h2><p>{t('s4Polling')}</p>
    {query.error && <p>UNKNOWN — {t('s4Unavailable')}</p>}{query.data?.map(row=><article className="border-t py-2" key={row.id}><p>{row.caseId} — {row.result}</p>{row.reasons.map(reason=><p key={reason}>{t(`s4_${reason}`)}</p>)}</article>)}
  </section>;
}
