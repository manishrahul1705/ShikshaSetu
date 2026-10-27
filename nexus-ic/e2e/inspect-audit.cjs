const { chromium } = require('@playwright/test');
(async () => {
 const browser = await chromium.launch({channel:'chrome'});
 const context = await browser.newContext({baseURL:'http://127.0.0.1:5327'});
 await context.request.post('/api/v1/auth/login',{data:{username:'supervisor1',password:'demo1234'},headers:{Origin:'http://127.0.0.1:5327'}});
 const page = await context.newPage();
 for (const route of process.argv.length>2 ? process.argv.slice(2) : ['/institutions/1-6342091611','/graph/institutions/1-6342091611','/cases/NX-2026-001535']) {
  await page.goto(route); await page.waitForTimeout(1500);
  const text = await page.locator('body').innerText();
  console.log(route, text.split('\n').filter(line=>/simulator|POLICY_NOT_CONFIGURED/i.test(line)));
 }
 await browser.close();
})();
