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
   const st=window.activeStore(),root=window.xyStore('xy-home-v2');st.set('lbl-partner','月');st.set('lbl-user','Teresa');
   const image=color=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="'+color+'"/></svg>');
   const own=image('red'),ta=image('blue');st.set('cs-avatar-user',own);st.set('cs-avatar-partner',ta);
   const posts=[{id:'ta-post',role:'ta',owner:'default',authorName:'月',authorAv:ta,ts:1000,content:'这是月发出的朋友圈'}, {id:'my-post',role:'me',owner:'default',authorName:'Teresa',authorAv:own,ts:2000,content:'这是我发出的朋友圈'}];
   root.set('feed-posts',JSON.stringify(posts));await window.idbSet('xy-home-v2:feed-posts',JSON.stringify(posts));
   const list=[{kind:'feed',side:'out',by:'me',text:posts[0].content,ts:1000},{kind:'feed',by:'ta',text:posts[1].content,ts:2000},{kind:'feed',by:'me',text:'无法匹配作者的旧动态',ts:3000},{kind:'mail',by:'me',mailType:'received',text:'给你的信，愿今天一切顺利。',title:'深夜随想',ts:4000},{kind:'card',by:'me',special:'ask',q:'喜欢什么天气？',mine:'晴天',ta:'我也喜欢晴天',ts:5000},{kind:'msg',by:'me',side:'in',text:'一条聊天记录',ts:6000},{kind:'msg',type:'chat-group',id:'existing-group',by:'me',ts:7000,items:[{side:'in',text:'你好',ts:1},{side:'out',text:'你好呀',ts:2}]}];
   st.set('fav-msgs',JSON.stringify(list));await window.idbSet(window.activePrefix()+':fav-msgs',JSON.stringify(list));document.querySelector('.app[data-app="note"]').click();
 });
 const card=text=>p.locator('#fav-list > .fav-entry-card').filter({hasText:text});
 assert.equal(await p.locator('#fav-list > .fav-entry-card').count(),6);
 for(const c of await p.locator('#fav-list > .fav-entry-card').all())assert.equal(await c.locator(':scope > .fav-chat-group-heading').count(),1);
 assert.equal(await card('一条聊天记录').locator(':scope > .fav-entry-heading').textContent(),'聊天记录');
 assert.equal(await card('喜欢什么天气').locator(':scope > .fav-entry-heading').textContent(),'互动卡片');
 assert.equal(await card('深夜随想').locator(':scope > .fav-entry-heading').textContent(),'信件');
 assert.equal(await card('深夜随想').locator('.fav-mail-heading strong').textContent(),'月');
 assert.equal(await card('深夜随想').locator('.mail-paper-title').textContent(),'深夜随想');assert.equal(await card('深夜随想').locator('.fav-item-tag').count(),0);assert.match(await card('深夜随想').locator('.mail-paper-date').textContent(),/\d+月\d+日 \d{2}:\d{2}/);
 await p.evaluate(()=>{const st=window.activeStore();st.set('lbl-partner','');st.set('cs-lbl-partner','');const list=JSON.parse(st.get('fav-msgs'));list.find(f=>f.kind==='mail').senderName='默认';st.set('fav-msgs',JSON.stringify(list));window.renderFav();});assert.equal(await card('深夜随想').locator('.fav-mail-heading strong').textContent(),'TA');await p.evaluate(()=>{window.activeStore().set('lbl-partner','月');window.renderFav();});assert.equal(await card('深夜随想').locator('.fav-mail-heading strong').textContent(),'月');
 const taCard=card('这是月发出的朋友圈');assert.equal(await taCard.locator('.fav-feed-author').textContent(),'月');assert(await taCard.locator('.fav-entry-message').evaluate(e=>e.classList.contains('msg-in')));assert.equal(await taCard.locator('.fav-feed-avatar img').getAttribute('src'),await p.evaluate(()=>window.activeStore().get('cs-avatar-partner')));
 assert.equal(await taCard.locator('.fav-item-tag').count(),0);
 await p.locator('#fav-manage-btn').click();for(const c of await p.locator('#fav-list > .fav-entry-card').all()){const pos=await c.evaluate(e=>{const r=e.getBoundingClientRect(),ck=e.querySelector(':scope > .fav-check'),c=ck.getBoundingClientRect(),head=e.querySelector(':scope > .fav-chat-group-heading').getBoundingClientRect();return {first:e.firstElementChild===ck,center:(c.left+c.right)/2,cardCenter:(r.left+r.right)/2,bottom:c.bottom,headingTop:head.top};});assert(pos.first);assert(Math.abs(pos.center-pos.cardCenter)<2);assert(pos.bottom<=pos.headingTop+1);}await p.locator('#fav-batch-cancel').click();
 const unknown=card('无法匹配作者');assert.equal(await unknown.locator('.fav-feed-author').textContent(),'作者信息未记录');assert.equal(await unknown.locator('.fav-feed-avatar img').count(),0);
 await p.evaluate(()=>{window.activeStore().set('cs-avatar-user','data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>'));window.refreshChatAvatars();});assert((await taCard.locator('.fav-feed-avatar img').getAttribute('src')).includes('blue'));
 await p.locator('#fav-tab-ta').click();const mine=card('这是我发出的朋友圈');assert.equal(await mine.locator('.fav-feed-author').textContent(),'Teresa');assert(await mine.locator('.fav-entry-message').evaluate(e=>e.classList.contains('msg-out')));
 await p.locator('#fav-tab-mine').click();
 await p.evaluate(()=>{const f={kind:'feed',text:'这是月发出的朋友圈',ts:1000};window.__authorSnapshot=window.feedFavoriteAuthor(f);window.addMyFavItem(Object.assign({},f,{ts:1001},window.__authorSnapshot));window.renderFav();});
 const snapshot=await p.evaluate(()=>window.__authorSnapshot);assert.equal(snapshot.authorRole,'ta');assert.equal(snapshot.authorName,'月');assert.equal(snapshot.sourceId,'ta-post');
 const saved=await p.evaluate(()=>JSON.parse(window.activeStore().get('fav-msgs')).find(f=>f.sourceId==='ta-post'));assert.equal(saved.authorRole,'ta');assert(saved.collectedAt>0);
 await p.reload();await p.waitForFunction(()=>window.__mochiDataReady);await p.evaluate(()=>document.querySelector('.app[data-app="note"]').click());assert.equal(await card('深夜随想').locator('.fav-mail-heading strong').textContent(),'月');assert.equal(await card('这是月发出的朋友圈').locator('.fav-feed-author').first().textContent(),'月');
 if(process.env.MOCHI_SCREENSHOT_DIR){fs.mkdirSync(process.env.MOCHI_SCREENSHOT_DIR,{recursive:true});await p.evaluate(()=>{document.getElementById('cc-toast').style.visibility='hidden';});await card('深夜随想').screenshot({path:path.join(process.env.MOCHI_SCREENSHOT_DIR,'favorite-mail-'+width+'.png')});await card('这是月发出的朋友圈').first().screenshot({path:path.join(process.env.MOCHI_SCREENSHOT_DIR,'favorite-ta-feed-'+width+'.png')});}
 await p.evaluate(()=>{const st=window.activeStore();st.set('cs-lbl-partner','默认');st.set('lbl-partner','默认');window.renderFav();document.getElementById('fav-tab-ta').click();});assert((await p.locator('#fav-list .ccg-name').textContent()).includes('TA 的收藏'));assert.equal(await p.locator('#fav-tab-ta').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 // High-resolution legacy stickers must remain thumbnails, including grouped records and mail.
 await p.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;
   canvas.getContext('2d').fillRect(0,0,1200,800);const img=canvas.toDataURL();
   const sticker={kind:'msg',by:'me',side:'in',type:'sticker',text:img,parts:[{k:'img',v:img}],ts:9000};
   window.activeStore().set('fav-msgs',JSON.stringify([
     sticker,{...sticker,parts:undefined,ts:9001},
     {kind:'msg',by:'me',type:'chat-group',id:'media-group',ts:9002,items:[sticker,{...sticker,side:'out'}]},
     {kind:'mail',by:'me',mailType:'received',text:'信中的表情 '+img,title:'图片测试',ts:9003},
     {...sticker,type:'image',parts:[{k:'img',v:img,sub:'image'}],ts:9004}
   ]));document.getElementById('fav-tab-mine').click();window.renderFav();
 });
 await p.locator('#fav-list .msg-img,#fav-list .fav-item-img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));
 await p.waitForFunction(()=>[...document.querySelectorAll('#fav-list .msg-img,#fav-list .fav-item-img')].every(i=>i.complete&&i.naturalWidth>0));
 for(const selector of ['#fav-list .msg-img:not(.msg-img-big)','#fav-list .fav-mail-paper .fav-item-img']){
   assert(await p.locator(selector).count()>0);
   for(const img of await p.locator(selector).all()){
     const box=await img.boundingBox();assert(box.width<=100.5&&box.height<=100.5,JSON.stringify(box));
     assert(Math.abs(box.width/box.height-1.5)<.05,'Preserve sticker aspect ratio');
   }
 }
 assert.equal(await p.locator('#fav-list .msg-img-big').count(),1,'Explicit photos retain photo rendering');
 const fonts=await p.evaluate(()=>({system:getComputedStyle(document.querySelector('#page-setting [data-sec="system"] .gs-row')).fontSize,chat:getComputedStyle(document.querySelector('#page-chat-settings .cs-options .set-row .txt')).fontSize}));
 assert.equal(fonts.system,'14px');assert.equal(fonts.chat,'14px');
 assert.deepEqual(errors,[]);console.log('PASS favorite identity, high-resolution sticker sizing, photo distinction and settings fonts at '+width);await p.close();
}
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
