import React, { useEffect, useRef, useState } from 'react';
import { INDIA_STATES } from './maps/indiaStates.js';

/**
 * N94 illustrative local SVG India region map
 * - Zero external dependencies, 100% offline.
 * - Schematic boundaries. Official geographic validation is pending.
 * - 6 AICTE administrative regions delineated.
 * - Supports college pin highlighting and choropleth open-case density.
 * - Interactive region selection and N47 drilldown integration.
 */

export const AICTE_REGIONS = {
  Northern: {
    name: 'Northern Region',
    hq: 'Kanpur / Chandigarh',
    states: ['Jammu & Kashmir', 'Ladakh', 'Himachal Pradesh', 'Punjab', 'Haryana', 'Uttarakhand', 'Uttar Pradesh', 'Delhi', 'Chandigarh'],
    center: { x: 260, y: 155 },
  },
  Western: {
    name: 'Western Region',
    hq: 'Mumbai',
    states: ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa', 'Daman & Diu', 'Dadra & Nagar Haveli'],
    center: { x: 180, y: 360 },
  },
  Central: {
    name: 'Central Region',
    hq: 'Bhopal',
    states: ['Madhya Pradesh', 'Chhattisgarh'],
    center: { x: 265, y: 290 },
  },
  Southern: {
    name: 'Southern Region',
    hq: 'Chennai / Bengaluru',
    states: ['Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Puducherry', 'Lakshadweep'],
    center: { x: 260, y: 510 },
  },
  Eastern: {
    name: 'Eastern Region',
    hq: 'Kolkata',
    states: ['West Bengal', 'Bihar', 'Jharkhand', 'Odisha', 'Andaman & Nicobar'],
    center: { x: 375, y: 325 },
  },
  'North Eastern': {
    name: 'North Eastern Region',
    hq: 'Guwahati',
    states: ['Assam', 'Meghalaya', 'Manipur', 'Mizoram', 'Nagaland', 'Tripura', 'Arunachal Pradesh', 'Sikkim'],
    center: { x: 490, y: 230 },
  },
};

// State to Region lookup
export const STATE_TO_REGION = {
  'Jammu & Kashmir': 'Northern', 'Ladakh': 'Northern', 'Himachal Pradesh': 'Northern',
  'Punjab': 'Northern', 'Haryana': 'Northern', 'Uttarakhand': 'Northern',
  'Uttar Pradesh': 'Northern', 'Delhi': 'Northern', 'Chandigarh': 'Northern',
  'Maharashtra': 'Western', 'Gujarat': 'Western', 'Goa': 'Western',
  'Daman & Diu': 'Western', 'Dadra & Nagar Haveli': 'Western',
  'Madhya Pradesh': 'Central', 'Chhattisgarh': 'Central', 'Rajasthan': 'Western',
  'Tamil Nadu': 'Southern', 'Karnataka': 'Southern', 'Kerala': 'Southern',
  'Andhra Pradesh': 'Southern', 'Telangana': 'Southern', 'Puducherry': 'Southern', 'Lakshadweep': 'Southern',
  'West Bengal': 'Eastern', 'Bihar': 'Eastern', 'Jharkhand': 'Eastern', 'Odisha': 'Eastern', 'Andaman & Nicobar': 'Eastern',
  'Assam': 'North Eastern', 'Meghalaya': 'North Eastern', 'Manipur': 'North Eastern',
  'Mizoram': 'North Eastern', 'Nagaland': 'North Eastern', 'Tripura': 'North Eastern',
  'Arunachal Pradesh': 'North Eastern', 'Sikkim': 'North Eastern',
  'Jammu and Kashmir': 'Northern', 'Andaman and Nicobar Islands': 'Eastern',
  'Dadra and Nagar Haveli and Daman and Diu': 'Western',
};

