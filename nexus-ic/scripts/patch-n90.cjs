const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'client', 'src', 'pages', 'intake', 'GrievanceSubmit.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add showManualPid state
code = code.replace(
  'const [institutionError, setInstitutionError] = useState(\'\');',
  'const [institutionError, setInstitutionError] = useState(\'\');\r\n  const [showManualPid, setShowManualPid] = useState(false);'
);

// 2. Replace manual PID input with N90 auto-fetch picker and optional toggle link
const oldBlockStart = code.indexOf('<InstitutionPicker onSelect={row => { setPid(row.pid); setInstitution(row); setInstitutionError(\'\'); }} />');
const oldBlockEnd = code.indexOf('{/* Category & Subcategory selection */}');

if (oldBlockStart !== -1 && oldBlockEnd !== -1) {
  const replacement = [
    '<InstitutionPicker onSelect={row => {',
    '          setPid(row.pid);',
    '          setInstitution(row);',
    '          setInstitutionError(\'\');',
    '        }} />',
    '        <div className="flex justify-end">',
    '          <button',
    '            type="button"',
    '            onClick={() => setShowManualPid(v => !v)}',
    '            className="text-xs text-saffron-700 hover:text-saffron-800 underline font-medium"',
    '          >',
    '            {showManualPid ? \'Hide manual PID entry\' : \'Or enter PID directly instead\'}',
    '          </button>',
    '        </div>',
    '        {showManualPid && (',
    '          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">',
    '            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">',
    '              {t(\'enterPid\')} *',
    '            </label>',
    '            <div className="flex gap-2">',
    '              <input',
    '                type="text"',
    '                value={pid}',
    '                onChange={(e) => setPid(e.target.value)}',
    '                placeholder={t(\'pidPlaceholder\')}',
    '                className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"',
    '              />',
    '              <button',
    '                type="button"',
    '                onClick={handleLookupPid}',
    '                disabled={pidSearching || !pid.trim()}',
    '                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"',
    '              >',
    '                {pidSearching ? \'Searching...\' : t(\'fetchDetails\')}',
    '              </button>',
    '            </div>',
    '            <p className="text-[11px] text-slate-500">',
    '              Exact match only. Format: 1-XXXXXXXXXX (e.g. 1-1234567890).',
    '            </p>',
    '          </div>',
    '        )}',
    '        {institutionError && (',
    '          <p className="text-xs text-red-600 font-medium">{institutionError}</p>',
    '        )}',
    '        {institution && (',
    '          <div className="p-4 bg-saffron-50/60 border border-saffron-200 rounded-lg text-xs space-y-2">',
    '            <div className="flex items-center justify-between">',
    '              <span className="font-bold text-ink-950 text-sm">{institution.name}</span>',
    '              <div className="flex items-center gap-1.5">',
    '                <span className="px-2 py-0.5 bg-bharat-100 text-bharat-800 font-semibold rounded text-[11px]">',
    '                  {institution.approvalStatus || \'APPROVED\'}',
    '                </span>',
    '                <span className={`px-2 py-0.5 font-semibold rounded text-[11px] ${institution.icidCheck === \'MATCH\' ? \'bg-bharat-50 text-bharat-700 border border-bharat-200\' : institution.icidCheck === \'IDENTITY_REVIEW\' ? \'bg-amber-50 text-amber-800 border border-amber-200\' : \'bg-slate-50 text-slate-600 border border-slate-200\'}`}>',
    '                  ICID: {institution.icidCheck || (institution.icid ? \'MATCH\' : \'NOT AVAILABLE\')}',
    '                </span>',
    '              </div>',
    '            </div>',
    '            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-700 pt-1 border-t border-saffron-100">',
    '              <div><span className="text-slate-500 block">PID:</span><span className="font-mono font-bold text-ink-900">{institution.pid}</span></div>',
    '              <div><span className="text-slate-500 block">Region:</span><span className="font-semibold text-ink-900">{institution.region}</span></div>',
    '              <div><span className="text-slate-500 block">State:</span><span className="font-semibold text-ink-900">{institution.state}</span></div>',
    '              <div><span className="text-slate-500 block">Type:</span><span className="text-ink-900">{institution.type || \'Engineering & Tech\'}</span></div>',
    '            </div>',
    '          </div>',
    '        )}',
    '        '
  ].join('\r\n');
  code = code.slice(0, oldBlockStart) + replacement + code.slice(oldBlockEnd);
  fs.writeFileSync(file, code, 'utf8');
  console.log('GrievanceSubmit.jsx updated for N90 successfully.');
} else {
  console.error('Target block not found in GrievanceSubmit.jsx', { oldBlockStart, oldBlockEnd });
}
