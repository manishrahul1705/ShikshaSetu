# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ps-story.spec.js >> [PS-STORY] N81 to N89 coordinated workflow, exports and role isolation
- Location: e2e\ps-story.spec.js:7:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard$/
Received string:  "http://127.0.0.1:5317/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://127.0.0.1:5317/login"

```

```yaml
- banner:
  - link "AWAAZ DASTAK powered by NEXUS-IC":
    - /url: /
  - navigation:
    - link "Home":
      - /url: /
    - link "Institution registry":
      - /url: /institutions/lookup
    - button "Toggle Language": हिन्दी
    - link "Login":
      - /url: /login
- main:
  - text: AWAAZ DASTAK powered by NEXUS-IC
  - paragraph: "\"Every voice, at the right door.\""
  - list:
    - listitem: Verified reporters, sealed identity vault
    - listitem: Institution identity by PID, corroborated by ICID
    - listitem: "No lost transfers: sender stays accountable"
    - listitem: Every action in a tamper-evident audit chain
  - paragraph: AICTE PS 26264 · Integrated grievance resolution
  - heading "Sign In" [level=1]
  - paragraph: AWAAZ DASTAK — powered by NEXUS-IC
  - text: Username Password
  - button "Signing in..." [disabled]
  - paragraph: "Choose your workspace:"
  - button "Verified student trust_student_verified"
  - button "Student (unverified) student1"
  - button "Faculty faculty1"
  - button "Institution Admin inst_admin1"
  - button "RB Officer rb_officer1"
  - button "PGRC Officer pgrc_officer1"
  - button "Regional Officer regional1"
  - button "Supervisor supervisor1"
  - button "Competent Authority authority1"
  - button "Auditor auditor1"
  - button "System Admin sysadmin1"
  - paragraph: Use the credentials assigned to your role.
