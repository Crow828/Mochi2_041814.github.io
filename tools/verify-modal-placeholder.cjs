const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});});
(async()=>{let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p))});
for(const [width,height] of [[390,844],[360,640],[440,956]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:true,deviceScaleFactor:2,hasTouch:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addLocatorHandler(p.locator('#tc-mask:visible'),async()=>{await p.evaluate(()=>document.getElementById('tc-mask-close').click());});await p.addLocatorHandler(p.locator('#qa-mask:visible'),async()=>{await p.evaluate(()=>document.getElementById('qa-mask-close').click());});
 await p.addInitScript(()=>{localStorage.setItem('xy-home-v2:storage-guide-shown','1250');for(const pre of ['xy-home-v2','xy-home-v2:default']){localStorage.setItem(pre+':reply-as-en','0');for(const k of ['ta-ask','ta-choose','ta-curious','ta-roast','ta-checkin','ta-invite','ta-ask-card'])localStorage.setItem(pre+':'+k,JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));localStorage.setItem(pre+':interact-card-last',String(Date.now()));localStorage.setItem(pre+':ta-choose',JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));const now=new Date();localStorage.setItem(pre+':greeted-'+now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),'1');localStorage.setItem(pre+':__last-backup',String(Date.now()));localStorage.setItem(pre+':__last-backup-remind',String(Date.now()));}});
 await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.waitForFunction(()=>window.__mochiDataReady);


 await p.evaluate(()=>window.openModal('位置调整','',()=>{}, {placeholder:'左右,上下 例：8,-4'}));
 assert.equal(await p.locator('#modal-input').getAttribute('placeholder'),'左右,上下 例：8,-4');
 await p.locator('#modal-cancel').click();
 await p.evaluate(()=>window.openModal('编辑备注','',()=>{}));
 assert.equal(await p.locator('#modal-input').getAttribute('placeholder'),'输入内容');
 const proxy=p.locator('.ce-box[data-for="modal-input"]');if(await proxy.count())assert.equal(await proxy.getAttribute('data-ph'),'输入内容');
 await p.locator('#modal-cancel').click();
 await p.evaluate(()=>window.openModal('不显示提示','',()=>{}, {placeholder:''}));assert.equal(await p.locator('#modal-input').getAttribute('placeholder'),'');await p.locator('#modal-cancel').click();
 await p.evaluate(()=>{window.openModal('自定义提示','',()=>{}).ph('新的专属提示');});assert.equal(await p.locator('#modal-input').getAttribute('placeholder'),'新的专属提示');await p.locator('#modal-cancel').click();
 console.log('PASS modal placeholder reset, explicit empty hint and controller override at '+width);
 await p.close();
}
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
