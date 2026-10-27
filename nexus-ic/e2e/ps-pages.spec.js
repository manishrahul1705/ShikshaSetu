const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises'),path=require('node:path');
const {installPrivacyGuard}=require('./privacy.cjs');
const roles=[['student','trust_student_verified'],['faculty','trust_faculty_verified'],['institution_admin','inst_admin1'],['bureau_officer','rb_officer1'],['regional_officer','regional1'],['supervisor','supervisor1'],['competent_authority','authority1'],['auditor','auditor1'],['system_admin','sysadmin1']];
const officer=['bureau_officer','regional_officer','supervisor','competent_authority'], report=[...officer,'auditor','system_admin'];
const routes=[['/requests/combined',[...officer,'institution_admin'],'One combined request'],['/documents/locker',[...officer,'institution_admin'],'Submit once'],['/reports/monthly',report,'Monthly pendency report'],['/officer-workload',['supervisor','bureau_officer'],'Officer workload'],['/coverage',report,'Problem-statement coverage'],['/walkthrough/compare',report,'Today vs with AWAAZ DASTAK'],['/track',['student','faculty'],'What happens next']];
test('[PS-PAGES] permitted roles on desktop and mobile',async({browser})=>{
  const records=[];const directory=path.resolve('docs/screenshots/ps-story/pages');await fs.mkdir(directory,{recursive:true});
  for(const [role,username]of roles){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:5317'});await context.addInitScript(installPrivacyGuard);
    const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
      const login=await context.request.post('/api/v1/auth/login',{data:{username,password:'demo1234'},headers:{Origin:'http://127.0.0.1:5317'}});expect(login.ok()).toBe(true);
      for(const width of [1366,390])for(const [route,allowed,title]of routes.filter(r=>r[1].includes(role))){
        await page.setViewportSize({width,height:width===390?844:768});errors=[];const start=Date.now();await page.goto(route);
        await expect(page.getByRole('heading',{name:title,exact:true}).first()).toBeVisible();
        await expect.poll(async()=>await page.locator('main').innerText(),{timeout:15000}).not.toMatch(/Loading (requests|document versions|coverage|workload)|Calculating monthly/);
        const readyMs=Date.now()-start,text=await page.locator('body').innerText();
        const banned=text.match(/\b(synthetic|demo|fake|sample|simulator)\b|POLICY_NOT_CONFIGURED|_comment/ig)||[];
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
        const filename=`${role}-${width}-${route.replaceAll('/','-')}.png`;await page.screenshot({path:path.join(directory,filename),fullPage:true,mask:[page.locator('input:not([data-jury-public]),textarea,[data-jury-private]')]});
        records.push({role,route,width,readyMs,errors:[...errors,...banned.map(s=>`Visible wording: ${s}`),...(overflow?['Horizontal overflow']:[]),...(readyMs>3000?[`Content took ${readyMs}ms`]:[])],screenshot:filename});
        await fs.writeFile(path.join(directory,'evidence.json'),JSON.stringify(records,null,2));
      }
    }finally{await context.close();}
  }
  expect(records.flatMap(r=>r.errors.map(e=>`${r.role} ${r.width} ${r.route}: ${e}`))).toEqual([]);
});
