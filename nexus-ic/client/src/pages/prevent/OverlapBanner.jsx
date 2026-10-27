import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import { OFFICERS, usePreventQuery } from './api.jsx';
export default function OverlapBanner({ institutionPid }) {
  const { user } = useAuth(), { t } = useI18n(), params = useParams();
  const allowed = OFFICERS.includes(user?.role);
  const pid = institutionPid || params.id;
  const query = usePreventQuery('/prevent/overlaps' + (pid ? `?institutionPid=${encodeURIComponent(pid)}` : ''), allowed);
  if (!allowed) return null;
  if (query.error || query.data?.result === 'UNKNOWN') return <aside role="status">UNKNOWN — {t('s4Unavailable')}</aside>;
  if (!query.data || (!query.data.pairs.length && !query.data.restrictedCount)) return null;
  return <aside className="bg-amber-50 border border-amber-300 p-4 rounded space-y-2" role="status"><h2 className="font-bold">Potential Overlapping Cases – Coordination Required</h2>
    <p>{t('s4Advisory')}</p><nav>{[...new Set(query.data.pairs.flatMap(pair => pair.cases))].map(id => <Link className="underline mr-3" key={id} to={`/cases/${id}`}>{id}</Link>)}</nav>
    {!!query.data.restrictedCount && <p>{query.data.restrictedCount} restricted entries</p>}<Link className="underline" to="/review">{t('s4Review')}</Link>
  </aside>;
}
