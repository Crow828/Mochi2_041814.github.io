const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'};
const server=createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(data);});});
(async()=>{
 let browser;
 try {
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const options={headless:true};
 const executable = process.env.CHROME_PATH || ['/usr/bin/google-chrome','/usr/bin/chromium','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
 if(executable)options.executablePath=executable;
 browser=await chromium.launch(options);
 for(const width of [390,440]){
 const page=await browser.newPage({viewport:{width,height:956},serviceWorkers:'block'});
 await page.addInitScript(()=>{window.__sfxContexts=0;const Base=window.AudioContext||window.webkitAudioContext;if(Base){const Wrapped=new Proxy(Base,{construct(target,args,newTarget){if(new Error().stack.includes('/js/sfx.js'))window.__sfxContexts++;return Reflect.construct(target,args,newTarget)}});if(window.AudioContext)window.AudioContext=Wrapped;if(window.webkitAudioContext)window.webkitAudioContext=Wrapped;}});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.waitForFunction(()=>window.__mochiDataReady && window.dcfGet && window.mochiFeatureData,{},{timeout:30000}).catch(async()=>{await page.waitForFunction(()=>window.__mochiDataReady && window.dcfGet,{},{timeout:30000});});
 await page.waitForTimeout(700);
 await page.evaluate(()=>document.querySelector('.tabbar [data-page="page-setting"]').click());
 assert.equal(await page.evaluate(()=>window.__sfxContexts),0,'Silent defaults must not initialize Web Audio on tab clicks');
 await page.evaluate(()=>{window.activeStore().set('sfx-in-b','ding');document.querySelector('.tabbar [data-page="page-setting"]').click();});
 assert.equal(await page.evaluate(()=>window.__sfxContexts),1,'Configured sounds must still initialize Web Audio on a gesture');
 await page.evaluate(()=>{window.activeStore().remove('sfx-in-b');document.querySelector('.tabbar [data-page="page-phone"]').click();});
 console.log('PASS silent/default and configured sound initialization at '+width+'px');
 // Seed a small private library in this disposable browser context.
 await page.evaluate(()=>{window.xyStore('xy-home-v2').set('cc-groups-public',JSON.stringify({text:[['public-test',['one','two']]]}));window.activeStore().set('cc-groups',JSON.stringify({text:[['own-test',['three']]]}));document.querySelector('.tabbar [data-page="page-chatcard"]').click();});
 await page.waitForFunction(()=>document.getElementById('cc-pub-count').textContent==='2'&&document.getElementById('cc-list-count').textContent==='1');
 const repeated=await page.evaluate(async()=>{const page=document.getElementById('page-chatcard');let count=0;const mo=new MutationObserver(rows=>count+=rows.length);mo.observe(page,{attributes:true,attributeFilter:['hidden']});document.querySelector('.tabbar [data-page="page-chatcard"]').click();await Promise.resolve();mo.disconnect();return count;});
 assert.equal(repeated,0,'Repeated tab clicks must not hide/reopen the current page');
 await page.evaluate(()=>{for(const id of ['page-setting','page-chatcard','page-setting','page-phone'])document.querySelector('.tabbar [data-page="'+id+'"]').click();});
 await page.waitForTimeout(150);
 assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('.page')).filter(p=>!p.hidden).map(p=>p.id)),['page-phone'],'Rapid tab clicks must leave only the last page visible');
 console.log('PASS bottom navigation and deferred library counts at '+width+'px');
 // Check the native scroll path without touching saved user data.
 const cdp=await page.context().newCDPSession(page);
 async function blockers(){const obj=await cdp.send('Runtime.evaluate',{expression:"document.getElementById('desktop-pages')"});const r=await cdp.send('DOMDebugger.getEventListeners',{objectId:obj.result.objectId});return r.listeners.filter(l=>['touchstart','touchmove'].includes(l.type)&&!l.passive).length;}
 assert.equal(await blockers(),0,'Ordinary desktop must not block touch scrolling');
 await page.evaluate(()=>document.getElementById('decor-edit-layout').click());
 assert.equal(await blockers(),2,'Editing must retain native touch guards');
 assert(await page.evaluate(()=>{const e=new Event('touchmove',{bubbles:true,cancelable:true});document.querySelector('#desktop-pages .app').dispatchEvent(e);return e.defaultPrevented;}),'Editing must capture app dragging');
 await page.evaluate(()=>window.exitDecor());
 assert.equal(await blockers(),0,'Exiting editing must release native scrolling');
 assert.equal(await page.evaluate(()=>{const e=new Event('touchmove',{bubbles:true,cancelable:true});document.querySelector('#desktop-pages .app').dispatchEvent(e);return e.defaultPrevented;}),false);
 await page.evaluate(()=>{const el=document.getElementById('desktop-pages');el.dispatchEvent(new Event('touchstart'));});
 for(let n=0;n<4;n++){await page.waitForTimeout(70);await page.evaluate(()=>document.getElementById('desktop-pages').dispatchEvent(new Event('scroll')));assert(await page.evaluate(()=>document.getElementById('desktop-pages').classList.contains('swipe-warm')));}
 await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>document.getElementById('desktop-pages').classList.contains('swipe-warm')),false,'Idle must release compositor hint');
 await page.evaluate(()=>document.querySelector('.tabbar [data-page="page-setting"]').click());
 const scrolling=await page.evaluate(()=>{const e=document.getElementById('page-setting');e.scrollTop=e.scrollHeight;return {top:e.scrollTop,overflow:e.scrollHeight>e.clientHeight}});
 assert(scrolling.overflow&&scrolling.top>0,'Settings must remain vertically scrollable');
 await page.evaluate(()=>{document.getElementById('page-setting').scrollTop=0;document.querySelector('.tabbar [data-page="page-phone"]').click();});
 console.log('PASS scroll guards, edit mode and settings scroll at '+width+'px');
 const data=await page.evaluate(()=>{
 const disabled=['garden','cjian','sync','reach','room','water','pomo','fish','drift'];
 const st=window.activeStore();
 const old=st.get('dcf-piggy');st.set('dcf-piggy','65');const piggy=window.dcfGet('piggy');if(old==null)st.remove('dcf-piggy');else st.set('dcf-piggy',old);
 const rows=Array.from(document.querySelectorAll('#dcp-fun-box .stepper')).map(e=>({key:e.dataset.dcfkey,value:e.querySelector('.stp-val').value,locked:Array.from(e.querySelectorAll('button')).every(b=>b.disabled)}));
 const owner=(key,cid='default')=>{const f=window.mochiFeatureData.featureOfKey(key,cid);return f?f.id:null};
 document.getElementById('row-feature-data').click();
 const renderedData=Array.from(document.querySelectorAll('.fd-row[data-fid]')).map(e=>e.dataset.fid);
 return {renderedData,ownership:[owner('xy-home-v2:default:chat-msgs'),owner('xy-home-v2:default:period-records'),owner('xy-home-v2:default:memo-app-items'),owner('xy-home-v2:default:music-file:sample','c123456'),owner('xy-home-v2:c123456:chat-msgs'),owner('xy-home-v2:media:sample'),owner('xy-home-v2:font-blob-sample')],dataIds:window.mochiFeatureData.features.map(f=>f.id), settings:['row-entry-cjian-first','row-fish-days'].filter(id=>document.getElementById(id)),pages:document.querySelectorAll('#desktop-pages .page-slide').length,splash:!!document.getElementById('splash'),apps:Array.from(document.querySelectorAll('.app-grid.p2-grid .app')).map(e=>e.dataset.app),optional:!!document.querySelector('#desktop-pages [data-desk-widget="memo-row"],#desktop-pages [data-desk-widget="desk-period"]'),disabled:disabled.map(k=>window.dcfGet(k)),piggy,rows,errors:window.__mochiErrLoaded||[],retiredMenus:['more-cjian','more-room','more-drift'].filter(id=>document.getElementById(id)),chat:!!document.getElementById('page-chat'),input:!!document.querySelector('.chat-input')};});
 assert.deepEqual(data.ownership,['chat','period','memo','music',null,null,null]);assert.deepEqual(data.renderedData.slice().sort(),data.dataIds.slice().sort());assert.equal(data.settings.length,0);assert(data.dataIds.includes('period')&&data.dataIds.includes('memo'));for(const id of ["fish","tongpin","shenshou","water","piggy","pomo","garden","cjian","myarc","room","drift","accounting"])assert(!data.dataIds.includes(id),'Hidden data category: '+id);assert.equal(data.retiredMenus.length,0);for(const id of ['garden','cjian','tongpin','shenshou','room','water','piggy','pomo','accounting','memo-arc','my-arc'])assert(!data.apps.includes(id),'Retired desktop entry: '+id);assert.equal(data.pages,2);assert.equal(data.splash,false);assert(data.apps.includes('period')&&data.apps.includes('memo'));assert.equal(data.optional,false);assert(data.disabled.every(v=>v===0));assert.equal(data.piggy,65);assert.equal(data.errors.length,0);assert(data.chat&&data.input);
 let retired=false;for(const row of data.rows){if(['garden','cjian','sync','reach','room','water','pomo','fish','drift'].includes(row.key)){retired=true;assert.equal(row.value,'—');assert(row.locked);}else assert(!retired,'Active category placed after retired category');}
 const piggyRow=data.rows.find(r=>r.key==='piggy');assert.equal(piggyRow.value,'—');assert(piggyRow.locked);

 const removal=await page.evaluate(()=>{
  const global=window.xyStore('xy-home-v2'),local=window.activeStore();
  const days=window.mochiUsageDays;
  global.set('fish-log',JSON.stringify(['2026-01-02','2026-01-02','bad']));
  window.xyStore('xy-home-v2:default').set('fish-log',JSON.stringify(['2026-01-03']));
  local.set('fish-total','123');local.set('work-total','456');
  local.set('garden-data','KEEP_GARDEN');local.set('room-data','KEEP_ROOM');local.set('drift-log','KEEP_DRIFT');
  const rid='legacy-roster';local.set('cjian-roster',JSON.stringify([{id:rid,name:'保留梦角',offsetMin:90,cid:window.__activeCid||'default'}]));
  global.set('narc-'+rid,JSON.stringify({who:{f:{nick:'保留昵称'}},dreams:[],custom:'KEEP_ARCHIVE'}));
  days.migrate(false);days.log();days.log();
  const dates=days.dates();
  document.dispatchEvent(new Event('mochi-restore-done'));
  window.openNarc();
  return {dates,today:days.today(),score:[local.get('fish-total'),local.get('work-total')],saved:[local.get('garden-data'),local.get('room-data'),local.get('drift-log')],archive:JSON.parse(global.get('narc-'+rid)).custom,
  archiveText:document.getElementById('narc-root').textContent,
  removedPages:['page-garden','page-room','page-drift','page-cjian','page-tongpin','page-shenshou','page-pomo','page-pomodoro','page-pmp-chat'].filter(id=>document.getElementById(id)),
  removedModules:['garden.js','room.js','drift-bottle.js','cjian.js'].filter(id=>window.__mochiJsFiles.includes(id)),
  scoreGenerators:[typeof window.addFishPts,typeof window.addWorkPts,typeof window.pomoFocusActive],
  kept:[!!document.getElementById('page-eat'),!!document.getElementById('page-piggy'),typeof window.giftWalletChange],errors:window.__mochiErrLoaded||[]};
 });
 assert.deepEqual(removal.removedPages,[]);assert.deepEqual(removal.removedModules,[]);
 assert.deepEqual(removal.scoreGenerators,['undefined','undefined','undefined']);
 assert.deepEqual(removal.dates,['2026-01-02','2026-01-03',removal.today]);
 assert.deepEqual(removal.score,['123','456']);assert.deepEqual(removal.saved,['KEEP_GARDEN','KEEP_ROOM','KEEP_DRIFT']);
 assert.equal(removal.archive,'KEEP_ARCHIVE');assert(removal.archiveText.includes('保留梦角'));
 assert.deepEqual(removal.kept,[true,true,'function']);assert.equal(removal.errors.length,0);

 const membership=await page.evaluate(()=>{
   const original=window.openModal;let callback;
   const controller={};for(const key of ['stay','title','hint','input','pills','maxLen','ph','okText'])controller[key]=()=>{};
   window.openModal=(title,value,cb)=>{callback=cb;return controller;};
   try{
    const st=window.xyStore('xy-home-v2:'+ (window.__activeCid||'default')),g=window.xyStore('xy-home-v2');
    const foreign=window.xyStore('xy-home-v2:other-roster');foreign.set('cjian-roster','[]');
    const open=()=>document.getElementById('narc-manage').click();
    open();callback('add');callback('新成员');
    let list=JSON.parse(st.get('cjian-roster'));const added=list.find(x=>x.name==='新成员');
    if(!added)throw Error('Member not added');
    g.set('narc-'+added.id,JSON.stringify({saved:'ARCHIVE_TO_KEEP'}));
    open();callback('rename');callback(added.id);callback('新名称');
    list=JSON.parse(st.get('cjian-roster'));const renamed=list.find(x=>x.id===added.id).name;
    open();callback('remove');callback(added.id);callback('yes');
    list=JSON.parse(st.get('cjian-roster'));
    return {renamed,removed:!list.some(x=>x.id===added.id),oldOffset:list.find(x=>x.id==='legacy-roster').offsetMin,archive:g.get('narc-'+added.id),foreign:foreign.get('cjian-roster')};
   }finally{window.openModal=original;}
 });
 assert.equal(membership.renamed,'新名称');assert(membership.removed);assert.equal(membership.oldOffset,90);assert.equal(JSON.parse(membership.archive).saved,'ARCHIVE_TO_KEEP');assert.equal(membership.foreign,'[]');
 console.log('PASS retired modules absent, independent usage days, legacy data and shared wallet/archive retained at '+width+'px');
 console.log('PASS personal desktop and probability behavior at '+width+'px');await page.close();
 }
 // Restore one feature only in an isolated browser context, without changing project files.
 const context=await browser.newContext({viewport:{width:440,height:956},serviceWorkers:'block'});
 const restored=await context.newPage();
 const url='http://127.0.0.1:'+server.address().port+'/';
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const enabledHtml=html.replace(/(water: \{[^\n]*?)enabled: false, probability: 'disabled'/, "$1enabled: true, probability: 'editable'");
 assert.notEqual(enabledHtml,html,'Water policy must exist in built page');
 const settingsHtml=enabledHtml;
 await restored.route(url,route=>route.fulfill({status:200,contentType:'text/html',body:settingsHtml}));
 await restored.goto(url);
 await restored.waitForFunction(()=>window.__mochiDataReady && window.dcfGet);
 await restored.waitForTimeout(700);
 const enabled=await restored.evaluate(()=>({settings:['row-entry-cjian-first','row-fish-days'].every(id=>!document.getElementById(id)),data:window.mochiFeatureData.features.some(f=>f.id==='water'),icon:!!document.querySelector('.app[data-app="water"]'),value:document.getElementById('dcf-prob-water-rs-val').value,button:document.querySelector('#dcf-prob-water-rs button').disabled,errors:window.__mochiErrLoaded||[]}));
 assert(enabled.settings);assert(enabled.data);assert(enabled.icon);assert.notEqual(enabled.value,'—');assert.equal(enabled.button,false);assert.equal(enabled.errors.length,0);
 await context.close();console.log('PASS isolated water re-enable: desktop entry and probability controls restored');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