// City coordinates mapping for college pins
export const CITY_COORDINATES = {
  'pune': { x: 200, y: 405 },
  'mumbai': { x: 185, y: 395 },
  'nagpur': { x: 275, y: 355 },
  'delhi': { x: 245, y: 200 },
  'new delhi': { x: 245, y: 200 },
  'dehradun': { x: 265, y: 175 },
  'kanpur': { x: 300, y: 240 },
  'lucknow': { x: 310, y: 230 },
  'chandigarh': { x: 235, y: 165 },
  'jaipur': { x: 215, y: 235 },
  'bhopal': { x: 250, y: 315 },
  'indore': { x: 230, y: 325 },
  'raipur': { x: 330, y: 355 },
  'bengaluru': { x: 240, y: 515 },
  'bangalore': { x: 240, y: 515 },
  'chennai': { x: 285, y: 520 },
  'hyderabad': { x: 265, y: 435 },
  'kochi': { x: 225, y: 575 },
  'thiruvananthapuram': { x: 235, y: 605 },
  'kolkata': { x: 405, y: 335 },
  'patna': { x: 365, y: 255 },
  'ranchi': { x: 365, y: 305 },
  'bhubaneswar': { x: 375, y: 385 },
  'guwahati': { x: 475, y: 240 },
  'shillong': { x: 475, y: 255 },
  'itanagar': { x: 520, y: 205 },
};

// N100: distinct, accessible region fills from Tailwind tokens; the selected
// region always uses saffron.
export const REGION_FILL_CLASS = {
  Northern: 'fill-sky-200', Western: 'fill-emerald-200', Central: 'fill-indigo-200',
  Southern: 'fill-violet-200', Eastern: 'fill-teal-200', 'North Eastern': 'fill-lime-200',
};
const REGION_SWATCH_CLASS = {
  Northern: 'bg-sky-200', Western: 'bg-emerald-200', Central: 'bg-indigo-200',
  Southern: 'bg-violet-200', Eastern: 'bg-teal-200', 'North Eastern': 'bg-lime-200',
};
export const ILLUSTRATIVE_LABEL = 'Illustrative map, boundaries not official';
const ZOOM_STEPS = [1, 1.5, 2, 3];
const stateAliases = { 'Jammu & Kashmir': 'Jammu and Kashmir', 'Andaman & Nicobar': 'Andaman and Nicobar Islands', 'Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu', 'Dadra & Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu' };
const canonicalState = state => stateAliases[state] || state;
const regionForState = state => STATE_TO_REGION[state] || STATE_TO_REGION[Object.keys(stateAliases).find(key => stateAliases[key] === state)];