- contentinfo: AWAAZ DASTAK — powered by NEXUS-IC · Every voice, at the right door.
```

# Test source

```ts
  1  | const {test,expect}=require('@playwright/test');
  2  | const fs=require('node:fs/promises');
  3  | const path=require('node:path');
  4  | const {installPrivacyGuard}=require('./privacy.cjs');
  5  | const {startRecording}=require('./ps-recording.cjs');
  6  | const BASE='http://127.0.0.1:5317';
  7  | test('[PS-STORY] N81 to N89 coordinated workflow, exports and role isolation',async({browser},info)=>{
  8  |   const dir=path.resolve('docs/screenshots/ps-story',`run-${info.repeatEachIndex+1}`);
  9  |   await fs.mkdir(dir,{recursive:true});
  10 |   const videoAvailable=require('node:fs').existsSync(path.join(process.env.LOCALAPPDATA,'ms-playwright','ffmpeg-1013','ffmpeg-win64.exe'));
  11 |   const context=await browser.newContext({baseURL:BASE,viewport:{width:1366,height:768},...(videoAvailable?{recordVideo:{dir:path.join(dir,'video'),size:{width:1366,height:768}}}:{})});
  12 |   await context.addInitScript(installPrivacyGuard);
  13 |   const page=await context.newPage(), errors=[],timings=[];
  14 |   const stopRecording=videoAvailable?null:await startRecording(browser,page,path.join(dir,'rehearsal.webm'));
  15 |   page.on('pageerror',e=>errors.push(e.message));
  16 |   async function api(url,data){const r= data===undefined?await context.request.get(`${BASE}/api/v1${url}`):await context.request.post(`${BASE}/api/v1${url}`,{data,headers:{Origin:BASE}});expect(r.ok(),`${url}: ${r.status()} ${await r.text()}`).toBeTruthy();return r.json();}
> 17 |   async function login(username){await context.clearCookies();await page.goto('/login');await page.locator('form input').nth(0).fill(username);await page.locator('form input').nth(1).fill('demo1234');await page.getByRole('button',{name:'Sign In',exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);}
     |                                                                                                                                                                                                                                                                                               ^ Error: expect(page).toHaveURL(expected) failed
  18 |   async function visit(route,ready){const start=Date.now();await page.goto(route);await ready();timings.push({route,ms:Date.now()-start});}
  19 |   async function shot(name){expect(await page.locator('body').innerText()).not.toMatch(/\b(synthetic|demo|fake|sample|simulator)\b|POLICY_NOT_CONFIGURED|_comment/i);await page.screenshot({path:path.join(dir,`${name}.png`),fullPage:true,mask:[page.locator('input:not([data-jury-public]),textarea,[data-jury-private]')],maskColor:'#cbd5e1'});}
  20 |   try {
  21 |     await login('rb_officer1');const tour=await api('/judge/tour');const pid=tour.scenario.institutionPid;
  22 |     const requests=await api(`/combined-requests?pid=${pid}`);const issued=requests.find(r=>r.status==='ISSUED');expect(issued).toBeTruthy();
  23 |     const caseId=issued.items.find(i=>i.office==='Regulation Bureau').caseId;
  24 |     await visit(`/queries/${caseId}`,()=>expect(page.locator('input[value="institution"]')).toBeVisible());
  25 |     await page.locator('input[value="institution"]').check();await page.locator('form textarea').first().fill('Fee notification');await page.locator('form button[type="submit"]').first().click();
  26 |     await expect(page.getByText('Potential overlapping action',{exact:true})).toBeVisible();await expect(page.getByText(/Already submitted, version/)).toBeVisible();await shot('01-inline-preflight');
  27 |     await visit(`/requests/combined?pid=${pid}`,()=>expect(page.getByRole('heading',{name:issued.reference})).toBeVisible());await shot('02-combined-request');
  28 |     const preflight=await api('/prevent/check-action',{caseId,actionType:'DOCUMENT_REQUEST',details:{subject:'Fee notification'}});
  29 |     const denied=await context.request.post(`${BASE}/api/v1/prevent/check-action/${preflight.checkId}/proceed`,{data:{reason:''},headers:{Origin:BASE}});expect(denied.status()).toBe(400);
  30 |     await login('inst_admin1');await visit('/documents/locker',()=>expect(page.getByRole('heading',{name:/Fee notification.*version 2/})).toBeVisible());await shot('03-document-locker');
  31 |     await visit('/requests/combined',()=>expect(page.getByRole('heading',{name:issued.reference})).toBeVisible());
  32 |     const fresh=await api('/combined-requests');const pending=fresh.find(r=>r.id===issued.id)?.items.find(i=>i.status==='PENDING');
  33 |     if(pending){const version=(await api('/locker')).versions[0];await api(`/combined-requests/${issued.id}/items/${pending.id}/reply`,{responseText:'The notification is available in the document locker.',lockerVersionIds:[version.id]});await page.reload();await expect(page.getByText('The notification is available in the document locker.').first()).toBeVisible();}
  34 |     await login('trust_student_verified');await visit('/track',()=>expect(page.getByText('What happens next',{exact:true}).first()).toBeVisible());await shot('04-student-track');
  35 |     await page.getByRole('button',{name:'Toggle Language'}).click();await expect(page.getByRole('heading',{name:'मेरे मामलों की स्थिति'})).toBeVisible();await expect(page.getByRole('heading',{name:'आगे क्या होगा'}).first()).toBeVisible();await shot('04b-student-hindi');await page.getByRole('button',{name:'Toggle Language'}).click();
  36 |     for(const url of ['/combined-requests','/locker','/reports/monthly?month=2026-10','/officer-workload','/ps-coverage'])expect((await context.request.get(`${BASE}/api/v1${url}`)).status()).toBe(403);
  37 |     await page.setViewportSize({width:390,height:844});await shot('05-student-mobile');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.setViewportSize({width:1366,height:768});
  38 |     await login('authority1');await visit('/reports/monthly',()=>expect(page.getByRole('columnheader',{name:'Opening',exact:true})).toBeVisible());await shot('06-monthly-report');
  39 |     const month=new Date().toISOString().slice(0,7), report=await api(`/reports/monthly?month=${month}&scope=all`);
  40 |     for(const row of report.rows)for(const [metric,count]of Object.entries(row.counts))expect(row.cells[metric].length).toBe(count);
  41 |     for(const ext of ['csv','pdf']){const r=await context.request.get(`${BASE}/api/v1/reports/monthly.${ext}?month=${month}&scope=all`);expect(r.ok()).toBeTruthy();await fs.writeFile(path.join(dir,`monthly.${ext}`),await r.body());}
  42 |     await visit('/coverage',()=>expect(page.getByRole('heading',{name:'Problem-statement coverage'})).toBeVisible());await shot('07-coverage');
  43 |     await login('rb_officer1');await visit(`/walkthrough/compare?pid=${pid}`,()=>expect(page.getByText('Source: Issued combined covers',{exact:false}).first()).toBeVisible());for(let n=0;n<4;n++)await page.getByRole('button',{name:'Reveal next step'}).click();await shot('08-comparison');
  44 |     await page.setViewportSize({width:390,height:844});await shot('09-comparison-mobile');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  45 |     await page.setViewportSize({width:1366,height:768});await visit('/officer-workload',()=>expect(page.getByText('Relief officer 1',{exact:true})).toBeVisible());await shot('10-workload');
  46 |     expect(errors).toEqual([]);
  47 |   } finally {
  48 |     try {
  49 |       const recording=stopRecording?await stopRecording():null;
  50 |       await fs.writeFile(path.join(dir,'checks.json'),JSON.stringify({timings,errors,video:videoAvailable?'Playwright recording':'Chrome recording',recording},null,2));
  51 |     } finally {await context.close();}
  52 |   }
  53 | });
  54 | 
```