const {request}=require('@playwright/test');
const crypto=require('node:crypto');
const fs=require('node:fs/promises');
(async()=>{
 const base='http://127.0.0.1:5327';
 const context=await request.newContext({baseURL:base});
 try {
  const login=await context.post('/api/v1/auth/login',{headers:{Origin:base},data:{username:'supervisor1',password:'demo1234'}});
  if(!login.ok())throw new Error('PROFILE_LOGIN_FAILED');
  const records=[];
  for(const endpoint of ['/impact/summary','/prevent/overlaps']) {
   for(const run of ['first request','repeat request']) {
    const started=performance.now();const response=await context.get('/api/v1'+endpoint);
    const body=await response.json();
    if(!response.ok())throw new Error('PROFILE_REQUEST_FAILED:'+endpoint);
    records.push({endpoint,run,ms:Math.round((performance.now()-started)*10)/10,responseSha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')});
   }
  }
  const evidence={at:new Date().toISOString(),scope:'Supervisor; local showcase; first request is cold only when run immediately after audit-runtime startup',records};
  await fs.writeFile('docs/screenshots/audit/api-profile.json',JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence,null,2));
 } finally {await context.dispose();}
})();