export default function IndiaMap({
  selectedRegion = null,
  selectedState = null,
  selectedCity = null,
  institutionName = null,
  institutionPid = null,
  regionCounts = {},
  onSelectRegion = null,
  interactive = true,
  className = '',
  // N100 additions (all optional; existing callers are unaffected)
  explorer = false,
  stateCounts = null,
  coordinates = null,
  onSelectState = null,
  onSelectInstitution = null,
}) {
  const requestSequence = useRef(0);
  const [collegeQuery, setCollegeQuery] = useState('');
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [zoom, setZoom] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [pickedState, setPickedState] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [counts, setCounts] = useState(stateCounts);
  const [stateColleges, setStateColleges] = useState({ state: null, rows: [], status: '' });
  useEffect(() => { setCounts(stateCounts); }, [stateCounts]);
  useEffect(() => {
    if (!explorer || stateCounts) return undefined;
    let live = true;
    fetch('/api/v1/registry/state-counts', { credentials: 'include' })
      .then(response => (response.ok ? response.json() : null))
      .then(data => { if (live && data?.states) setCounts(data.states); })
      .catch(() => {});
    return () => { live = false; };
  }, [explorer, stateCounts]);
  const focusState = pickedState || selectedState;
  const collegesIn = state => {
    const value = counts?.[canonicalState(state)] ?? counts?.[state];
    if (value === undefined || value === null) return null;
    return typeof value === 'number' ? value : (value.fictional || 0) + (value.official || 0) + (value.research || 0);
  };
  const chooseState = async (state, offset = 0, query = '') => {
    const sequence = ++requestSequence.current;
    setPickedState(state);
    onSelectState?.(state, regionForState(state));
    if (!explorer) return;
    setStateColleges(previous => ({ state, rows: offset ? previous.rows : [], status: 'Loading colleges...' }));
    try {
      const response = await fetch(`/api/v1/registry/research/institutions?state=${encodeURIComponent(canonicalState(state))}&offset=${offset}&q=${encodeURIComponent(query)}`, { credentials: 'include' });
      if (!response.ok) throw new Error('UNAVAILABLE');
      const data = response.ok ? await response.json() : null;
      const rows = Array.isArray(data?.institutions) ? data.institutions : [];
      if (sequence !== requestSequence.current) return;
      setStateColleges(previous => ({ state, rows: offset ? [...previous.rows, ...rows] : rows, nextOffset: data?.nextOffset ?? null, status: rows.length ? '' : `No colleges from ${state} in the active registry sources yet.` }));
    } catch {
      if (sequence !== requestSequence.current) return;
      setStateColleges({ state, rows: [], status: 'College list unavailable (UNKNOWN). Try again.' });
    }
  };
  const scale = ZOOM_STEPS[zoom];
  const viewW = 600 / scale, viewH = 650 / scale;
  const viewX = Math.min(600 - viewW, Math.max(0, (600 - viewW) / 2 + pan.x));
  const viewY = Math.min(650 - viewH, Math.max(0, (650 - viewH) / 2 + pan.y));
  const nudge = (dx, dy) => setPan(value => ({ x: value.x + dx / scale, y: value.y + dy / scale }));

  // Determine active region from state or selectedRegion prop
  const activeRegion = (pickedState && regionForState(pickedState)) || selectedRegion || (selectedState ? regionForState(selectedState) : null);

  // Pin coordinates resolution. A city-level pin needs coordinates in the
  // college's own data; otherwise the pin marks the region and the caption says
  // the location is shown at state level (no coordinates are invented).
  let pinCoord = null;
  let pinLevel = null;
  if (coordinates && Number.isFinite(coordinates.x) && Number.isFinite(coordinates.y)) {
    pinCoord = coordinates; pinLevel = 'city';
  } else if ((institutionName || institutionPid || selectedCity) && activeRegion && AICTE_REGIONS[activeRegion]) {
    pinCoord = INDIA_STATES.find(state => state.name === canonicalState(selectedState))?.center || AICTE_REGIONS[activeRegion].center; pinLevel = 'state';
  }

  // Calculate choropleth heat fill
  const maxCount = Math.max(1, ...Object.values(regionCounts).map(v => typeof v === 'number' ? v : (v?.open || v?.total || 0)));

  const getRegionFill = (regionKey) => {
    const isSelected = activeRegion === regionKey;
    const isHovered = hoveredRegion === regionKey;

    if (isSelected) return '#f97316'; // Saffron brand highlight
    if (isHovered) return '#fb923c';

    const countVal = regionCounts[regionKey];
    const count = typeof countVal === 'number' ? countVal : (countVal?.open || countVal?.total || 0);

    if (count > 0) {
      const ratio = count / maxCount;
      if (ratio > 0.6) return '#fdba74'; // Deeper warm saffron-tint
      if (ratio > 0.3) return '#fed7aa';
      return '#ffedd5';
    }

    return '#f1f5f9'; // Clean slate-100 neutral
  };
  const hasCounts = Object.keys(regionCounts || {}).length > 0;
  const regionClass = regionKey => {
    if (activeRegion === regionKey) return 'fill-saffron-400';
    if (hoveredRegion === regionKey) return 'fill-saffron-200';
    return hasCounts ? '' : REGION_FILL_CLASS[regionKey];
  };

  return (
    <div className={`relative flex flex-col items-center bg-white rounded-xl border border-slate-200 p-4 shadow-sm ${className}`}>
      {/* Header / Legend */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-saffron-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Configured regions · illustrative map
          </span>
        </div>
        {activeRegion && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-saffron-50 text-saffron-800 border border-saffron-200">
            Active: {activeRegion}
          </span>
        )}
      </div>

      {/* SVG Map */}
      <div className="relative w-full max-w-[640px] aspect-[600/650]">
        <svg
          viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
          className="w-full h-full drop-shadow-sm select-none motion-safe:transition-all"
          role="img"
          aria-label="Illustrative map showing six configured regions and the institution location"
        >
          {/* Subtle Outer Boundary & Graticule */}
          <rect x="2" y="2" width="596" height="646" rx="12" fill="#fafafa" stroke="#e2e8f0" strokeWidth="1" />

          <defs>
            <radialGradient id="map-ocean"><stop offset="0" stopColor="#f8fdff"/><stop offset="1" stopColor="#e8f2f7"/></radialGradient>
            <filter id="map-land-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#193451" floodOpacity=".17"/></filter>
          </defs>
          <rect x="3" y="3" width="594" height="644" rx="12" fill="url(#map-ocean)" />
          <g opacity=".25" stroke="#b8ccd7" strokeWidth=".5" pointerEvents="none">
            {[100,200,300,400,500].map(x => <path key={x} d={`M${x} 20V630`}/>)}
            {[100,200,300,400,500,600].map(y => <path key={y} d={`M20 ${y}H580`}/>)}
          </g>
          <g filter="url(#map-land-shadow)">
            {INDIA_STATES.map(state => {
              const regionKey = regionForState(state.name);
              const selected = canonicalState(focusState) === state.name;
              const regionSelected = activeRegion === regionKey;
              return <path key={state.name} d={state.d} fillRule="evenodd"
                data-region={regionKey} data-map-state={state.name}
                className={`${regionClass(regionKey)} ${explorer || interactive ? 'cursor-pointer' : ''}`}
                fill={selected ? '#f97316' : hasCounts ? getRegionFill(regionKey) : undefined}
                stroke={selected ? '#9a3412' : regionSelected ? '#e78b39' : '#fff'} strokeWidth={selected ? 1.8 : .8}
                vectorEffect="non-scaling-stroke" strokeLinejoin="round"
                tabIndex={explorer || interactive ? 0 : -1} role={explorer || interactive ? 'button' : undefined}
                aria-label={`${state.name}, ${regionKey} region, ${collegesIn(state.name) ?? 'UNKNOWN'} institutions`}
                onMouseEnter={() => { setHoveredState(state.name); setHoveredRegion(regionKey); }}
                onMouseLeave={() => { setHoveredState(null); setHoveredRegion(null); }}
                onFocus={() => { setHoveredState(state.name); setHoveredRegion(regionKey); }}
                onBlur={() => { setHoveredState(null); setHoveredRegion(null); }}
                onClick={() => { if (explorer) { setCollegeQuery(''); void chooseState(state.name); } if (interactive) onSelectRegion?.(regionKey); }}
                onKeyDown={event => { if ((explorer || interactive) && ['Enter', ' '].includes(event.key)) { event.preventDefault(); if (explorer) void chooseState(state.name); if (interactive) onSelectRegion?.(regionKey); } }}>
                <title>{state.name} ? {regionKey} region ? {collegesIn(state.name) ?? 'UNKNOWN'} institutions in loaded sources</title>
              </path>;
            })}
          </g>
          <g pointerEvents="none" className="text-[10px] font-semibold fill-slate-700" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3, strokeLinejoin: 'round' }}>
            {[
              ['Northern', 230, 145], ['Western', 140, 335], ['Central', 278, 326],
              ['Southern', 245, 485], ['Eastern', 385, 300], ['North Eastern', 500, 238],
            ].map(([name,x,y]) => <text key={name} x={x} y={y} textAnchor="middle">{name}</text>)}
            <text x="78" y="440" className="text-[9px] italic fill-slate-400" strokeWidth="0">ARABIAN SEA</text>
            <text x="420" y="455" className="text-[9px] italic fill-slate-400" strokeWidth="0">BAY OF BENGAL</text>
          </g>
          <g transform="translate(550 65)" pointerEvents="none"><path d="M0 14V-10M-4-4L0-10 4-4" fill="none" stroke="#456078" strokeWidth="1.5"/><text y="-16" textAnchor="middle" className="text-[10px] fill-slate-500">N</text></g>

          {/* College Pin Marker */}
          {pinCoord && (
            <g className="motion-safe:animate-bounce" transform={`translate(${pinCoord.x}, ${pinCoord.y})`} data-testid="map-pin" data-pin-level={pinLevel}>
              <title>{`${institutionName || institutionPid || 'Selected college'}: ${pinLevel === 'city' ? 'city location' : 'location shown at state level'}`}</title>
              {/* Outer Pulse */}
              <circle cx="0" cy="0" r="14" fill="#f97316" opacity="0.3" className="motion-safe:animate-ping" />
              {/* Pin Base */}
              <circle cx="0" cy="0" r="6" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
              {/* Pin Tip */}
              <path d="M 0 0 L -4 -12 A 5 5 0 1 1 4 -12 Z" fill="#c2410c" stroke="#ffffff" strokeWidth="1" />
            </g>
          )}
        </svg>

        {/* Hover / Selection Tooltip */}
        {(hoveredRegion || activeRegion) && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/95 text-white text-xs p-2.5 rounded-lg shadow-lg backdrop-blur-sm pointer-events-none transition-all">
            <div className="flex items-center justify-between font-bold">
              <span className="text-saffron-400">
                {hoveredState || AICTE_REGIONS[hoveredRegion || activeRegion]?.name}
              </span>
              <span className="text-[10px] text-slate-400">
                HQ: {AICTE_REGIONS[hoveredRegion || activeRegion]?.hq}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 mt-1 line-clamp-1">
              {AICTE_REGIONS[hoveredRegion || activeRegion]?.states.join(', ')}
            </p>
            {institutionName && (
              <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                📍 {institutionName} {institutionPid && `(${institutionPid})`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* N100: zoom and pan controls, legend, state selection, honest label */}
      <div className="w-full mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-saffron-800" data-testid="map-illustrative-label">{ILLUSTRATIVE_LABEL}</p>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Map zoom and pan">
          <button type="button" className="min-h-10 min-w-10 rounded-lg border border-ink-200 bg-white text-sm font-bold hover:border-saffron-400 focus-visible:ring-2 focus-visible:ring-saffron-500 disabled:opacity-40" aria-label="Zoom in" disabled={zoom === ZOOM_STEPS.length - 1} onClick={() => setZoom(value => Math.min(ZOOM_STEPS.length - 1, value + 1))}>+</button>
          <button type="button" className="min-h-10 min-w-10 rounded-lg border border-ink-200 bg-white text-sm font-bold hover:border-saffron-400 focus-visible:ring-2 focus-visible:ring-saffron-500 disabled:opacity-40" aria-label="Zoom out" disabled={zoom === 0} onClick={() => setZoom(value => Math.max(0, value - 1))}>−</button>
          {zoom > 0 && <>
            <button type="button" className="min-h-10 min-w-10 rounded-lg border border-ink-200 bg-white text-xs focus-visible:ring-2 focus-visible:ring-saffron-500" aria-label="Pan left" onClick={() => nudge(-60, 0)}>◀</button>
            <button type="button" className="min-h-10 min-w-10 rounded-lg border border-ink-200 bg-white text-xs focus-visible:ring-2 focus-visible:ring-saffron-500" aria-label="Pan up" onClick={() => nudge(0, -60)}>▲</button>
            <button type="button" className="min-h-10 min-w-10 rounded-lg border border-ink-200 bg-white text-xs focus-visible:ring-2 focus-visible:ring-saffron-500" aria-label="Pan down" onClick={() => nudge(0, 60)}>▼</button>
            <button type="button" className="min-h-10 min-w-10 rounded-lg border border-ink-200 bg-white text-xs focus-visible:ring-2 focus-visible:ring-saffron-500" aria-label="Pan right" onClick={() => nudge(60, 0)}>▶</button>
          </>}
          <button type="button" className="min-h-10 rounded-lg border border-ink-200 bg-white px-3 text-xs font-semibold hover:border-saffron-400 focus-visible:ring-2 focus-visible:ring-saffron-500" aria-label="Reset map" onClick={() => { requestSequence.current++; setZoom(0); setPan({ x: 0, y: 0 }); setPickedState(null); setStateColleges({ state: null, rows: [], status: '' }); }}>Reset</button>
        </div>
      </div>
      <ul className="w-full mt-2 flex flex-wrap gap-2 text-[11px]" aria-label="AICTE region legend">
        {Object.keys(AICTE_REGIONS).map(region => (
          <li key={region} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${activeRegion === region ? 'border-saffron-500 bg-saffron-50 font-bold text-saffron-900' : 'border-slate-200 text-slate-700'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${activeRegion === region ? 'bg-saffron-500' : REGION_SWATCH_CLASS[region]}`} aria-hidden="true" />{region}
          </li>
        ))}
      </ul>
      {pinLevel === 'state' && <p className="w-full mt-2 text-xs font-semibold text-ink-700" data-testid="map-pin-caption">📍 {institutionName || institutionPid || selectedCity}: Location shown at state level ({selectedState ? `${selectedState}, ` : ''}{activeRegion} region)</p>}
      {pinLevel === 'city' && <p className="w-full mt-2 text-xs font-semibold text-ink-700" data-testid="map-pin-caption">📍 {institutionName || institutionPid}: city location from the college record</p>}
      {(explorer || focusState) && (
        <div className="w-full mt-3 border-t border-slate-100 pt-2">
          <p className="text-xs font-bold text-slate-800">{explorer ? 'States and union territories: select one to list its colleges' : 'State'}</p>
          <div className="mt-2 max-h-64 overflow-auto space-y-2">
            {Object.entries(AICTE_REGIONS).filter(([region]) => explorer || region === activeRegion).map(([region, meta]) => (
              <div key={region}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{region}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {meta.states.filter(state => explorer || state === focusState).map(state => {
                    const selected = canonicalState(focusState) === canonicalState(state);
                    const total = collegesIn(state);
                    return (
                      <button key={state} type="button" data-state={state} aria-pressed={selected}
                        title={`${state} · ${region} region · ${total === null ? 'college count UNKNOWN' : `${total} college${total === 1 ? '' : 's'} in active registry sources`}`}
                        onMouseEnter={() => { setHoveredState(state); setHoveredRegion(region); }} onMouseLeave={() => { setHoveredState(null); setHoveredRegion(null); }}
                        onFocus={() => { setHoveredState(state); setHoveredRegion(region); }} onBlur={() => { setHoveredState(null); setHoveredRegion(null); }}
                        onClick={() => chooseState(state)}
                        className={`min-h-10 rounded-lg border px-2.5 text-xs focus-visible:ring-2 focus-visible:ring-saffron-500 ${selected ? 'border-saffron-600 bg-saffron-500 font-bold text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-saffron-400 hover:bg-saffron-50'}`}>
                        {state}{total !== null && <span className={`ml-1 rounded px-1 font-mono ${selected ? 'bg-saffron-700' : 'bg-slate-100'}`}>{total}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {hoveredState && <p className="mt-2 text-xs text-slate-600" role="status">{hoveredState} · {STATE_TO_REGION[hoveredState]} region · {collegesIn(hoveredState) === null ? 'college count UNKNOWN' : `${collegesIn(hoveredState)} colleges in active registry sources`}</p>}
          {explorer && stateColleges.state && (
            <div className="mt-3" aria-label={`Colleges in ${stateColleges.state}`}>
              <p className="text-xs font-bold text-slate-800">Colleges in {stateColleges.state}</p>
              {stateColleges.status && <p className="text-xs text-slate-600">{stateColleges.status}</p>}
              <form className="mt-2 flex gap-2" onSubmit={event => { event.preventDefault(); void chooseState(stateColleges.state, 0, collegeQuery); }}>
                <input aria-label="Search colleges in selected state" placeholder="Search this state's colleges" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs" value={collegeQuery} onChange={event => setCollegeQuery(event.target.value)}/>
                <button className="btn-primary text-xs" type="submit">Search</button>
              </form>
              <ul className="mt-2 max-h-80 overflow-auto space-y-1">
                {stateColleges.rows.map(row => (
                  <li key={row.pid || row.recordKey}>
                    <button type="button" className="w-full min-h-10 rounded-lg border border-slate-200 px-3 py-1.5 text-left text-xs hover:border-saffron-400 hover:bg-saffron-50 focus-visible:ring-2 focus-visible:ring-saffron-500" onClick={() => onSelectInstitution?.(row)} disabled={!row.pid}>
                      <strong className="block text-slate-900">{row.name}</strong><span className="block text-[10px] text-slate-500">Supplied research export ? {row.city || row.state}</span>
                      <span className="font-mono text-slate-600">{row.pid} · {row.icid || 'ICID not available'}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {stateColleges.nextOffset != null && <button type="button" className="btn mt-3 border border-slate-200 text-xs" onClick={() => chooseState(stateColleges.state, stateColleges.nextOffset, collegeQuery)}>Load more institutions</button>}
            </div>
          )}
        </div>
      )}

      {/* Legend & Compliance Footer */}
      <div className="w-full mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <a href="/maps/SOURCE.md" target="_blank" rel="noreferrer" className="underline">Boundary data and attribution</a>
        <span>Zero external API calls · 100% Offline SVG</span>
      </div>
    </div>
  );
}
