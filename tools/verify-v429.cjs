const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=process.env.MOCHI_ENGINE==='webkit'?await webkit.launch():await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(f=>fs.existsSync(f))});
 for(const width of [360,390,440]){
 const p=await browser.newPage({viewport:{width,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await require('./quiet-startup-fixture.cjs')(p);await require('./startup-dialog-fixture.cjs')(p);
 await p.addInitScript(()=>{for(const pre of ['xy-home-v2','xy-home-v2:default']){for(const k of ['reply-as-en','checkin-en','reply-ml-write-en'])localStorage.setItem(pre+':'+k,'0');localStorage.setItem(pre+':cs-rp-ask-prob','0');for(const k of ['ta-ask','ta-choose','ta-curious','ta-roast','ta-invite','ta-ask-card'])localStorage.setItem(pre+':'+k,JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));}localStorage.setItem('xy-home-v2:theme-palette','wine');});
 await p.goto('http://127.0.0.1:'+server.address().port+'/');
 await p.waitForFunction(()=>window.__mochiDataReady&&!document.getElementById('page-chat').hidden);
 await p.waitForFunction(()=>window.__chatDbReady&&window.__chatDbReady());
 assert.equal(await p.evaluate(async()=> (await (await fetch('version.json')).json()).release),'v4.2.9');
 await p.evaluate(()=>window.chatAddSystem('测试问题',{special:'ask-card',askQuestion:'今天好吗？',askStatus:'pending'}));
 await p.locator('#chat-body .msg-ask-card').last().click();
 await p.waitForFunction(()=>document.activeElement.classList.contains('ip-input'));
 const inp=p.locator('#chat-body .ip-input').last();await inp.fill('你好');await inp.focus();
 await inp.evaluate(e=>{window.__v429Input=e;e.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));});
 await p.evaluate(()=>{window.enterChat();window.chatAddSystem('输入时收到的新消息');});
 assert(await inp.evaluate(e=>e===window.__v429Input&&document.activeElement===e),'input identity/focus retained');
 await inp.dispatchEvent('keydown',{key:'Enter',isComposing:true,keyCode:229});assert.equal(await p.locator('.msg-ask-card.answered').count(),0);
 await inp.dispatchEvent('compositionend');await inp.press('Enter');
 await p.waitForFunction(()=>!!document.querySelector('.msg-ask-card.answered')).catch(async e=>{console.log('ANSWER DIAGNOSTIC',await p.evaluate(()=>({msgs:window.getChatMsgs(),active:document.activeElement?.outerHTML,body:document.getElementById('chat-body').textContent})));throw e;});
 await p.evaluate(()=>window.chatAddSystem('草稿测试',{special:'ask-card',askQuestion:'保留未发送草稿？',askStatus:'pending'}));
 // Switch before the card's delayed autofocus fires, in one task so CPU speed cannot hide the race.
 await p.evaluate(()=>{document.querySelectorAll('#chat-body .msg-ask-card').item(document.querySelectorAll('#chat-body .msg-ask-card').length-1).click();const answer=document.querySelector('#chat-body .msg-ask:last-of-type .ip-input')||[...document.querySelectorAll('#chat-body .ip-input')].at(-1);answer.value='保留草稿';answer.dispatchEvent(new Event('input',{bubbles:true}));answer.focus();window.enterChat();document.getElementById('chat-input').focus();});await p.waitForTimeout(180);
 assert.equal(await p.evaluate(()=>document.activeElement.id),'chat-input','restoring an unfocused answer draft must not steal keyboard focus');
 assert.equal(await p.locator('#chat-body .ip-input').last().inputValue(),'保留草稿');
 await p.evaluate(()=>{document.querySelectorAll('.page').forEach(e=>e.hidden=true);document.getElementById('page-reply-settings').hidden=false;});
 const nav=await p.locator('#page-reply-settings > .fav-tabs > .fav-tab.sel').evaluate(e=>{const s=getComputedStyle(e);return {size:s.fontSize,bg:s.backgroundColor,underline:s.borderBottomColor,color:s.color};});assert.equal(nav.size,'24.5px');assert.equal(nav.underline,nav.color);assert.equal(nav.bg,'rgba(0, 0, 0, 0)');
 const subnav=await p.locator('#page-reply-settings .rps-tab.sel').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,ink:getComputedStyle(e).color}));assert.equal(subnav.bg,'rgb(133, 60, 74)');assert.equal(subnav.ink,'rgb(255, 255, 255)');
 await p.evaluate(()=>{const s=window.activeStore();const letter={id:'test-letter',type:'received',content:'原信',tm:123456,myReply:{content:'我的回信',tm:123457},partnerReply:{content:'TA后来的回信',tm:123458}};s.set('mail-letters',JSON.stringify([letter]));window.addMyFavItem({kind:'mail',text:'原信',ts:123456,mailType:'received'});document.querySelectorAll('.page').forEach(e=>e.hidden=true);document.getElementById('page-fav').hidden=false;window.renderFav();});
 await p.waitForFunction(()=>document.getElementById('fav-list').textContent.includes('TA后来的回信'));assert((await p.locator('#fav-list').textContent()).includes('我的回信'));
 await p.evaluate(()=>{window.enterChat();document.getElementById('poke-card').hidden=false;});
 await p.locator('#poke-ta-use-mine').uncheck();assert.equal(await p.evaluate(()=>window.activeStore().get('poke-ta-use-mine')),'0');
 await p.reload();await p.waitForFunction(()=>window.__mochiDataReady&&!document.getElementById('page-chat').hidden);assert.equal(await p.locator('#poke-ta-use-mine').isChecked(),false);
 await p.evaluate(()=>{const s=window.activeStore(),now=new Date(),older=new Date(now.getFullYear(),now.getMonth(),2,12).getTime(),previous=new Date(now.getFullYear(),now.getMonth()-1,2,12).getTime();s.set('giftbox-items',JSON.stringify([{id:'today-gift',side:'in',name:'今天礼物',tm:Date.now(),price:1},{id:'older-gift',side:'in',name:'本月礼物',tm:older,price:2},{id:'previous-gift',side:'in',name:'上月礼物',tm:previous,price:3}]));document.getElementById('more-giftbox').click();});
 const geometry=await p.locator('#giftbox-list').evaluate(e=>{const r=e.getBoundingClientRect(),months=[...e.querySelectorAll(':scope > details')].map(n=>{const b=n.getBoundingClientRect();return {x:b.x,width:b.width,y:b.y,bg:getComputedStyle(n).backgroundColor};}),card=e.querySelector(':scope > .giftbox-card').getBoundingClientRect(),del=getComputedStyle(e.querySelector('.hist-del'));return {width:r.width,months,cardBottom:card.bottom,deleteBg:del.backgroundColor,deleteInk:del.color};});
 assert.equal(geometry.months.length,2);for(const m of geometry.months){assert(Math.abs(m.width-geometry.width)<2);assert(m.y>=geometry.cardBottom);assert.equal(m.bg,'rgb(255, 255, 255)');}assert.equal(geometry.months[0].x,geometry.months[1].x);assert.equal(geometry.deleteInk,'rgb(255, 255, 255)');assert.equal(geometry.deleteBg,'rgb(201, 71, 83)');
 assert.deepEqual(errors,[]);console.log('PASS v4.2.9 default chat startup, version, inline composition/node identity, replies in old favorites, reply navigation and saved poke permission at '+width);await p.close();
 }
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
