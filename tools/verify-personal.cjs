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
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.waitForFunction(()=>window.__mochiDataReady && window.dcfGet && window.mochiFeatureData,{},{timeout:30000}).catch(async()=>{await page.waitForFunction(()=>window.__mochiDataReady && window.dcfGet,{},{timeout:30000});});
 await page.waitForTimeout(700);
 const data=await page.evaluate(()=>{
 const disabled=['garden','cjian','sync','reach','room','water','pomo','fish','drift'];
 const st=window.activeStore();
 const old=st.get('dcf-piggy');st.set('dcf-piggy','65');const piggy=window.dcfGet('piggy');if(old==null)st.remove('dcf-piggy');else st.set('dcf-piggy',old);
 const rows=Array.from(document.querySelectorAll('#dcp-fun-box .stepper')).map(e=>({key:e.dataset.dcfkey,value:e.querySelector('.stp-val').value,locked:Array.from(e.querySelectorAll('button')).every(b=>b.disabled)}));
 return {pages:document.querySelectorAll('#desktop-pages .page-slide').length,splash:!!document.getElementById('splash'),apps:Array.from(document.querySelectorAll('.app-grid.p2-grid .app')).map(e=>e.dataset.app),optional:!!document.querySelector('#desktop-pages [data-desk-widget="memo-row"],#desktop-pages [data-desk-widget="desk-period"]'),disabled:disabled.map(k=>window.dcfGet(k)),piggy,rows,errors:window.__mochiErrLoaded||[],retiredMenus:['more-cjian','more-room','more-drift'].filter(id=>document.getElementById(id)),chat:!!document.getElementById('page-chat'),input:!!document.querySelector('.chat-input')};});
 assert.equal(data.retiredMenus.length,0);for(const id of ['garden','cjian','tongpin','shenshou','room','water','piggy','pomo','accounting','memo-arc','my-arc'])assert(!data.apps.includes(id),'Retired desktop entry: '+id);assert.equal(data.pages,2);assert.equal(data.splash,false);assert(data.apps.includes('period')&&data.apps.includes('memo'));assert.equal(data.optional,false);assert(data.disabled.every(v=>v===0));assert.equal(data.piggy,65);assert.equal(data.errors.length,0);assert(data.chat&&data.input);
 let retired=false;for(const row of data.rows){if(['garden','cjian','sync','reach','room','water','pomo','fish','drift'].includes(row.key)){retired=true;assert.equal(row.value,'—');assert(row.locked);}else assert(!retired,'Active category placed after retired category');}
 const piggyRow=data.rows.find(r=>r.key==='piggy');assert.equal(piggyRow.value,'—');assert(piggyRow.locked);
 console.log('PASS personal desktop and probability behavior at '+width+'px');await page.close();
 }
 // Restore one feature only in an isolated browser context, without changing project files.
 const context=await browser.newContext({viewport:{width:440,height:956},serviceWorkers:'block'});
 const restored=await context.newPage();
 const url='http://127.0.0.1:'+server.address().port+'/';
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const enabledHtml=html.replace(/water: \{ enabled: false, probability: 'disabled'/, "water: { enabled: true, probability: 'editable'");
 assert.notEqual(enabledHtml,html,'Water policy must exist in built page');
 await restored.route(url,route=>route.fulfill({status:200,contentType:'text/html',body:enabledHtml}));
 await restored.goto(url);
 await restored.waitForFunction(()=>window.__mochiDataReady && window.dcfGet);
 await restored.waitForTimeout(700);
 const enabled=await restored.evaluate(()=>({icon:!!document.querySelector('.app[data-app="water"]'),value:document.getElementById('dcf-prob-water-rs-val').value,button:document.querySelector('#dcf-prob-water-rs button').disabled,errors:window.__mochiErrLoaded||[]}));
 assert(enabled.icon);assert.notEqual(enabled.value,'—');assert.equal(enabled.button,false);assert.equal(enabled.errors.length,0);
 await context.close();console.log('PASS isolated water re-enable: desktop entry and probability controls restored');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
