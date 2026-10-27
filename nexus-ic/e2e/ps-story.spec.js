const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const path=require('node:path');
const {installPrivacyGuard}=require('./privacy.cjs');
const {startRecording}=require('./ps-recording.cjs');
const BASE='http://127.0.0.1:5317';
test('[PS-STORY] N81 to N89 coordinated workflow, exports and role isolation',async({browser},info)=>{
  const dir=path.resolve('docs/screenshots/ps-story',`run-${info.repeatEachIndex+1}`);
  await fs.mkdir(dir,{recursive:true});
  const videoAvailable=require('node:fs').existsSync(path.join(process.env.LOCALAPPDATA,'ms-playwright','ffmpeg-1013','ffmpeg-win64.exe'));
  const context=await browser.newContext({baseURL:BASE,viewport:{width:1366,height:768},...(videoAvailable?{recordVideo:{dir:path.join(dir,'video'),size:{width:1366,height:768}}}:{})});
  await context.addInitScript(installPrivacyGuard);
  const page=await context.newPage(), errors=[],timings=[];
  const stopRecording=videoAvailable?null:await startRecording(browser,page,path.join(dir,'rehearsal.webm'));
  page.on('pageerror',e=>errors.push(e.message));
  async function api(url,data){const r= data===undefined?await context.request.get(`${BASE}/api/v1${url}`):await context.request.post(`${BASE}/api/v1${url}`,{data,headers:{Origin:BASE}});expect(r.ok(),`${url}: ${r.status()} ${await r.text()}`).toBeTruthy();return r.json();}
  async function login(username){await context.clearCookies();await page.goto('/login');await page.locator('form input').nth(0).fill(username);await page.locator('form input').nth(1).fill('demo1234');await page.getByRole('button',{name:'Sign In',exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);}
  async function visit(route,ready){const start=Date.now();await page.goto(route);await ready();timings.push({route,ms:Date.now()-start});}
  async function shot(name){expect(await page.locator('body').innerText()).not.toMatch(/\b(synthetic|demo|fake|sample|simulator)\b|POLICY_NOT_CONFIGURED|_comment/i);await page.screenshot({path:path.join(dir,`${name}.png`),fullPage:true,mask:[page.locator('input:not([data-jury-public]),textarea,[data-jury-private]')],maskColor:'#cbd5e1'});}
  try {
    await login('rb_officer1');const tour=await api('/judge/tour');const pid=tour.scenario.institutionPid;
    const requests=await api(`/combined-requests?pid=${pid}`);const issued=requests.find(r=>r.status==='ISSUED');expect(issued).toBeTruthy();
    const caseId=issued.items.find(i=>i.office==='Regulation Bureau').caseId;
    await login('trust_student_verified');
    await visit('/grievances/new',()=>expect(page.getByRole('combobox',{name:'Find an institution'})).toBeVisible());
    await shot('00-student-intake');
    const filed=await api('/grievances',{institutionPid:pid,category:'Fee Dispute',subCategory:'Refund Denial',narrative:`The refundable laboratory deposit remains unpaid after a written request. Please review the receipt and refund record. ${Date.now()}`,language:'en'});
    expect(filed.masterCaseId).toMatch(/^NX-\d{4}-\d{6}$/);
    expect((await api('/track')).some(row=>row.masterCaseId===filed.masterCaseId)).toBe(true);
    await login('rb_officer1');
    await visit(`/queries/${caseId}`,()=>expect(page.locator('input[value="institution"]')).toBeVisible());
    await page.locator('input[value="institution"]').check();await page.locator('form textarea').first().fill('Fee notification');await page.locator('form button[type="submit"]').first().click();
    await expect(page.getByText('Potential overlapping action',{exact:true})).toBeVisible();await expect(page.getByText(/Already submitted, version/)).toBeVisible();await shot('01-inline-preflight');
    await visit(`/requests/combined?pid=${pid}`,()=>expect(page.getByRole('heading',{name:issued.reference})).toBeVisible());await shot('02-combined-request');
    const preflight=await api('/prevent/check-action',{caseId,actionType:'DOCUMENT_REQUEST',details:{subject:'Fee notification'}});
    const denied=await context.request.post(`${BASE}/api/v1/prevent/check-action/${preflight.checkId}/proceed`,{data:{reason:''},headers:{Origin:BASE}});expect(denied.status()).toBe(400);
    await login('inst_admin1');await visit('/documents/locker',()=>expect(page.getByRole('heading',{name:/Fee notification.*version 2/})).toBeVisible());await shot('03-document-locker');
    await visit('/requests/combined',()=>expect(page.getByRole('heading',{name:issued.reference})).toBeVisible());
    const fresh=await api('/combined-requests');const pending=fresh.find(r=>r.id===issued.id)?.items.find(i=>i.status==='PENDING');
    if(pending){const version=(await api('/locker')).versions[0];await api(`/combined-requests/${issued.id}/items/${pending.id}/reply`,{responseText:'The notification is available in the document locker.',lockerVersionIds:[version.id]});await page.reload();await expect(page.getByText('The notification is available in the document locker.').first()).toBeVisible();}
    await login('trust_student_verified');await visit('/track',()=>expect(page.getByText('What happens next',{exact:true}).first()).toBeVisible());await expect(page.getByText(filed.masterCaseId)).toBeVisible();await shot('04-student-track');
    await page.getByRole('button',{name:'Toggle Language'}).click();await expect(page.getByRole('heading',{name:'मेरे मामलों की स्थिति'})).toBeVisible();await expect(page.getByRole('heading',{name:'आगे क्या होगा'}).first()).toBeVisible();await shot('04b-student-hindi');await page.getByRole('button',{name:'Toggle Language'}).click();
    for(const url of ['/combined-requests','/locker','/reports/monthly?month=2026-10','/officer-workload','/ps-coverage'])expect((await context.request.get(`${BASE}/api/v1${url}`)).status()).toBe(403);
    await page.setViewportSize({width:390,height:844});await shot('05-student-mobile');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.setViewportSize({width:1366,height:768});
    await login('authority1');await visit('/reports/monthly',()=>expect(page.getByRole('columnheader',{name:'Opening',exact:true})).toBeVisible());await shot('06-monthly-report');
    const month=new Date().toISOString().slice(0,7), report=await api(`/reports/monthly?month=${month}&scope=all`);
    for(const row of report.rows)for(const [metric,count]of Object.entries(row.counts))expect(row.cells[metric].length).toBe(count);
    for(const ext of ['csv','pdf']){const r=await context.request.get(`${BASE}/api/v1/reports/monthly.${ext}?month=${month}&scope=all`);expect(r.ok()).toBeTruthy();await fs.writeFile(path.join(dir,`monthly.${ext}`),await r.body());}
    await visit('/coverage',()=>expect(page.getByRole('heading',{name:'Problem-statement coverage'})).toBeVisible());await shot('07-coverage');
    await login('rb_officer1');await visit(`/walkthrough/compare?pid=${pid}`,()=>expect(page.getByText('Source: Issued combined covers',{exact:false}).first()).toBeVisible());for(let n=0;n<4;n++)await page.getByRole('button',{name:'Reveal next step'}).click();await shot('08-comparison');
    await page.setViewportSize({width:390,height:844});await shot('09-comparison-mobile');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.setViewportSize({width:1366,height:768});await visit('/officer-workload',()=>expect(page.getByText('Relief officer 1',{exact:true})).toBeVisible());await shot('10-workload');
    expect(errors).toEqual([]);
  } finally {
    try {
      const recording=stopRecording?await stopRecording():null;
      await fs.writeFile(path.join(dir,'checks.json'),JSON.stringify({timings,errors,video:videoAvailable?'Playwright recording':'Chrome recording',recording},null,2));
    } finally {await context.close();}
  }
});
