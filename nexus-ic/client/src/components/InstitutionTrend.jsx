import React from 'react';
import { useI18n } from '../i18n/index.js';

export function institutionMonths(rows, now = new Date()) {
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
    return { month: date.toISOString().slice(0, 7), count: 0 };
  });
  for (const row of rows) {
    if (!row.createdAt || !Number.isFinite(new Date(row.createdAt).getTime())) continue;
    const month = months.find(entry => entry.month === new Date(row.createdAt).toISOString().slice(0, 7));
    if (month) month.count++;
  }
  return months;
}
export default function InstitutionTrend({ grievances }) {
  const { lang, t } = useI18n();
  const hi = lang === 'hi';
  if (!Array.isArray(grievances?.visible)) return <p>UNKNOWN — {t("polish.case records unavailable")}</p>;
  const months = institutionMonths(grievances.visible), max = Math.max(1, ...months.map(row => row.count));
  const missing = grievances.visible.filter(row => !row.createdAt || !Number.isFinite(new Date(row.createdAt).getTime())).length;
  return <figure className="rounded-xl border border-slate-200 p-4">
    <figcaption className="text-sm font-semibold">{t("polish.Recorded cases over 12 months")}</figcaption>
    <svg role="img" aria-label={t("polish.Monthly case trend")} viewBox="0 0 360 90" className="h-24 w-full">
      <polyline fill="none" stroke="#1e3a8a" strokeWidth="3" points={months.map((row, index) => `${10 + index * 30},${80 - row.count / max * 65}`).join(' ')} />
      {months.map((row, index) => <circle key={row.month} cx={10 + index * 30} cy={80 - row.count / max * 65} r="3" fill="#ea580c"><title>{row.month}: {row.count}</title></circle>)}
    </svg>
    <p className="text-xs text-slate-500">{t("polish.Scope: case metadata returned for this view; restricted records are excluded.")} {grievances.restrictedCount || 0} {t("polish.restricted")}.</p>
    {missing > 0 && <p>UNKNOWN — {missing} {t("polish.case dates unavailable")}</p>}
    <details className="text-xs"><summary>{t("polish.Monthly counts")}</summary><ul>{months.map(row => <li key={row.month}>{row.month}: {row.count}</li>)}</ul></details>
  </figure>;
}
