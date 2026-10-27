import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageKit.jsx';

async function post(path, body) {
  const response = await fetch(`/api/v1/registry/official/${path}`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

/** N98: system admin screen for the official AICTE list (CSV), dry run first. */
export default function OfficialImport() {
  const [file, setFile] = useState(null);
  const [csv, setCsv] = useState('');
  const [listDate, setListDate] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function chooseFile(event) {
    const chosen = event.target.files?.[0];
    setPreview(null); setResult(null); setError('');
    if (!chosen) return;
    if (/\.xlsx?$/i.test(chosen.name)) {
      setFile(null); setCsv('');
      setError('Excel files need a reader package that has not been approved yet. Open the file in Excel and use File → Save As → "CSV UTF-8 (Comma delimited) (*.csv)", then choose the CSV here.');
      return;
    }
    setFile(chosen);
    setCsv(await chosen.text());
  }
  async function runPreview() {
    setBusy(true); setError(''); setResult(null);
    const { ok, status, data } = await post('import/preview', { csv, sourceFileName: file?.name, listDate });
    setBusy(false);
    if (!ok) { setError(status === 403 ? 'Only a system administrator can import the official list.' : 'The preview could not be produced.'); return; }
    setPreview(data);
  }
  async function confirm() {
    setBusy(true); setError('');
    const { ok, data } = await post('import', { csv, sourceFileName: file?.name, listDate, acceptValidRows: true });
    setBusy(false);
    if (!ok) { setError(data.error === 'SOURCE_FILE_AND_LIST_DATE_REQUIRED' ? 'Enter the list’s as-of date before confirming.' : 'Nothing was written. Fix the rejected rows or check the file.'); return; }
    setResult(data); setPreview(null);
  }
  const ready = Boolean(csv && file && /^\d{4}-\d{2}-\d{2}$/.test(listDate));
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader eyebrow="REGISTRY ADMINISTRATION" title="Import the official AICTE list"
        purpose="Load the AICTE (and IIC) institution list you downloaded, check it in a dry run, then confirm. Nothing is fetched from any website." />
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-800">Official list file (CSV)
            <input type="file" accept=".csv,text/csv,.xlsx,.xls" onChange={chooseFile} className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-saffron-500 file:px-3 file:py-2 file:font-semibold file:text-white" />
          </label>
          <label className="block text-sm font-semibold text-slate-800">List as-of date (from the download)
            <input type="date" value={listDate} onChange={event => setListDate(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-saffron-400" />
          </label>
        </div>
        <p className="text-xs text-slate-600">Columns are matched by header name (for example “AICTE Permanent ID”, “Name of the Institute”, “State”, “District”, “City”, “Institution Type”, “Programme”, “IIC ID”). Unknown columns are listed, and missing values are left empty, never guessed.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" disabled={!ready || busy} onClick={runPreview}>{busy && !preview ? 'Checking…' : 'Dry run preview'}</button>
          {preview && <button type="button" className="rounded-lg border border-bharat-600 bg-bharat-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || !preview.rows?.length} onClick={confirm}>Confirm import of {preview.rows?.length || 0} valid rows</button>}
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </section>

      {preview && (
        <section aria-label="Dry run preview" className="rounded-xl border border-saffron-200 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Dry run: nothing has been written yet</h2>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[['New', preview.counts.new, 'text-bharat-700'], ['Updated', preview.counts.updated, 'text-ink-700'], ['Rejected', preview.counts.rejected, 'text-red-700']].map(([label, value, tone]) => (
              <div key={label} className="rounded-lg border border-slate-200 p-3"><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className={`text-2xl font-black ${tone}`}>{value}</dd></div>
            ))}
          </dl>
          <p className="text-xs text-slate-700">Matched columns: {preview.columns?.mapped?.join(', ') || 'none'}.{' '}
            {preview.columns?.unknown?.length ? `Unknown columns (ignored): ${preview.columns.unknown.join(', ')}.` : 'No unknown columns.'}</p>
          {preview.errors?.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-lg border border-red-200">
              <table className="w-full text-left text-xs"><thead className="bg-red-50"><tr><th className="p-2">Row</th><th className="p-2">Reason</th><th className="p-2">Institute name</th></tr></thead>
                <tbody>{preview.errors.slice(0, 200).map(item => <tr key={item.row} className="border-t"><td className="p-2 font-mono">{item.row}</td><td className="p-2">{item.errors.join('; ')}</td><td className="p-2">{item.value?.name || '—'}</td></tr>)}</tbody></table>
            </div>
          )}
        </section>
      )}
      {result && (
        <section aria-label="Import result" className="rounded-xl border border-bharat-200 bg-bharat-50 p-5 text-sm text-bharat-900">
          Imported {result.rows?.length || 0} rows from {result.provenance?.sourceFileName} (list as of {result.provenance?.listDate}). New {result.counts.new}, updated {result.counts.updated}, rejected {result.counts.rejected}. The import is recorded in the audit trail. Search results now show “Official AICTE list as of {result.provenance?.listDate}”.
        </section>
      )}
      <p className="text-xs text-slate-500">Live IIC/AICTE lookup: awaiting official API access. Imported real colleges can be searched and viewed, but demo grievances cannot name them.</p>
    </div>
  );
}
