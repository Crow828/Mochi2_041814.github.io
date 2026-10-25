const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});});
(async()=>{let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p))});
for(const [width,height] of [[390,844],[360,640],[440,956]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:true,deviceScaleFactor:2,hasTouch:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addLocatorHandler(p.locator('#tc-mask:visible'),async()=>{await p.evaluate(()=>document.getElementById('tc-mask-close').click());});await p.addLocatorHandler(p.locator('#qa-mask:visible'),async()=>{await p.evaluate(()=>document.getElementById('qa-mask-close').click());});
 await p.addInitScript(()=>{localStorage.setItem('xy-home-v2:storage-guide-shown','1250');for(const pre of ['xy-home-v2','xy-home-v2:default']){localStorage.setItem(pre+':reply-as-en','0');for(const k of ['ta-ask','ta-choose','ta-curious','ta-roast','ta-checkin','ta-invite','ta-ask-card'])localStorage.setItem(pre+':'+k,JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));localStorage.setItem(pre+':interact-card-last',String(Date.now()));localStorage.setItem(pre+':ta-choose',JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));const now=new Date();localStorage.setItem(pre+':greeted-'+now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),'1');localStorage.setItem(pre+':__last-backup',String(Date.now()));localStorage.setItem(pre+':__last-backup-remind',String(Date.now()));}});
 await require('./startup-dialog-fixture.cjs')(p);await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.waitForFunction(()=>window.__mochiDataReady);



 await p.evaluate(async()=>{const items=[{side:'in',text:'这是普通气泡',ts:Date.now()-60000},{side:'in',special:'poke',text:'TA想问你一个问题',ts:Date.now()}];window.activeStore().set('chat-msgs',JSON.stringify(items));await window.idbSet(window.activePrefix()+':chat-msgs',JSON.stringify(items));window.enterChat();});
 await p.locator('#chat-settings-btn').click();
 const original=await p.evaluate(()=>getComputedStyle(document.querySelector('#chat-body .msg-bubble')).fontSize);
 for(const [id,value,selector] of [['cs-time-font-size',16,'#chat-body .msg-time'],['cs-notice-font-size',19,'#chat-body .msg-poke']]){
 await p.locator('#'+id).click();await p.locator('#modal-slider-range').fill(String(value));await p.locator('#modal-ok').click();
 assert.equal(await p.locator(selector).first().evaluate(e=>getComputedStyle(e).fontSize),value+'px');assert.equal(await p.evaluate(k=>window.activeStore().get(k),id),String(value));
 }
 assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('#chat-body .msg-bubble')).fontSize),original);
 await p.locator('#cs-notice-font-size').click();await p.locator('#modal-slider-range').fill('22');await p.locator('#modal-cancel').click();assert.equal(await p.locator('#chat-body .msg-poke').evaluate(e=>getComputedStyle(e).fontSize),'19px');
 await p.reload();await p.waitForFunction(()=>window.__mochiDataReady);await p.evaluate(()=>window.enterChat());await p.locator('#chat-settings-btn').click();
 assert.equal(await p.locator('#cs-time-font-size-val').textContent(),'16px');assert.equal(await p.locator('#cs-notice-font-size-val').textContent(),'19px');
 if(process.env.MOCHI_SCREENSHOT_DIR && width===390)await p.locator('#cs-time-font-size').locator('..').screenshot({path:'outputs/chat-aux-font-preview.png'});
 for(const [id,value] of [['cs-time-font-size',10],['cs-notice-font-size',12]]){await p.locator('#'+id).click();await p.locator('#modal-pills .pill').click();await p.locator('#modal-ok').click();assert.equal(await p.evaluate(k=>window.activeStore().get(k),id),null);assert.equal(await p.locator('#'+id+'-val').textContent(),'默认 '+value+'px');}
 console.log('PASS independent auxiliary sizes, save/reload, cancel, default restore and bubble unchanged at '+width);
 await p.close();
}
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
