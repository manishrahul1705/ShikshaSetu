import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import RuleChangeModal from './RuleChangeModal.jsx';
import WhatIfPreviewModal from './WhatIfPreviewModal.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';
import PolicyTable from './PolicyTable.jsx';
import { CodeText } from '../../components/ui/PageKit.jsx';
import RuleComparison from './RuleComparison.jsx';
import { policyDescription } from '../../additions/n108-reminders/ruleMetadata.js';

const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString() : 'Not recorded';
const actor = value => typeof value === 'object' && value ? value.username || value._id : value;
const actorId = value => String(value?._id || value?.id || value || '');

export default function RuleBook() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [families, setFamilies] = useState([]), [activeRules, setActiveRules] = useState({});
  const [selectedFamily, setSelectedFamily] = useState('JURISDICTION');
  const [versions, setVersions] = useState([]), [selectedId, setSelectedId] = useState('');
  const [familySearch, setFamilySearch] = useState(''), [versionSearch, setVersionSearch] = useState(''), [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true), [familyLoading, setFamilyLoading] = useState(true);
  const [error, setError] = useState(''), [familyError, setFamilyError] = useState(''), [successMsg, setSuccessMsg] = useState('');
  const [refresh, setRefresh] = useState(0), [busy, setBusy] = useState('');
  const [showChangeModal, setShowChangeModal] = useState(false), [previewVersion, setPreviewVersion] = useState(null);
  const canChange = ['system_admin', 'supervisor', 'competent_authority'].includes(user?.role);
  const canApprove = ['supervisor', 'competent_authority'].includes(user?.role);

  useEffect(() => {
    const controller = new AbortController();
    setFamilyLoading(true); setFamilyError('');
    fetch('/api/v1/rulebook/families', { credentials: 'include', signal: controller.signal })
      .then(async res => { if (!res.ok) throw new Error('Rule families could not be loaded.'); return res.json(); })
      .then(data => { if (!controller.signal.aborted) { setFamilies(data.families || []); setActiveRules(data.activeRules || {}); } })
      .catch(err => { if (!controller.signal.aborted) setFamilyError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setFamilyLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setVersions([]); setError('');
    fetch(`/api/v1/rulebook/versions?family=${encodeURIComponent(selectedFamily)}`, { credentials: 'include', signal: controller.signal })
      .then(async res => { if (!res.ok) throw new Error('Versions could not be loaded. Please try again.'); return res.json(); })
      .then(list => { if (!controller.signal.aborted) setVersions(Array.isArray(list) ? list : []); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selectedFamily, refresh]);

  const metadata = activeRules[selectedFamily];
  const activeVersion = metadata?.version ? versions.find(v => v.version === metadata.version) : metadata?.status === 'POLICY_NOT_CONFIGURED' ? null : [...versions]
    .filter(v => v.status === 'approved' && Date.parse(v.effectiveFrom) <= Date.now())
    .sort((a, b) => Date.parse(b.effectiveFrom) - Date.parse(a.effectiveFrom) || Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const inspected = versions.find(v => v._id === selectedId) || activeVersion || versions[0];
  const visibleFamilies = families.filter(f => f.replaceAll('_', ' ').toLowerCase().includes(familySearch.trim().replaceAll('_', ' ').toLowerCase()));
  const visibleVersions = versions.filter(v => (!status || v.status === status) && `${v.version} ${v.description || ''} ${actor(v.requestedBy) || ''}`.toLowerCase().includes(versionSearch.trim().toLowerCase()));
  const chooseFamily = family => { setSelectedFamily(family); setSelectedId(''); setVersionSearch(''); setStatus(''); setSuccessMsg(''); };

  async function action(version, kind) {
    setBusy(`${kind}:${version._id}`); setError(''); setSuccessMsg('');
    try {
      const res = await fetch(`/api/v1/rulebook/versions/${version._id}/${kind}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || (kind === 'dry-run' && !data.passed)) throw new Error(data.error || 'Dry-run failed. Review the fixture results before approval.');
      setSuccessMsg(kind === 'dry-run' ? `Dry-run PASSED: ${data.totalCases} fixture cases evaluated.` : 'Version approved. Its effective date determines when the policy becomes active.');
      setSelectedId(version._id); setRefresh(value => value + 1);
    } catch (err) { setError(err.message || 'The action could not be completed.'); }
    finally { setBusy(''); }
  }

  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">{t('rulebook.title')}</p><h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">AICTE RuleBook Policy Manager</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">{t('rulebook.subtitle')}</p></div>
        <div className="flex flex-wrap gap-2"><button className="btn-secondary" disabled={loading || familyLoading || !!busy} onClick={() => setRefresh(v => v + 1)}>Refresh rules</button>{canChange && <button className="btn-primary" disabled={loading || !!busy} onClick={() => setShowChangeModal(true)}>+ {t('rulebook.requestChange')}</button>}</div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">{[[familyLoading ? 'Loading...' : familyError ? 'Unavailable' : families.length, 'Policy families'], [loading ? 'Loading...' : error && !versions.length ? 'Unavailable' : versions.length, 'Versions in selected family'], [loading ? 'Loading...' : error && !versions.length ? 'Unavailable' : versions.filter(v => v.status === 'draft' || v.status === 'pending_approval').length, 'Awaiting policy review']].map(([value,label]) => <div key={label} className="rounded-xl border border-orange-100 bg-white/80 p-3"><p className="text-xl font-bold text-orange-900">{value}</p><p className="mt-1 text-xs text-slate-600">{label}</p></div>)}</div>
      <p className="mt-4 text-xs leading-5 text-slate-600">Request a version ? run fixture checks ? preview the impact ? approval by a different authorized reviewer. Existing cases retain their recorded policy versions.</p>
    </header>
    {(error || familyError) && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error || familyError} <button className="ml-2 underline" disabled={!!busy} onClick={() => setRefresh(v => v + 1)}>Try again</button></div>}
    {successMsg && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{successMsg}</p>}
    {!canChange && <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">Read-only access: inspect policies, compare versions and preview their impact.</p>}
    <div className="grid items-start gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="card card-pad space-y-3"><label className="block text-sm font-semibold">Find a policy family<input type="search" className="input mt-2 w-full" value={familySearch} onChange={e => setFamilySearch(e.target.value)} placeholder="Routing, SLA, transfer..." /></label>
        <nav aria-label="Policy families" className="max-h-[32rem] space-y-1 overflow-y-auto">{visibleFamilies.map(fam => <button key={fam} aria-pressed={selectedFamily === fam} disabled={!!busy} onClick={() => chooseFamily(fam)} className={`w-full rounded-xl border px-3 py-3 text-left text-xs font-semibold transition-colors ${selectedFamily === fam ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}><CodeText value={fam}/><span className="mt-1 block text-[10px] font-normal text-slate-500">{activeRules[fam]?.version ? 'Active policy recorded' : familyLoading ? 'Loading status...' : 'No active policy recorded'}</span></button>)}</nav>
        {!familyLoading && !visibleFamilies.length && <p className="text-sm text-slate-500">No policy families match your search.</p>}{familySearch && <button className="text-xs font-semibold text-orange-800 underline" onClick={() => setFamilySearch('')}>Clear family search</button>}
      </aside>
      <div className="min-w-0 space-y-5">
        <section className="card card-pad space-y-4" aria-label="Version registry"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold"><CodeText value={selectedFamily}/> versions</h2><span className="text-xs text-slate-500">{visibleVersions.length} of {versions.length} versions</span></div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]"><label className="text-xs font-semibold">Find a version<input type="search" className="input mt-1 w-full" value={versionSearch} onChange={e => setVersionSearch(e.target.value)} placeholder="Identifier, description or requester"/></label><label className="text-xs font-semibold">Version status<select className="input mt-1 w-full" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['draft','pending_approval','approved','deprecated'].map(s => <option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label></div>
          {(versionSearch || status) && <button className="text-xs font-semibold text-orange-800 underline" onClick={() => {setVersionSearch('');setStatus('');}}>Clear version filters</button>}
          {loading ? <p role="status">Loading versions...</p> : !visibleVersions.length ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">{versions.length ? 'No versions match your filters.' : 'No versions recorded for this policy family.'}</p> : <div className="grid gap-3 md:grid-cols-2">{visibleVersions.map(ver => <button key={ver._id} aria-label={`Inspect ${ver.version}`} aria-pressed={inspected?._id === ver._id} onClick={() => setSelectedId(ver._id)} className={`min-w-0 rounded-xl border p-4 text-left transition-shadow hover:shadow-md ${inspected?._id === ver._id ? 'border-orange-400 bg-orange-50/50 ring-1 ring-orange-200' : 'border-slate-200 bg-white'}`}><span className="flex flex-wrap items-start justify-between gap-2"><span className="font-semibold"><RuleVersion value={ver.version}/></span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase">{activeVersion?._id === ver._id ? 'Active' : ver.status === 'approved' && Date.parse(ver.effectiveFrom) > Date.now() ? 'Scheduled' : ver.status.replaceAll('_',' ')}</span></span><span className="mt-2 block break-all font-mono text-[10px] text-slate-500"><RuleVersion value={ver.version} audit /></span><span className="mt-2 block text-xs text-slate-600">{policyDescription(ver.description) || 'No description recorded.'}</span><span className="mt-3 block text-[11px] text-slate-500">Effective {date(ver.effectiveFrom)} ? {ver.dryRunPassed ? 'Dry-run passed' : 'Dry-run not passed'}</span></button>)}</div>}
        </section>
        {!loading && inspected && <section className="card card-pad space-y-5" aria-label="Policy inspector"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4"><div><p className="eyebrow">{activeVersion?._id === inspected._id ? 'Active configuration' : 'Inspecting version'}</p><h2 className="mt-1 text-xl font-bold"><RuleVersion value={inspected.version}/></h2><p className="mt-1 break-all font-mono text-xs text-slate-500"><RuleVersion value={inspected.version} audit /></p></div><button className="btn-secondary" onClick={() => setPreviewVersion(inspected)}>What-If Preview</button></div>
          {inspected.status === 'approved' && activeVersion?._id !== inspected._id && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">This version is approved but is not the currently active policy. Effective {date(inspected.effectiveFrom)}.</p>}
          <PolicyTable key={inspected._id} version={inspected}/>
          <details className="rounded-xl border border-slate-200 p-4 text-sm"><summary className="cursor-pointer font-semibold">Policy provenance and review details</summary><dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">{[['Requested by',actor(inspected.requestedBy) || 'Not recorded'],['Approved by',actor(inspected.approvedBy) || 'Not yet approved'],['Created',date(inspected.createdAt)],['Effective from',date(inspected.effectiveFrom)],['Dry-run',inspected.dryRunPassed ? 'Passed' : 'Not passed'],['Status',inspected.status.replaceAll('_',' ')]].map(([key,value]) => <div key={key}><dt className="text-slate-500">{key}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl></details>
          {canChange && ['draft', 'pending_approval'].includes(inspected.status) && <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/50 p-4"><h3 className="text-sm font-bold">Review this draft</h3><div className="flex flex-wrap gap-2"><button className="btn-secondary" disabled={!!busy} onClick={() => action(inspected,'dry-run')}>{busy.startsWith('dry-run:') ? 'Running checks...' : 'Run Dry-Run'}</button>{canApprove && <button className="btn-primary" disabled={!!busy || !inspected.dryRunPassed || actorId(inspected.requestedBy) === actorId(user?.id || user?._id)} onClick={() => action(inspected,'approve')}>{busy.startsWith('approve:') ? 'Approving...' : 'Approve'}</button>}</div><p className="text-xs text-slate-600">{!inspected.dryRunPassed ? 'A successful fixture dry-run is required before approval.' : !canApprove ? 'A supervisor or competent authority must approve this version.' : actorId(inspected.requestedBy) === actorId(user?.id || user?._id) ? 'You requested this version. A different authorized reviewer must approve it.' : 'Approval keeps the recorded effective date and does not change earlier cases.'}</p></div>}
          <RuleComparison key={`${selectedFamily}:${inspected._id}`} version={inspected} versions={versions} activeVersion={activeVersion}/>
        </section>}
        {!loading && !activeVersion && !error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">No approved version is currently active for this policy family. Missing policy remains unavailable.</p>}
      </div>
    </div>
    {showChangeModal && <RuleChangeModal family={selectedFamily} initialBody={inspected?.body} onClose={() => setShowChangeModal(false)} onCreated={() => {setShowChangeModal(false);setSuccessMsg('Draft created. Inspect its parameters and run fixture checks before approval.');setRefresh(v => v + 1);}}/>}
    {previewVersion && <WhatIfPreviewModal version={previewVersion} onClose={() => setPreviewVersion(null)}/>}
  </div>;
}
