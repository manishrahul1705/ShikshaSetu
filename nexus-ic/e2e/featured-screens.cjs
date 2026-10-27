const {chromium,request}=require('@playwright/test');
const fs=require('node:fs/promises');
const {installPrivacyGuard}=require('./privacy.cjs');
(async()=>{
 const directory='docs/screenshots/audit/highlights';
 await fs.mkdir(directory,{recursive:true});
 const browser=await chromium.launch({channel:'chrome'});
 try {
  const screens=[['supervisor1','/benchmark','01-benchmark'],['supervisor1','/rescue','02-rescue'],['supervisor1','/review/appeals','03-appeals'],['inst_admin1','/institution','04-institution'],['supervisor1','/officer/reveal-requests','05-reveal'],['supervisor1','/insider/alerts','06-insider'],['supervisor1','/review','07-prevent'],['authority1','/authority','08-authority'],['supervisor1','/integrity','09-integrity']];
  for(const [username,route,name] of screens) {
   const context=await browser.newContext({baseURL:'http://127.0.0.1:5327',viewport:{width:1440,height:1000}});
   await context.addInitScript(installPrivacyGuard);
   const login=await context.request.post('/api/v1/auth/login',{headers:{Origin:'http://127.0.0.1:5327'},data:{username,password:'demo1234'}});
   if(!login.ok())throw new Error('HIGHLIGHT_LOGIN_FAILED');
   const page=await context.newPage();
   await page.goto(route);
   await page.waitForLoadState('networkidle');
   await page.screenshot({path:`${directory}/${name}.png`,mask:[page.locator('input:not([data-jury-public]),textarea,[data-jury-private]')],maskColor:'#cbd5e1'});
   console.log(name+': '+route);
   await context.close();
  }
 }finally{await browser.close();}
})();
