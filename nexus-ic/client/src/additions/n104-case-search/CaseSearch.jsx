import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useS5 } from '../../pages/closure/api.jsx';
import { PageHeader, SortableTable } from '../../components/ui/PageKit.jsx';
import { ruleLabel } from '../../components/RuleVersion.jsx';
const fields = [['q', 'Institution name'], ['pid', 'AICTE PID'], ['caseId', 'Case ID'], ['bureau', 'Bureau / cell'], ['region', 'Region'], ['category', 'Category'], ['status', 'Status'], ['from', 'From date'], ['to', 'To date']];
export default function CaseSearch() {
  const [params, setParams] = useSearchParams(), [form, setForm] = useState(Object.fromEntries(params)), [exportError, setExportError] = useState('');
  useEffect(() => { setForm(Object.fromEntries(params)); }, [params]);
  const query = useS5('/case-search?' + params);
  const options = useS5('/case-search/options'), bureaus = useS5('/bureaus');
  const choices = { region: options.data?.regions || [], category: options.data?.categories || [], bureau: (Array.isArray(bureaus.data) ? bureaus.data : bureaus.data?.bureaus || []).map(b => b.name), status: options.data?.statuses || [] };
  function search(e) { e.preventDefault(); setParams(Object.fromEntries(Object.entries({ ...form, page: '1' }).filter(([, v]) => v))); }
  async function csv() {
    setExportError('');
    try {
      const response = await fetch('/api/v1/case-search.csv?' + params, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error('CASE_SEARCH_EXPORT_UNAVAILABLE');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'filtered-cases.csv'; a.click(); URL.revokeObjectURL(url);
    } catch { setExportError('The filtered CSV is unavailable.'); }
  }
  return <div className="space-y-4"><PageHeader title="Search cases" purpose="Search the cases permitted by your bureau, region and role." />
    <form onSubmit={search} className="card card-pad grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([key, label]) => <label className="text-sm" key={key}>{label}{choices[key] ? <select className="block w-full rounded border p-2" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}><option value="">All</option>{choices[key].map(v => <option key={v}>{v}</option>)}</select> : <input className="block w-full rounded border p-2" type={['from', 'to'].includes(key) ? 'date' : 'text'} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />}</label>)}<div className="flex flex-wrap gap-2 items-end"><button className="btn-primary">Search</button><button type="button" className="btn-secondary" onClick={() => { setForm({}); setParams({}); }}>Clear</button><button type="button" className="btn-secondary" onClick={csv}>Download CSV</button></div></form>
    {(options.error || bureaus.error) && <p role="status">Some filter reference data is unavailable (UNKNOWN).</p>}
    {exportError && <p role="alert">{exportError}</p>}{query.isLoading ? <p role="status">Searching cases…</p> : query.error ? <p role="alert">Case search unavailable: {query.error.message}</p> : <><p>{query.data?.total} cases in your scope</p><SortableTable label="Search result rows" rows={query.data?.rows || []} columns={[
      { key: 'masterCaseId', label: 'Case ID', render: v => <Link to={`/cases/${v}`}>{v}</Link> }, { key: 'institutionName', label: 'Institution' }, { key: 'region', label: 'Region' }, { key: 'owningBureau', label: 'Bureau' }, { key: 'category', label: 'Category' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Received date', render: v => new Date(v).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) }, { key: 'slaTarget', label: 'SLA target', render: v => v ? new Date(v).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : ruleLabel(null) },
    ]} /><nav aria-label="Case search pages" className="flex gap-3 items-center"><button className="btn-secondary" disabled={(query.data?.page || 1) <= 1} onClick={() => { const p = new URLSearchParams(params); p.set('page', String(query.data.page - 1)); setParams(p); }}>Previous</button><span>Page {query.data?.page || 1}</span><button className="btn-secondary" disabled={(query.data?.page || 1) * (Number(params.get('pageSize')) || 20) >= (query.data?.total || 0)} onClick={() => { const p = new URLSearchParams(params); p.set('page', String(query.data.page + 1)); setParams(p); }}>Next</button></nav></>}
  </div>;
}
