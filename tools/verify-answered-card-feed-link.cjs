const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});});
(async()=>{let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=process.env.MOCHI_ENGINE==='webkit'?await webkit.launch():await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p))});
for(const [width,height] of [[390,844],[360,640],[440,956]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:true,deviceScaleFactor:2,hasTouch:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 if(process.env.MOCHI_CPU_RATE&&process.env.MOCHI_ENGINE!=='webkit'){const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.MOCHI_CPU_RATE)});}
 await p.addLocatorHandler(p.locator('#tc-mask:visible'),async()=>{await p.evaluate(()=>document.getElementById('tc-mask-close').click());});await p.addLocatorHandler(p.locator('#qa-mask:visible'),async()=>{await p.evaluate(()=>document.getElementById('qa-mask-close').click());});
 await p.addInitScript(()=>{localStorage.setItem('xy-home-v2:cc-scope-migrated','1');localStorage.setItem('xy-home-v2:cc-scope-notice-done','1');localStorage.setItem('xy-home-v2:storage-guide-shown','1250');for(const pre of ['xy-home-v2','xy-home-v2:default']){localStorage.setItem(pre+':reply-as-en','0');localStorage.setItem(pre+':checkin-en','0');localStorage.setItem(pre+':cs-rp-ask-prob','0');localStorage.setItem(pre+':reply-ml-write-en','0');localStorage.setItem(pre+':reply-fd-post-en','0');for(const k of ['ta-ask','ta-choose','ta-curious','ta-roast','ta-checkin','ta-invite','ta-ask-card'])localStorage.setItem(pre+':'+k,JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));localStorage.setItem(pre+':interact-card-last',String(Date.now()));localStorage.setItem(pre+':ta-choose',JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));const now=new Date();localStorage.setItem(pre+':greeted-'+now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),'1');localStorage.setItem(pre+':__last-backup',String(Date.now()));localStorage.setItem(pre+':__last-backup-remind',String(Date.now()));}});
 await require('./startup-dialog-fixture.cjs')(p);await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.waitForFunction(()=>window.__mochiDataReady);



 // Use normal message creation after chat hydration, instead of replacing live storage during startup.
 await p.waitForFunction(()=>window.__chatDbReady?.());
 await p.evaluate(()=>{window.chatAddSystem('TA想问你一个问题。',{special:'ask-msg'});window.chatAddSystem('心情怎么样？',{special:'ask-card',askQuestion:'心情怎么样？',askStatus:'pending',askTs:Date.now()});});
 await p.waitForFunction(()=>document.querySelector('#chat-body .msg-ask-card'));
 await p.evaluate(()=>window.chatAskReply(window.getChatMsgs().findIndex(m=>m.special==='ask-card'&&m.askQuestion==='心情怎么样？'),'还行','收到'));

 assert.equal(await p.locator('#chat-body .msg-ask-card.answered').count(),1);assert((await p.locator('#chat-body .msg-ask-card').textContent()).includes('还行'));
 await p.evaluate(()=>{document.querySelector('#chat-body .msg-ask').remove();window.chatAddSystem('另一张问题',{special:'ask-card',askQuestion:'另一张问题',askStatus:'pending'});const all=window.getChatMsgs(),idx=all.length-1;document.querySelector('#chat-body .msg-ask:last-of-type')?.remove();window.chatAskReply(idx,'新的回答','新的回应',{raw:true});});
 assert(await p.locator('#chat-body .msg-ask-card.answered').filter({hasText:'新的回答'}).count());
 const posted=await p.evaluate(async()=>{const ts=new Date(2025,1,8,12).getTime();const posts=[{id:'historic-post',role:'ta',owner:'default',authorName:'TA',content:'精确定位测试动态',ts,likes:[],comments:[]},{id:'other-post',role:'ta',owner:'other',authorName:'另一位',content:'其他联系人动态',ts:Date.now(),likes:[],comments:[]}];const root=window.xyStore('xy-home-v2');root.set('feed-posts',JSON.stringify(posts));await window.idbSet('xy-home-v2:feed-posts',JSON.stringify(posts));window.chatAddSystem('TA 发布了一条朋友圈动态',{feedPostId:'historic-post',feedOwner:'default'});return window.getChatMsgs().at(-1).feedPostId;});assert.equal(posted,'historic-post');
 await p.locator('#chat-body .feed-notice').last().click();await p.waitForFunction(()=>document.querySelector('#feed-post-historic-post.feed-flash'));assert(await p.locator('#page-feed').isVisible());
 await p.locator('#feed-back').click();
 assert(await p.locator('#chat-body').isVisible(), 'Feed back returns to chat');
 await p.evaluate(()=>document.querySelector('.app[data-app="feed"]').click());
 assert(await p.locator('#page-feed').isVisible());
 assert.equal(await p.locator('.feed-flash').count(),0,'Home entry never retains flash');
 await p.locator('#feed-back').click();
 assert(await p.locator('#page-phone').isVisible(),'Home entry returns home');
 // Verify identities and answer content, not only the number of answered cards.
 const expectedCards=await p.evaluate(()=>window.getChatMsgs().filter(x=>x.special==='ask-card'&&x.askStatus==='answered').map(x=>({uid:x.uid,answer:x.askAnswer,reply:x.askReply})));
 assert.equal(expectedCards.length,2);assert(expectedCards.every(x=>x.uid));
 // Verify the application's own asynchronous persistence before navigating away.
 await p.waitForFunction(async(expected)=>{const raw=await window.idbGet(window.activePrefix()+':chat-msgs');const items=JSON.parse(raw||'[]');return expected.every(e=>items.some(x=>x.uid===e.uid&&x.askStatus==='answered'&&x.askAnswer===e.answer&&x.askReply===e.reply));},expectedCards);
 await p.reload();await p.waitForFunction(()=>window.__mochiDataReady&&window.__chatDbReady?.()&&typeof window.enterChat==='function');await p.evaluate(()=>window.enterChat());
 try{await p.waitForFunction(()=>document.querySelectorAll('#chat-body .msg-ask-card.answered').length>=2);}catch(e){console.log(await p.evaluate(async()=>({prefix:window.activePrefix(),dom:Array.from(document.querySelectorAll('#chat-body [data-idx]')).map(x=>({idx:x.dataset.idx,cls:x.className})),messages:window.getChatMsgs().map(x=>({special:x.special,status:x.askStatus,answer:x.askAnswer})),stored:JSON.parse(await window.idbGet(window.activePrefix()+':chat-msgs')||'[]').map(x=>({special:x.special,status:x.askStatus}))})));throw e;}
 assert((await p.locator('#chat-body .msg-ask-card.answered').count())>=2);assert(await p.evaluate(expected=>expected.every(e=>window.getChatMsgs().some(x=>x.uid===e.uid&&x.askStatus==='answered'&&x.askAnswer===e.answer&&x.askReply===e.reply)),expectedCards),'Reload must retain each answer and reply by message identity');await p.locator('#chat-body .feed-notice').last().click();await p.waitForFunction(()=>document.querySelector('#feed-post-historic-post.feed-flash'));assert.deepEqual(errors,[]);
 await p.locator('#feed-back').click();await p.evaluate(()=>{window.chatAppendDeskRec(window.__activeCid||'default',{side:'in',text:'测试好奇问题',ts:Date.now(),special:'ask-curious',curiousQuestion:'测试好奇问题',curiousQuick:['有','你猜'],curiousStatus:'pending'});const el=Array.from(document.querySelectorAll('#chat-body .msg-ask')).find(x=>x.textContent.includes('测试好奇问题'));el.dataset.idx='0';});
 const curious=p.locator('#chat-body .msg-ask').filter({hasText:'测试好奇问题'});await curious.locator('.msg-choose-card').click();assert(await curious.locator('.msg-inplace').count(),'Historical card resolves identity even when its index is stale');assert((await curious.locator('.msg-inplace').textContent()).includes('你猜'));
 console.log('PASS answered text cards survive missing nodes/reload and feed notice locates exact historic post at '+width);
 await p.close();
}
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
