import mongoose from 'mongoose';
import fs from 'node:fs/promises';
const uri = 'mongodb://127.0.0.1:27017/awaaz_dastak_showcase';
await mongoose.connect(uri);
try {
 const db=mongoose.connection.db;
 const count=name=>db.collection(name).countDocuments();
 const cases=await db.collection('cases').find({}, {projection:{status:1,owningBureau:1,languageTag:1,slaClock:1}}).toArray();
 const institutions=await db.collection('institutions').find({}, {projection:{pid:1,name:1,district:1,campuses:1}}).toArray();
 const routing=await db.collection('routing_decisions').find({}, {projection:{isManualReview:1,confidence:1,reasons:1}}).toArray();
 const open=cases.filter(row=>!['Closed','CLOSED','DISPOSED'].includes(row.status));
 const summary={recordedAt:new Date().toISOString(),database:'awaaz_dastak_showcase',
  institutions:institutions.length,uniqueNames:new Set(institutions.map(row=>row.name)).size,
  validPids:institutions.filter(row=>/^1-\d{10}$/.test(row.pid)).length,
  oldSequentialPids:institutions.filter(row=>/^1-1000000/.test(row.pid)).length,
  cases:cases.length,openCases:open.length,openWithClocks:open.filter(row=>row.slaClock?.length).length,
  hindiNarratives:cases.filter(row=>row.languageTag==='hi').length,
  routingDecisions:routing.length,triageDecisions:routing.filter(row=>row.isManualReview).length,
  unroutedCases:cases.filter(row=>!row.owningBureau).length,
  appeals:await count('appeals'),revealRequests:await count('identity_reveal_requests'),
  coordination:await count('coordinations'),tasks:await count('tasks'),
  insiderAlerts:await count('insider_alerts'),slaEvents:await count('sla_events'),rescueAlerts:await count('rescue_alerts'),
  fingerprints:await count('integrity_fingerprints'),benchmarkRuns:await count('benchmark_runs')};
 await fs.mkdir('docs/screenshots/audit',{recursive:true});
 await fs.writeFile('docs/screenshots/audit/showcase-evidence.json',JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
} finally {await mongoose.disconnect();}
