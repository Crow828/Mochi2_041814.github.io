const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createServer}=require('node:http');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(f,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});});
function quiet(){
 for(const prefix of ['xy-home-v2','xy-home-v2:default']){
  localStorage.setItem(prefix+':reply-as-en','0');localStorage.setItem(prefix+':reply-dcp-all','0');
  localStorage.setItem(prefix+':__last-backup',String(Date.now()));
  localStorage.setItem(prefix+':fullscreen-enabled','1');localStorage.setItem(prefix+':fullscreen-fallback','1');
 }
 localStorage.setItem('xy-home-v2:desk-checkin-en','0');
 window.__appFullscreenRequests=0;
 Element.prototype.requestFullscreen=function(){window.__appFullscreenRequests++;return Promise.resolve();};
}
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const executable=process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
 browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 const url='http://127.0.0.1:'+server.address().port+'/';
 for(const width of [360,390,440]){
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(quiet);
  await page.route('**/js/settings-layout.js',route=>route.fulfill({contentType:'application/javascript',body:`window.__beforeSettingsMove={lock:document.getElementById('applock-en'),track:document.getElementById('sf-checkin-en'),ids:Array.from(document.querySelectorAll('#page-setting [id]')).map(x=>x.id).sort()};\n`+fs.readFileSync(path.join(root,'js/settings-layout.js'),'utf8')}));
  await page.goto(url);await page.waitForFunction(()=>window.__mochiDataReady&&window.mochiSettingsLayout);
  await page.evaluate(()=>document.querySelector('.tabbar [data-page="page-setting"]').click());
  const state=await page.evaluate(()=>{
   const p=document.getElementById('page-setting'),groups=[...p.querySelectorAll(':scope>.them-sec>.set-group')];
   return {ids:[...p.querySelectorAll('[id]')].map(x=>x.id).sort(),before:window.__beforeSettingsMove.ids,
    same:window.__beforeSettingsMove.lock===document.getElementById('applock-en')&&window.__beforeSettingsMove.track===document.getElementById('sf-checkin-en'),
    lock:document.getElementById('applock-en').closest('.them-sec').dataset.sec,
    track:document.getElementById('sf-checkin-en').closest('.them-sec').dataset.sec,
    divine:document.getElementById('row-open-divination').closest('.them-sec').dataset.sec,
    headings:groups.map(g=>g.querySelector(':scope>.settings-group-title')?.textContent.trim()),
    backup:document.getElementById('row-export').closest('.set-group').querySelector('.settings-group-title').textContent,
    oldHelp:[...p.querySelectorAll('.tag')].filter(x=>x.textContent.trim()==='功能说明').length,
    infos:[...p.querySelectorAll('.settings-info')].map(x=>({text:x.textContent,label:x.getAttribute('aria-label')})),
    full:['sf-fullscreen','sf-fullscreen-row','cs-fullscreen','cs-fs-group','row-faq-fullscreen'].filter(id=>document.getElementById(id)),
    flags:['fs-active','fs-css-active','ios-fs-active'].filter(x=>document.documentElement.classList.contains(x)),requests:window.__appFullscreenRequests,
    errors:window.__mochiErrLoaded||[]};
  });
  assert.deepEqual(state.ids,state.before.concat(['row-update-notes','settings-update-group']).sort());assert(state.same);assert.equal(state.lock,'tools');assert.equal(state.track,'basic');assert.equal(state.divine,'basic');
  assert(state.headings.length>10&&state.headings.every(Boolean));assert.equal(state.backup,'数据备份与恢复');assert.equal(state.oldHelp,0);assert(state.infos.length>20&&state.infos.every(x=>x.text==='i'&&x.label));
  assert.deepEqual(state.full,[]);assert.deepEqual(state.flags,[]);assert.equal(state.requests,0);assert.equal(state.errors.length,0);
  if(process.env.MOCHI_SCREENSHOT_DIR){fs.mkdirSync(process.env.MOCHI_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.MOCHI_SCREENSHOT_DIR,'settings-general-'+width+'.png')});}
  // Info retains the original description action and must not trigger data export.
  await page.evaluate(()=>{window.__exportCalled=0;window.runBackupExport=()=>window.__exportCalled++;});
  await page.locator('#row-export .settings-info').click();
  assert((await page.locator('#modal-title').textContent()).includes('导出数据'));assert.equal(await page.evaluate(()=>window.__exportCalled),0);
  await page.locator('#modal-cancel').click();
  await page.locator('#set-tabs [data-tab="tools"]').click();
  assert(await page.locator('#applock-en').locator('..').isVisible());
  const oldLock=await page.evaluate(()=>({en:window.xyStore('xy-home-v2').get('applock-en'),pin:window.xyStore('xy-home-v2').get('applock-pin')}));
  await page.locator('#applock-en').locator('..').click();
  await page.waitForFunction(()=>!document.getElementById('applock-mask').hidden);
  assert((await page.locator('#applock-mask').textContent()).includes('设置解锁密码'));
  await page.locator('#applock-mask [data-link="cancel"]').click();
  assert.deepEqual(await page.evaluate(()=>({en:window.xyStore('xy-home-v2').get('applock-en'),pin:window.xyStore('xy-home-v2').get('applock-pin')})),oldLock);
  if(process.env.MOCHI_SCREENSHOT_DIR){await page.waitForFunction(()=>!document.getElementById('cc-toast')?.classList.contains('show'));await page.locator('#applock-en').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.MOCHI_SCREENSHOT_DIR,'settings-tools-'+width+'.png')});}
  await page.locator('#set-tabs [data-tab="basic"]').click();
  await page.locator('#sf-checkin-en').scrollIntoViewIfNeeded();
  const oldCheckin=await page.locator('#sf-checkin-en').isChecked();
  await page.locator('#sf-checkin-en').locator('..').click();
  assert.notEqual(await page.locator('#sf-checkin-en').isChecked(),oldCheckin);
  assert.equal(await page.evaluate(()=>window.activeStore().get('checkin-en')),oldCheckin?'0':'1');
  await page.locator('#set-search-input,.ce-box[data-for="set-search-input"]').filter({visible:true}).first().click();
  const search=(await page.locator('.ce-box[data-for="set-search-input"]').count())?page.locator('.ce-box[data-for="set-search-input"]'):page.locator('#set-search-input');
  await search.fill('应用锁');
  await page.waitForFunction(()=>!document.getElementById('applock-en').closest('.them-sec').hidden,{},{timeout:3000});
  assert(await page.locator('#applock-en').locator('..').isVisible());
  await search.fill('');
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#page-setting .tag,#page-chat-settings .tag,#page-theme .tag,#page-reply-settings .tag,#page-call-settings .tag,#page-sfx-settings .tag')].filter(x=>x.textContent.trim()==='功能说明').length),0);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS settings headings, i help, moved daily/divination, app-lock setup/cancel, preserved controls, fullscreen removal and saved toggle at '+width+'px');
  await page.close();
 }
 const ios=await browser.newPage({viewport:{width:440,height:956},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0_1 like Mac OS X) AppleWebKit/605.1.15 Version/27.0 Mobile/15E148 Safari/604.1',isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await ios.addInitScript(quiet);await ios.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
 await ios.goto(url);await ios.waitForFunction(()=>window.__mochiDataReady&&window.mochiSettingsLayout);
 const safe=await ios.evaluate(()=>({isIOS:window.mochiDevice.isIOS,pwa:document.documentElement.classList.contains('ios-pwa-standalone'),topRule:[...document.querySelectorAll('style')].some(x=>x.textContent.includes('padding-top: max(env(safe-area-inset-top, 0px), var(--mochi-safe-top, 0px)) !important')),requests:window.__appFullscreenRequests}));
 // Chromium UA emulation does not emulate WebKit CSS feature support. Check the
 // preserved iOS marker/rule here; actual safe-area rendering needs the user's iPhone.
 assert(safe.isIOS&&safe.pwa&&safe.topRule);assert.equal(safe.requests,0);console.log('PASS iOS standalone identification and original top safe-area CSS retained; no app fullscreen request');await ios.close();
}finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
