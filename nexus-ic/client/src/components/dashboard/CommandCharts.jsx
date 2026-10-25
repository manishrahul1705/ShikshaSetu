import PolishText from '../PolishText.jsx';
import AdditionalCards from '../../additions/n105-dashboard-tiles/AdditionalCards.jsx';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import Icon from '../ui/Icon.jsx';
import { ruleLabel } from '../RuleVersion.jsx';
import { CodeText, codeLabel } from '../ui/PageKit.jsx';

// Command-centre charts built only from /impact/summary. A tile the server
// marks UNKNOWN stays UNKNOWN with its reason; nothing is drawn as zero.
const INK = '#1d2b55';
const SAFFRON = '#ff7d10';
const GREEN = '#22a046';
const SLATE = '#cbd4ea';
const SHORT = { 'Public Grievance Redressal Cell': 'PGRC', 'Regulation Bureau': 'RB', 'Academic Bureau': 'AB', 'Approval Process Bureau': 'APB', 'Approval Bureau': 'APB', 'Skill Education Bureau': 'SEB', 'Training and Learning': 'TL', 'Regional Offices': 'RO' };
const drill = (rowId) => `/impact/cases?row=${encodeURIComponent(rowId)}`;

function Unknown({ reason }) {
  return <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Not available: <CodeText value={reason || 'NO_DATA'} /></p>;
}

export function StatCard({ icon, label, value, sub, tone = 'ink', to, unknown }) {
  unknown = unknown || value === null || value === undefined;
  const tones = {
    ink: 'bg-ink-50 text-ink-700', saffron: 'bg-saffron-50 text-saffron-700', green: 'bg-bharat-50 text-bharat-700', red: 'bg-red-50 text-red-700',
  };
  const body = (
    <div className="card card-pad h-full transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500"><PolishText>{label}</PolishText></p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}><Icon name={icon} className="h-[18px] w-[18px]" /></span>
      </div>
      <p className={`mt-2 font-display font-extrabold text-ink-950 ${unknown || value === 0 ? 'text-xl' : 'text-3xl'}`}>{unknown ? 'Not available' : value === 0 ? 'None recorded' : value}</p>
      {sub && <p className="mt-1 text-[11px] leading-snug text-slate-500">{sub}</p>}
    </div>
  );
  return to ? <Link to={to} className="block no-underline">{body}</Link> : body;
}

function share(s) {
  if (!s) return null;
  if (s.value === null || s.value === undefined) return `Not available: ${codeLabel(s.reason || 'NO_DENOMINATOR')}, ${s.numerator}/${s.denominator}`;
  return `${s.value}% · ${s.numerator} of ${s.denominator} · ${s.scope}`;
}

export function KpiRow({ report }) {
  const t = report?.tiles;
  const extra = report?.psAlignmentTiles;
  if (!t) return <Unknown reason="REPORT_SUMMARY_NOT_RETURNED" />;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard icon="inbox" label="Total complaints" value={t.totalComplaints?.count} sub={t.totalComplaints?.scope} to={drill('tile:totalComplaints')} />
      <StatCard icon="clock" tone="saffron" label="Pending" value={t.pendingCases?.count} sub={share(t.pendingCases?.share)} to={drill('tile:pendingCases')} />
      <StatCard icon="check" tone="green" label="Disposed" value={t.disposedCases?.count} sub={share(t.disposedCases?.share)} to={drill('tile:disposedCases')} />
      <StatCard icon="alert" tone="red" label="Overdue" value={t.overdueCases?.count} unknown={t.overdueCases?.share?.result === 'UNKNOWN' && !t.overdueCases?.count}
        sub={t.overdueCases?.share?.result === 'UNKNOWN' ? `Not available: ${codeLabel(t.overdueCases.share.reason)}; ${t.overdueCases.openWithoutClock ?? 0} open cases have no approved SLA clock` : share(t.overdueCases?.share)} to={drill('tile:overdueCases')} />
      <StatCard icon="shuffle" tone="saffron" label="Transfer delays" value={t.transferDelays?.count} sub={share(t.transferDelays?.share)} to={drill('tile:transferDelays')} />
      <StatCard icon="shield" label="Potential overlaps" value={t.potentialOverlaps?.pairs} sub={`pairs · restricted entries ${t.potentialOverlaps?.restrictedEntries ?? 0} · ${ruleLabel(t.potentialOverlaps?.ruleVersion, 'Matching rule')}`} to="/review" />
      <AdditionalCards tiles={extra} share={share} />
    </div>
  );
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <section className="card card-pad flex min-w-0 flex-col break-words">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="card-title"><PolishText>{title}</PolishText></h3>
          {subtitle && <p className="text-xs text-slate-500"><PolishText>{subtitle}</PolishText></p>}
        </div>
        {action}
      </div>
      <div className="min-h-[220px] flex-1">{children}</div>
    </section>
  );
}

const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 12px 32px -12px rgba(18,28,61,.28)', fontSize: 12 };

