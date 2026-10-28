const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../docs/screenshots/audit');
const records=[];
for(const viewport of ['desktop','mobile']) {
 const directory=path.join(root,viewport);
 if(!fs.existsSync(directory))continue;
 for(const role of fs.readdirSync(directory)) {
  const file=path.join(directory,role,'evidence.json');
  if(fs.existsSync(file))records.push(...JSON.parse(fs.readFileSync(file,'utf8')).records.map(row=>({...row,viewport})));
 }
}
const failed=records.filter(row=>row.errors.length);
const lines=['# Global Jury browser evidence','',
 'Recorded against the dedicated local showcase. Screenshots mask input values and protected text before capture. Evidence records preserve failures; a passing automated check does not assign a visual design score. Desktop is 1440 × 1000; mobile is 390 × 844.', '',
 `Latest per-page records: ${records.length}; passed ${records.length-failed.length}; failed ${failed.length}.`, '',
 '| Viewport | Role | Route | Content ready | Result | Screenshot |',
 '|---|---|---|---:|---|---|'];
for(const row of records)lines.push(`| ${row.viewport} | ${row.role} | ${row.route} | ${row.readyMs} ms | ${row.errors.length?'FAIL: '+row.errors.join('; ').replaceAll('|',' / '):'PASS'} | [Open](${row.screenshot}) |`);
lines.push('','Raw route metadata: [inventory](route-inventory.json). Current database counts: [showcase evidence](showcase-evidence.json). API timing measurements: [profile](api-profile.json).','',
 'The development audit notes and subjective before/after assessments are archived outside the repository. The route evidence and captures above remain available here.');
fs.writeFileSync(path.join(root,'README.md'),lines.join('\n')+'\n');
fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify({recordedAt:new Date().toISOString(),pages:records.length,passed:records.length-failed.length,failed:failed.length,failures:failed.map(({viewport,role,route,errors})=>({viewport,role,route,errors})),dashboards:records.filter(row=>row.route==='/dashboard').map(({viewport,role,readyMs,errors})=>({viewport,role,readyMs,errors}))},null,2)+'\n');
console.log(JSON.stringify({pages:records.length,passed:records.length-failed.length,failed:failed.length}));
