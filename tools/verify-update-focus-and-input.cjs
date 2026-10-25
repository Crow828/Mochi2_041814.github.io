const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');const {chromium,webkit}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(process.env.MOCHI_FOCUS_BEFORE&&f.endsWith('index.html')?b.toString().replace('active===previous&&',''):b);});});

(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=process.env.MOCHI_ENGINE==='webkit'?await webkit.launch():await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p))});
 const p=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
 await p.addInitScript(()=>{localStorage.setItem('xy-home-v2:cc-scope-notice-done','1');for(const pre of ['xy-home-v2','xy-home-v2:default']){localStorage.setItem(pre+':checkin-en','0');localStorage.setItem(pre+':reply-as-en','0');for(const k of ['ta-ask','ta-choose','ta-curious','ta-roast','ta-invite','ta-ask-card'])localStorage.setItem(pre+':'+k,JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));}});
 await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.locator('[data-update-later]').click();await p.waitForFunction(()=>typeof window.enterChat==='function');await p.evaluate(()=>window.enterChat());
 await p.locator('#chat-input').fill('中文草稿');
 await p.evaluate(()=>{
  const dialog=document.getElementById('startup-update-dialog');dialog.__mochiPreviousFocus=document.activeElement;dialog.showModal();dialog.close();
  const other=document.createElement('div');other.contentEditable='true';other.textContent='另一处草稿';other.id='focus-review-other';document.body.append(other);other.focus();
 });
 await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>document.activeElement.id),'focus-review-other','closing update dialog must not blur an unrelated field');
 console.log('PASS closing version dialog does not blur a newly focused field');
 await p.locator('#chat-input').fill('中文草稿');const outBefore=await p.evaluate(()=>window.getChatMsgs().filter(m=>m.side==='out').length);
 await p.locator('#chat-more-btn').click();await p.locator('#more-tabs .more-tab[data-mcat="tool"]').click();await p.locator('#more-ime-reset').click();assert.equal(await p.locator('#chat-input').textContent(),'中文草稿');
 assert.equal(await p.evaluate(()=>window.getChatMsgs().filter(m=>m.side==='out').length),outBefore);
 await p.locator('#chat-input').dispatchEvent('keydown',{key:'Enter',isComposing:true,keyCode:229});assert.equal(await p.evaluate(()=>window.getChatMsgs().filter(m=>m.side==='out').length),outBefore);
 await p.locator('#chat-input').press('Enter');await p.waitForFunction(n=>window.getChatMsgs().filter(m=>m.side==='out').length===n+1,outBefore);assert.equal(await p.locator('#chat-input').textContent(),'');
 console.log('PASS IME restart retains draft, composing Enter does not send, normal Enter sends once and clears');
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
