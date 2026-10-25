import React, { useEffect, useId, useState } from 'react';
import { useI18n } from '../i18n/index.js';
import InstitutionDetailsCard from './InstitutionDetailsCard.jsx';
import { registryLabel } from './registryLabel.js';

// N97: search starts after two characters; every result names its source.
export const MIN_QUERY_LENGTH = 2;
const sourceLabel = registryLabel;

/** Selection always returns the authoritative PID; searches never create mappings. */
export default function InstitutionPicker({ onSelect, disabled = false, onCaseId = null, showDetails = false }) {
  const { lang, t } = useI18n();
  const hi = lang === 'hi';
  const id = useId();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    setRows([]); setActive(-1); setNoMatch(false);
    if (!open || disabled) return;
    setStatus('');
    if (!query.trim()) return;
    if (query.trim().length < MIN_QUERY_LENGTH) { setStatus('Type at least 2 characters: name, acronym, city, PID or ICID.'); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus(t("polish.Searching…"));
      try {
        const response = await fetch(`/api/v1/institutions/search?q=${encodeURIComponent(query.trim())}`, { credentials: 'include', signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 401 ? 'signin' : 'unavailable');
        const data = await response.json();
        if (controller.signal.aborted) return;
        const found = Array.isArray(data.institutions) ? data.institutions : [];
        setRows(found);
        setNoMatch(!found.length);
        setStatus(found.length ? '' : t("polish.No institutions found"));
      } catch (error) {
        if (!controller.signal.aborted) setStatus(error.message === 'signin' ? 'Sign in to search the institution registry.' : error.message === 'Failed to fetch' ? t("polish.Search unavailable — UNKNOWN") : t("polish.Search unavailable"));
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, open, disabled, hi]);
  const choose = row => {
    if (!row.pid) { setStatus('PID unavailable in source; this record cannot be selected as an institution identity.'); return; }
    setQuery(row.name); setOpen(false); setRows([]); setActive(-1); setNoMatch(false);
    setStatus(`${row.pid} · ${row.icid || (t("polish.ICID not available"))} · ${row.icidCheck}`);
    setSelected(row);
    onSelect(row);
  };
  const listOpen = open && rows.length > 0;
  return <div className="relative space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold">{onCaseId ? (t("polish.Search case ID or institution")) : (t("polish.Find an institution"))}</label>
    <input id={id} data-jury-public="" role="combobox" aria-autocomplete="list" aria-expanded={listOpen} aria-controls={`${id}-results`}
      aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} aria-describedby={`${id}-status`} disabled={disabled}
      placeholder={t("polish.Name, city, state, PID or ICID")} autoComplete="off"
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-400"
      value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      onKeyDown={e => {
        if (e.key === 'Escape') { setOpen(false); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); setOpen(true);
          setActive(index => rows.length ? (index + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length : -1);
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (onCaseId && /^NX-\d{4}-\d{6}$/i.test(query.trim())) { onCaseId(query.trim().toUpperCase()); setOpen(false); return; }
          if (open && rows[active]) choose(rows[active]);
        }
      }} />
    {listOpen && <ul id={`${id}-results`} role="listbox" aria-label="Matching institutions" className="absolute z-40 max-h-80 w-full overflow-auto rounded-lg border border-saffron-200 bg-white shadow-xl">
      {rows.map((row, index) => <li key={row.pid || row.recordKey} id={`${id}-${index}`} role="option" aria-selected={active === index} aria-disabled={!row.pid}
        className={`cursor-pointer border-b p-3 text-xs ${active === index ? 'bg-saffron-50 border-l-4 border-l-saffron-500' : 'hover:bg-saffron-50/60'}`}
        onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(row)}>
        <span className="flex flex-wrap items-start justify-between gap-2">
          <strong className="block text-sm">{row.name}</strong>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${row.source ? 'border-bharat-300 bg-bharat-50 text-bharat-800' : 'border-saffron-200 bg-saffron-50 text-saffron-800'}`}>{sourceLabel(row)}</span>
        </span>
        <span className="block">{[row.city, row.district, row.state, row.region, row.type].filter(Boolean).join(' · ')}</span>
        {row.aliases?.length > 0 && <span className="block text-slate-600">Also known as: {row.aliases.join(', ')}</span>}
        <span className="block font-mono">{row.pid} · {row.icid || (t("polish.ICID not available"))} · {row.icidCheck}</span>
      </li>)}
    </ul>}
    <p role="status" id={`${id}-status`} className="text-xs text-slate-600">{status}</p>
    {noMatch && open && <p className="rounded-lg border border-dashed border-saffron-300 bg-saffron-50 px-3 py-2 text-xs text-saffron-900" data-testid="picker-no-match">
      No match. Try the acronym (initials such as “SECE”), part of the name, the city, the PID (1-XXXXXXXXXX) or the ICID. Real colleges appear only after an admin imports the official AICTE list.
    </p>}
    {showDetails && selected && <InstitutionDetailsCard institution={selected} />}
  </div>;
}
