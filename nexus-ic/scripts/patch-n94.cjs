const fs = require('fs');
const path = require('path');

// 1. Patch CaseJourney.jsx
const journeyPath = path.resolve('client/src/pages/cases/CaseJourney.jsx');
let journey = fs.readFileSync(journeyPath, 'utf8');

const targetInJourney = `<p className="text-[11px] text-slate-500">PID is the only key; ICID corroborates and never links institutions on its own.`;
const mapSnippet = `          <IndiaMap
            selectedRegion={inst.registry?.region || inst.snapshot?.region}
            selectedState={inst.registry?.state || inst.snapshot?.state}
            selectedCity={inst.registry?.city || inst.snapshot?.city}
            institutionName={name}
            institutionPid={inst.pid}
            interactive={false}
          />
          <p className="text-[11px] text-slate-500">PID is the only key; ICID corroborates and never links institutions on its own.`;

if (!journey.includes('<IndiaMap')) {
  journey = journey.replace(targetInJourney, mapSnippet);
  fs.writeFileSync(journeyPath, journey, 'utf8');
  console.log('Successfully added IndiaMap to CaseJourney.jsx');
} else {
  console.log('CaseJourney.jsx already has IndiaMap');
}

// 2. Patch RegionalView.jsx
const regionalPath = path.resolve('client/src/pages/regional/RegionalView.jsx');
let regional = fs.readFileSync(regionalPath, 'utf8');

if (!regional.includes("import IndiaMap")) {
  regional = "import IndiaMap from '../../components/IndiaMap.jsx';\n" + regional;
  
  const mapSection = `          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IndiaMap
              selectedRegion={user?.role === 'regional_officer' ? user.region : null}
              regionCounts={(q.data.regionWise || []).reduce((acc, r) => { acc[r.region] = r.open; return acc; }, {})}
              interactive={true}
            />
            <section aria-label="Region-wise" className="border rounded-xl p-4 bg-white shadow-sm text-sm">
              <h2 className="font-bold text-base mb-2">Region-wise Case Breakdown</h2>
              <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left border-b pb-2"><th>Region</th><th>Total</th><th>Open</th><th>Overdue</th></tr></thead>
                <tbody>{q.data.regionWise.map((r) => <tr key={r.rowId} className="border-b last:border-0 hover:bg-slate-50"><td><span className="font-semibold">{r.region}</span></td><td><DrillLink row={r.rowId}>{r.total}</DrillLink></td><td><span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800">{r.open}</span></td><td>{r.overdue}</td></tr>)}</tbody></table></div>
            </section>
          </div>`;

  regional = regional.replace(
    `<section aria-label="Region-wise" className="border rounded p-3 bg-white text-sm">`,
    `{/* N94 India Map Choropleth */}\n` + mapSection + `\n          {false && <section aria-label="Region-wise" className="border rounded p-3 bg-white text-sm">`
  );

  fs.writeFileSync(regionalPath, regional, 'utf8');
  console.log('Successfully added IndiaMap to RegionalView.jsx');
} else {
  console.log('RegionalView.jsx already has IndiaMap');
}
