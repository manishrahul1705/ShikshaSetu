const {test,expect}=require('@playwright/test');
const {installPrivacyGuard}=require('./privacy.cjs');
test('[JURY-PRIVACY] dynamic identity, narrative, OTP and input values are masked before a rendered frame',async({page})=>{
 await page.addInitScript(installPrivacyGuard);
 await page.goto('data:text/html,<main><span id="public">Public content</span><span id="edited">Status</span></main>');
 const result=await page.evaluate(async()=>{
  const host=document.createElement('section');
  host.innerHTML='<span id="email">reporter@synthetic.invalid</span><span id="otp">123456</span><p id="narrative" class="whitespace-pre-wrap">Protected complaint text</p><input id="input" value="Protected input">';
  document.body.append(host);
  document.querySelector('#edited').firstChild.nodeValue='updated@synthetic.invalid';
  await new Promise(resolve=>requestAnimationFrame(resolve));
  return {privateIds:['email','otp','narrative','edited'].map(id=>({id,visibility:getComputedStyle(document.getElementById(id)).visibility,hidden:document.getElementById(id).getAttribute('aria-hidden')})),inputColor:getComputedStyle(document.querySelector('#input')).color,publicVisibility:getComputedStyle(document.querySelector('#public')).visibility};
 });
 for(const row of result.privateIds){expect(row.visibility,row.id).toBe('hidden');expect(row.hidden,row.id).toBe('true');}
 expect(result.inputColor).toBe('rgba(0, 0, 0, 0)');
 expect(result.publicVisibility).toBe('visible');
});
