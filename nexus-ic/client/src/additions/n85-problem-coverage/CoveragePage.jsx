import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useS5 } from '../../pages/closure/api.jsx';

import phaseRoutes from '../../routes/index.jsx';
import { evidenceIds as evidence } from './evidence.js';

function Evidence({ features, route, roles, testIds, tests, state, reason, viewerRole }) {
  const declared = phaseRoutes.find(entry => entry.path === route); const screenRoles = declared?.roles || []; const allowed = !!declared && (declared.public || !declared.roles || screenRoles.includes(viewerRole));
  return <><td className="p-3">{features?.join(', ') || '—'}</td><td className="p-3">{allowed ? <Link className="font-semibold text-saffron-800 underline focus-visible:outline focus-visible:outline-2" to={route}>Open screen</Link> : <span className="text-slate-500" title={`Available to: ${screenRoles.join(', ')}`}>Open screen · role access required</span>}</td>
    <td className="p-3">{testIds?.length ? testIds.map((id) => <span key={id} className="mr-2 inline-block">{id}: {tests?.[id] || 'Not run in latest merged results'}</span>) : '—'}</td>
    <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${state === 'Planned' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-900'}`}>{state || 'Evidence pending'}</span>{reason && <p className="mt-1 text-xs text-slate-500">{reason}</p>}</td></>;
}

function Table({ title, rows, kind, tests, viewerRole }) {
  return <section className="card overflow-hidden"><div className="border-b border-slate-100 p-4"><h2 className="card-title">{title}</h2></div><div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">{kind}</th><th className="p-3">Feature</th><th className="p-3">Open screen</th><th className="p-3">Proof</th><th className="p-3">State</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{rows.map((row, i) => <tr key={i}><th className="p-3 font-medium text-slate-800">{row.need || row[1] || row[0]}</th><Evidence features={row.features || row[3]} route={row.route || row[2]} roles={row.roles || row[4]} testIds={row.testIds || []} tests={tests} state={row.state} reason={row.reason} viewerRole={viewerRole} /></tr>)}</tbody>
    </table></div></section>;
}

export default function CoveragePage() {
  const { user } = useAuth();
  const q = useS5('/ps-coverage');
  if (q.isLoading) return <p>Loading coverage...</p>;
  if (q.error) return <p role="alert">Coverage is currently unavailable.</p>;
  const data = q.data;
  const status = features => evidence(features).every(id => data.tests?.[id] === 'passed') ? 'Tests passed' : 'Evidence pending';
  const workflow = data.workflow.map(([step, title, route, features]) => ({ need: `Step ${step}: ${title}`, route, features, testIds: evidence(features), state: status(features) }));
  const roles = data.roles.map(([role, action, route, features]) => ({ need: `${role}: ${action}`, route, features, testIds: evidence(features), state: status(features) }));
  return <div className="mx-auto max-w-7xl space-y-6">
    <header><p className="text-xs font-bold uppercase tracking-[.16em] text-saffron-700">Jury audit · PS 26264</p><h1 className="mt-1 text-3xl font-extrabold text-ink-950">Problem-statement coverage</h1><p className="mt-2 max-w-3xl text-slate-600">Trace each need, workflow step and role action to a screen and its latest recorded test result.</p></header>
    <Table title="Problem-statement needs" rows={data.problemNeeds} kind="Need" tests={data.tests} viewerRole={user?.role} />
    <Table title="Workflow steps 1–13" rows={workflow} kind="Workflow" tests={data.tests} viewerRole={user?.role} />
    <Table title="Role actions" rows={roles} kind="Role action" tests={data.tests} viewerRole={user?.role} />
  </div>;
}