export default function CommandCharts({ report }) {
  const t = report?.tiles;
  if (!t) return null;
  const total = t.totalComplaints?.count ?? 0;
  const pending = t.pendingCases?.count ?? 0;
  const disposed = t.disposedCases?.count ?? 0;
  const inProcess = Math.max(0, total - pending - disposed);
  const statusData = [
    { name: 'Pending', value: pending, fill: SAFFRON },
    { name: 'In process', value: inProcess, fill: INK },
    { name: 'Disposed', value: disposed, fill: GREEN },
  ];
  // A bureau can appear under its code and its full name; show it once, by code.
  const bureaus = [...(t.bureauWiseWorkload?.rows || []).reduce((m, r) => {
    const label = SHORT[r.bureau] || r.bureau;
    const cur = m.get(label) || { label, open: 0, disposed: 0, transfersIn: 0 };
    m.set(label, { label, open: cur.open + (r.open || 0), disposed: cur.disposed + (r.disposed || 0), transfersIn: cur.transfersIn + (r.transfersIn || 0) });
    return m;
  }, new Map()).values()];
  const regions = (report.regionWise || []).map((r) => ({ ...r, label: r.region }));
  const trend = (t.trendsAndInsights?.rows || []).map((r) => ({ ...r, label: r.month }));
  const institutions = (t.institutionWiseHistory?.rows || []).slice().sort((a, b) => b.total - a.total).slice(0, 6);
  const maxInst = Math.max(1, ...institutions.map((i) => i.total));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title="Case status" subtitle={report.scope}>
        {total === 0 ? <Unknown reason="NO_CASES_IN_SCOPE" /> : (
          <div className="relative h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none" isAnimationActive={false}>
                  {statusData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-x-0 top-[78px] text-center">
              <p className="font-display text-2xl font-extrabold text-ink-950">{total}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">cases</p>
            </div>
          </div>
        )}
      </ChartCard>

      <ChartCard title="Bureau-wise workload" subtitle="Open and disposed per bureau; transfers in shown on hover" action={<Link to="/impact" className="text-xs font-semibold text-ink-700">IMPACT →</Link>}>
        {bureaus.length === 0 ? <Unknown reason="NO_BUREAU_ROWS" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bureaus} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f4f6fb' }} />
              <Bar dataKey="open" name="Open" stackId="a" fill={INK} radius={[0, 0, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="disposed" name="Disposed" stackId="a" fill={GREEN} radius={[6, 6, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="transfersIn" name="Transfers in" fill={SAFFRON} radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Region-wise cases" subtitle="Six AICTE regions; unmapped institutions stay UNKNOWN">
        {regions.length === 0 ? <Unknown reason="NO_REGION_ROWS" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regions} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="label" width={92} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f4f6fb' }} />
              <Bar dataKey="open" name="Open" stackId="r" fill={INK} isAnimationActive={false} />
              <Bar dataKey="disposed" name="Disposed" stackId="r" fill={GREEN} radius={[0, 6, 6, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Monthly trend" subtitle="Registered against disposed">
        {trend.length === 0 ? <Unknown reason="NO_TREND_ROWS" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={INK} stopOpacity={0.35} /><stop offset="1" stopColor={INK} stopOpacity={0} /></linearGradient>
                <linearGradient id="gDis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GREEN} stopOpacity={0.35} /><stop offset="1" stopColor={GREEN} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="registered" name="Registered" stroke={INK} strokeWidth={2} fill="url(#gReg)" isAnimationActive={false} />
              <Area type="monotone" dataKey="disposed" name="Disposed" stroke={GREEN} strokeWidth={2} fill="url(#gDis)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Institutions with most cases" subtitle="PID with ICID where mapped">
        {institutions.length === 0 ? <Unknown reason="NO_INSTITUTION_ROWS" /> : (
          <ul className="space-y-3">
            {institutions.map((i) => (
              <li key={i.pid}>
                <Link to={`/institutions/${i.pid}`} className="block no-underline">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-ink-950">{i.name && i.name !== 'not available' ? i.name : i.pid}</span>
                    <span className="shrink-0 font-mono text-slate-500">{i.total}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-50">
                      <div className="h-full rounded-full bg-gradient-to-r from-ink-700 to-saffron-500" style={{ width: `${(i.total / maxInst) * 100}%` }} />
                    </div>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">PID {i.pid} · ICID {i.icid || 'not available'}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>

      <ChartCard title="Decision support" subtitle="Each recommendation cites the rows it is based on">
        {(report.recommendations || []).length === 0 ? <p className="text-sm text-slate-500"><PolishText>No recommendations for this scope.</PolishText></p> : (
          <ul className="space-y-3">
            {report.recommendations.map((r) => (
              <li key={r.id} className="rounded-xl border border-saffron-200 bg-saffron-50/60 p-3 text-sm text-ink-950">
                <p className="flex gap-2"><Icon name="sparkle" className="mt-0.5 h-4 w-4 shrink-0 text-saffron-600" />{r.text}</p>
                <p className="mt-1 break-all pl-6 font-mono text-[10px] text-slate-500">{(r.citedRows || []).join(' · ')}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-ink-50 p-2.5"><p className="text-slate-500"><PolishText>Resolution time</PolishText></p><p className="font-semibold text-ink-950">{report.resolutionTime?.result === 'UNKNOWN' ? `UNKNOWN (${report.resolutionTime.reason})` : (report.resolutionTime?.medianDays ?? report.resolutionTime?.value) === 0 ? 'Same day' : report.resolutionTime?.medianDays == null && report.resolutionTime?.value == null ? 'UNKNOWN (not in report)' : `${report.resolutionTime?.medianDays ?? report.resolutionTime?.value} days`}</p></div>
          <div className="rounded-xl bg-ink-50 p-2.5"><p className="text-slate-500"><PolishText>Duplicate actions flagged</PolishText></p><p className="font-semibold text-ink-950">{report.duplicateActions?.flagged === 0 ? 'None recorded' : report.duplicateActions?.flagged ?? 'UNKNOWN (not in report)'}</p></div>
        </div>
      </ChartCard>
    </div>
  );
}
