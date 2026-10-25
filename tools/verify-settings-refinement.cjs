const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p))});
 for(const width of [360,390,440]){
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   for(const prefix of ['xy-home-v2','xy-home-v2:default']){
    localStorage.setItem(prefix+':reply-as-en','0');localStorage.setItem(prefix+':reply-dcp-all','0');
    localStorage.setItem(prefix+':__last-backup',String(Date.now()));localStorage.setItem(prefix+':__last-backup-remind',String(Date.now()));
    localStorage.setItem(prefix+':reply-fish-en','1');localStorage.setItem(prefix+':reply-work-en','1');
   }
   localStorage.setItem('xy-home-v2:storage-guide-shown','1250');
   localStorage.setItem('xy-home-v2:theme-mode','light');localStorage.setItem('xy-home-v2:desk-checkin-en','0');
  });
  await require('./startup-dialog-fixture.cjs')(page);await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.__mochiDataReady&&window.mochiSettingsRefinement);
  await page.evaluate(()=>document.querySelector('.tabbar [data-page="page-setting"]').click());
  const freq=await page.evaluate(()=>{const head=document.querySelector('#sf-desk-freq .freq-head'),info=document.getElementById('sf-desk-freq-tag');return {same:head.contains(info),right:info.getBoundingClientRect().right,head:head.getBoundingClientRect().right};});
  assert(freq.same&&Math.abs(freq.right-freq.head)<2);
  await page.locator('#theme-mode-switch').locator('..').click();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');assert.equal(await page.evaluate(()=>localStorage.getItem('xy-home-v2:theme-mode')),'dark');
  await page.locator('#theme-mode-switch').locator('..').click();assert.equal(await page.evaluate(()=>localStorage.getItem('xy-home-v2:theme-mode')),'light');
  // Existing three-mode chooser remains available through the row label.
  await page.locator('#row-theme-mode .txt').click();assert((await page.locator('#modal-title').textContent()).includes('深色模式'));await page.locator('#modal-cancel').click();
  await page.locator('#set-tabs [data-tab="system"]').click();
  assert.equal(await page.evaluate(()=>{const e=document.getElementById('bg-notify-perm-warn');return e.hidden&&getComputedStyle(e).display!=='none';}),false);
  await page.evaluate(()=>{const e=document.getElementById('bg-notify-perm-warn');e.textContent='后台通知权限测试提示';e.hidden=false;});
  assert(await page.locator('#bg-notify-perm-warn').isVisible());assert((await page.locator('#bg-notify-perm-warn').textContent()).includes('权限'));
  await page.evaluate(()=>{const e=document.getElementById('bg-notify-perm-warn');e.textContent='';e.hidden=true;});assert(!(await page.locator('#bg-notify-perm-warn').isVisible()));
  assert.equal(await page.locator('#psync-en').getAttribute('aria-describedby'),'psync-status-description');assert((await page.locator('#psync-status-description').textContent()).includes('离线消息提醒状态：'));
  await page.evaluate(()=>document.getElementById('row-general').click());await page.locator('#page-reply-settings [data-rp="chat"]').click();await page.locator('#page-reply-settings .rps-tab[data-rps="cards"]').click();
  const disabled=await page.evaluate(()=>window.mochiFeatures.disabledProbabilityKeys());
  assert.equal(await page.locator('#retired-probabilities > .gs-row').count(),disabled.length);
  assert.equal(await page.locator('#retired-probabilities').evaluate(e=>e.open),false);
  assert.equal(await page.locator('#dcf-prob-piggy-rs').evaluate(e=>!!e.closest('details')),false);
  const detailsBox=await page.locator('#retired-probabilities').evaluate(e=>e.closest('.set-group')===document.getElementById('dcf-prob-piggy-rs').closest('.set-group'));assert(detailsBox);
  await page.locator('#dcp-fun-expander-row').click(); await page.locator('#retired-probabilities > summary').click();assert(await page.locator('#dcf-prob-fish-rs').isVisible());assert(await page.locator('#dcf-prob-fish-rs .stp-max').isDisabled());
  await page.locator('#retired-probabilities > summary').click();
  const shots=process.env.MOCHI_SCREENSHOT_DIR;if(shots){await page.waitForFunction(()=>!document.getElementById('cc-toast')?.classList.contains('show'));fs.mkdirSync(shots,{recursive:true});await page.locator('#retired-probabilities').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'probabilities-'+width+'.png')});}
  await page.locator('#page-reply-settings [data-rp="other"]').click();
  assert.deepEqual(await page.locator('.invitation-group-title').allTextContents(),['猜拳','玩游戏','贴贴','分享你的字卡']);
  assert.equal(await page.locator('#fish-en,#work-en,#fish-grab-en,#ml-fish-week-en').count(),0);
  assert.equal(await page.locator('.invitation-fold').count(),4);
  assert(await page.locator('.invitation-fold').evaluateAll(all=>all.every(e=>!e.open&&e.closest('.set-group'))));
  if(shots){await page.locator('.invitation-fold').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'invitation-fold-closed-'+width+'.png')});}
  await page.locator('.invitation-fold[data-invitation="rps"] > summary').click();
  assert(await page.locator('#ai-rps-en').locator('..').isVisible());
  assert(await page.locator('[data-k="ai-rps-prob"]').isVisible());
  assert(!(await page.locator('#ai-game-en').locator('..').isVisible()));
  const first=page.locator('#ai-rps-en');const before=await first.isChecked();await first.locator('..').click();assert.notEqual(await first.isChecked(),before);await first.locator('..').click();
  const step=page.locator('[data-k="ai-rps-prob"]');const oldValue=await step.locator('input').inputValue();await step.locator('.stp-max').click();assert.notEqual(await page.evaluate(()=>window.activeStore().get('reply-ai-rps-prob')),oldValue);
  if(shots){await page.waitForFunction(()=>!document.getElementById('cc-toast')?.classList.contains('show'));await page.locator('#ai-rps-en').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'invitation-fold-open-'+width+'.png')});}
  await page.locator('.invitation-fold[data-invitation="rps"] > summary').click();
  assert(!(await page.locator('#ai-rps-en').locator('..').isVisible()));
  await page.locator('.invitation-fold[data-invitation="rps"] > summary').click();
  assert.equal(await page.evaluate(()=>window.activeStore().get('reply-ai-rps-prob')),'13');
  await page.locator('#page-reply-settings [data-rp="ck"]').click();assert((await page.locator('[data-rpanel="ck"] > .gs-title').first().textContent()).includes('TA主动查岗与概率'));
  assert.equal(await page.evaluate(()=>typeof window.fishWeekTick),'undefined');
  assert.equal(await page.evaluate(()=>localStorage.getItem('xy-home-v2:default:reply-fish-en')),'1');assert.equal(await page.evaluate(()=>typeof window.logUsageDay),'function');
  assert.deepEqual(errors,[]);console.log('PASS refinement: theme toggle/chooser, help alignment, disabled probability fold, invitation controls, warnings/status ownership, retired controls/mail removed, usage-day API and legacy values retained at '+width+'px');await page.close();
 }
 assert(!fs.readFileSync(path.join(root,'src/js/mail.js'),'utf8').includes('fishWeekTick'));
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});





