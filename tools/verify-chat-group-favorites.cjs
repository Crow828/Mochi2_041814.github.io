const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});});
(async()=>{let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p))});
for(const width of [360,390,440]){
 const p=await browser.newPage({viewport:{width,height:844},hasTouch:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addLocatorHandler(p.locator('#tc-mask:visible'),async()=>{await p.evaluate(()=>document.getElementById('tc-mask-close').click());});await p.addLocatorHandler(p.locator('#qa-mask:visible'),async()=>{await p.evaluate(()=>document.getElementById('qa-mask-close').click());});
 await p.addInitScript(()=>{localStorage.setItem('xy-home-v2:storage-guide-shown','1250');for(const pre of ['xy-home-v2','xy-home-v2:default']){localStorage.setItem(pre+':reply-as-en','0');for(const k of ['ta-ask','ta-choose','ta-curious','ta-roast','ta-checkin','ta-invite','ta-ask-card'])localStorage.setItem(pre+':'+k,JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));localStorage.setItem(pre+':interact-card-last',String(Date.now()));localStorage.setItem(pre+':ta-choose',JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));const now=new Date();localStorage.setItem(pre+':greeted-'+now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),'1');localStorage.setItem(pre+':__last-backup',String(Date.now()));localStorage.setItem(pre+':__last-backup-remind',String(Date.now()));}});
 await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.waitForFunction(()=>window.__mochiDataReady);
 await p.addLocatorHandler(p.locator('#modal-mask:visible').filter({hasNotText:/收藏备注|删除选中的/}),async()=>{console.log('Dismiss unrelated fixture notice:',await p.locator('#modal-mask .modal-title').textContent());await p.evaluate(()=>document.getElementById('modal-cancel').click());});
 await p.evaluate(async()=>{
   const moods=[{tag:'多字卡回复',label:'在图书馆，路上注意安全'},{tag:'情绪',label:'宠溺'},{tag:'心意',label:'想到你，也希望你一路平安，回家后可以一起好好休息'}];
   const items=[{side:'in',text:'在图书馆，路上注意安全',type:'text',mood:moods,ts:Date.now()-3000},{side:'out',text:'嗯，知道啦',type:'text',ts:Date.now()-2000},{side:'in',text:'信你一次，下不为例。这是一条比较长的聊天消息，用来检查收藏里的文字与情绪字卡能否保持清楚的上下排版。',type:'text',mood:moods,ts:Date.now()-1000}];
   window.activeStore().set('chat-msgs',JSON.stringify(items));await window.idbSet(window.activePrefix()+':chat-msgs',JSON.stringify(items));
   const old=[{kind:'mail',side:'in',text:'原有信件收藏',ts:1234,by:'me'},{side:'out',text:'TA原有收藏',ts:1235,by:'ta'}];
   window.activeStore().set('fav-msgs',JSON.stringify(old));await window.idbSet(window.activePrefix()+':fav-msgs',JSON.stringify(old));
   window.enterChat();
 });
 await p.waitForFunction(()=>Array.from(document.querySelectorAll('#chat-body .msg-bubble')).some(x=>x.textContent.includes('路上注意安全')));
 const row=(text)=>p.locator('#chat-body .msg[data-mk]').filter({hasText:text}).first();
 await row('路上注意安全').locator('.msg-bubble').tap();await p.locator('#msg-actions [data-act="multi"]').tap();
 assert.equal(await p.locator('.chat-fav-check[aria-checked="true"]').count(),1);
 await row('嗯，知道啦').tap();assert.equal(await p.locator('.chat-fav-check[aria-checked="true"]').count(),2);
 const barBox=await p.locator('#chat-fav-selection').boundingBox();assert(barBox&&barBox.y+barBox.height<=845);assert.equal(await p.locator('#page-chat > .chat-input-row').isVisible(),false);
 if(process.env.MOCHI_SCREENSHOT_DIR){fs.mkdirSync(process.env.MOCHI_SCREENSHOT_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.MOCHI_SCREENSHOT_DIR,'chat-selection-'+width+'.png')});}
 // Incoming messages / DOM append do not discard the checked identities.
 await p.evaluate(()=>window.chatAppendDeskRec(window.__activeCid||'default',{side:'in',type:'text',text:'新增消息不影响勾选',ts:Date.now()}));
 assert.equal(await p.locator('.chat-fav-check[aria-checked="true"]').count(),2);
 await p.locator('[data-cfs="save"]').click();await p.waitForFunction(()=>JSON.parse(window.activeStore().get('fav-msgs')).some(f=>f.items?.length===2));
 let values=await p.evaluate(()=>JSON.parse(window.activeStore().get('fav-msgs'))),group=values.find(f=>f.items);
 assert.deepEqual(group.items.map(f=>f.side),['in','out']);assert.deepEqual(group.items.map(f=>f.text),['在图书馆，路上注意安全','嗯，知道啦']);assert(values.some(f=>f.text==='原有信件收藏'));
 assert(group.collectedAt>group.items[0].ts);const collectedAt=group.collectedAt;
 await p.evaluate(()=>document.querySelector('.app[data-app="note"]').click());
 assert.equal(await p.locator('#fav-list .fav-chat-group').count(),1);assert.equal(await p.locator('.fav-chat-group-content > .msg').count(),2);
 assert.match(await p.locator('.fav-chat-group .fav-saved-time').textContent(),/^收藏于 \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
 const moodLayout=await p.locator('.fav-chat-group .msg-moods').evaluate(e=>{const b=e.parentElement.getBoundingClientRect(),r=e.getBoundingClientRect(),text=e.previousElementSibling.getBoundingClientRect();return {top:r.top,textBottom:text.bottom,right:r.right,bubbleRight:b.right,scroll:e.scrollWidth,width:e.clientWidth};});assert(moodLayout.top>=moodLayout.textBottom);assert(moodLayout.right<=moodLayout.bubbleRight+1);assert(moodLayout.scroll<=moodLayout.width+1);
 await p.locator('.fav-chat-group .fav-note-button').click();
 const input=p.locator('#modal-textarea:visible,.ce-box[data-for="modal-textarea"]:visible').first();await input.fill('一起珍藏的片段\n<b>保持原样</b>');
 await p.locator('#modal-ok').click();await p.waitForFunction(()=>document.querySelector('.fav-chat-group .fav-note')?.textContent.includes('一起珍藏'));
 assert.equal(await p.evaluate(()=>JSON.parse(window.activeStore().get('fav-msgs')).find(f=>f.items).collectedAt),collectedAt);
 assert.equal(await p.locator('.fav-note b').count(),0);
 const noteOffset=await p.locator('.fav-chat-group').evaluate(e=>e.querySelector('.fav-note').getBoundingClientRect().left-e.getBoundingClientRect().left);assert(noteOffset>=0&&noteOffset<=2);
 const footerStyle=await p.locator('.fav-chat-group .fav-entry-footer').evaluate(e=>({height:e.getBoundingClientRect().height,color:getComputedStyle(e.querySelector('.fav-note')).color,scroll:e.scrollWidth,width:e.clientWidth}));assert.equal(footerStyle.color,'rgb(170, 170, 170)');assert(footerStyle.height<85);assert(footerStyle.scroll<=footerStyle.width+1);
 const layout=await p.locator('.fav-chat-group').evaluate(e=>{const r=e.getBoundingClientRect(),n=e.querySelector('.fav-note').getBoundingClientRect();return {right:r.right,noteRight:n.right,noteBottom:n.bottom,bottom:r.bottom};});assert(layout.right<=width);assert(layout.noteRight<=layout.right+1);assert(layout.noteBottom<=layout.bottom+1);
 await p.evaluate(()=>{document.querySelector('#fav-kind-tabs [data-kind="msg"]').click();});assert.equal(await p.locator('.fav-chat-group').count(),1);assert.equal(await p.locator('#fav-list').getByText('原有信件收藏',{exact:true}).count(),0);
 if(process.env.MOCHI_SCREENSHOT_DIR){fs.mkdirSync(process.env.MOCHI_SCREENSHOT_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.MOCHI_SCREENSHOT_DIR,'group-favorite-'+width+'.png')});}
 await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));assert.notEqual(await p.locator('.fav-chat-group').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');await p.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));
 // A single selection keeps the original single bubble, with its own note entry.
 await p.evaluate(()=>window.enterChat());await row('下不为例').locator('.msg-bubble').tap();await p.locator('#msg-actions [data-act="multi"]').waitFor({state:'visible'});await p.locator('#msg-actions [data-act="multi"]').tap();await p.locator('[data-cfs="save"]').click();
 await p.evaluate(()=>document.querySelector('.app[data-app="note"]').click());assert.equal(await p.locator('.fav-chat-group').count(),1);assert.equal(await p.locator('#fav-list > .msg:not(.fav-chat-group)').count(),1);
 assert.equal(await p.locator('#fav-list > .fav-entry-card').count(),2);assert(await p.locator('#fav-list > .fav-entry-card:not(.fav-chat-group) .msg-moods').count());
 for(const card of await p.locator('#fav-list > .fav-entry-card').all()){const info=await card.evaluate(e=>{const r=e.getBoundingClientRect(),f=e.querySelector('.fav-saved-time').getBoundingClientRect();return {right:r.right,footerRight:f.right,bottom:r.bottom,footerBottom:f.bottom,overflow:e.scrollWidth>e.clientWidth+1,border:getComputedStyle(e).borderStyle};});assert.equal(info.border,'solid');assert(!info.overflow);assert(info.footerRight<=info.right&&info.footerBottom<=info.bottom);}
 await p.locator('#fav-list > .msg:not(.fav-chat-group) .fav-note-button').click();await input.fill('单条备注');await p.locator('#modal-ok').click();
 if(process.env.MOCHI_SCREENSHOT_DIR){await p.screenshot({path:path.join(process.env.MOCHI_SCREENSHOT_DIR,'single-favorite-'+width+'.png')});}
 await p.reload();await p.waitForFunction(()=>window.__mochiDataReady);await p.evaluate(()=>document.querySelector('.app[data-app="note"]').click());assert((await p.locator('#fav-list').textContent()).includes('单条备注'));assert((await p.locator('#fav-list').textContent()).includes('一起珍藏'));
 // Note editing applies to existing non-chat favorites too.
 await p.locator('#fav-kind-tabs [data-kind="all"]').click();await p.locator('#fav-list > .msg').filter({hasText:'原有信件收藏'}).locator('.fav-note-button').click();await input.fill('旧信件的备注');await p.locator('#modal-ok').click();
 assert((await p.locator('#fav-list').textContent()).includes('旧信件的备注'));
 assert((await p.locator('#fav-list > .fav-entry-card').filter({hasText:'原有信件收藏'}).locator('.fav-saved-time').textContent()).startsWith('原记录时间'));
 await p.locator('#fav-tab-ta').click();assert((await p.locator('#fav-list').textContent()).includes('TA原有收藏'));assert.equal(await p.locator('#fav-list .fav-note-button').count(),1);
 await p.locator('#fav-tab-mine').click();
 // Existing batch delete treats a group as one unit and retains the other favorites.
 await p.locator('#fav-manage-btn').click();await p.locator('.fav-chat-group').click();await p.locator('#fav-batch-del').click();await p.locator('#modal-ok').click();assert.equal(await p.locator('.fav-chat-group').count(),0);
 values=await p.evaluate(()=>JSON.parse(window.activeStore().get('fav-msgs')));assert(values.some(f=>f.text==='原有信件收藏'));assert(values.some(f=>f.note==='单条备注'));assert(values.some(f=>f.by==='ta'));
 await p.evaluate(()=>window.enterChat());await row('下不为例').locator('.msg-bubble').tap();await p.locator('#msg-actions [data-act="multi"]').waitFor({state:'visible'});await p.locator('#msg-actions [data-act="multi"]').tap();await p.locator('[data-cfs="cancel"]').click();assert.equal(await p.locator('.chat-fav-check').count(),0);
 await row('下不为例').locator('.msg-bubble').tap();await p.locator('#msg-actions [data-act="multi"]').waitFor({state:'visible'});await p.locator('#msg-actions [data-act="multi"]').tap();await p.evaluate(()=>{window.setActiveContact(window.createContact('隔离测试'));});assert(await p.locator('#chat-fav-selection').evaluate(e=>e.hidden));assert.equal(await p.evaluate(()=>JSON.parse(window.activeStore().get('fav-msgs')||'[]').length),0);
 assert.deepEqual(errors,[]);console.log('PASS grouped and single favorites, both speakers, notes, persistence, filters, existing entries, cancel and batch delete at '+width);await p.close();
}
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
