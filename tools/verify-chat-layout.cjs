const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createServer}=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=createServer((req,res)=>{
 const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(f,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});
});
(async()=>{let browser;
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const executable=process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
 browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 for(const width of [360,390,440]){
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'});
  // Quiet fixtures in a disposable browser context; leave production defaults untouched.
  await page.addInitScript(()=>{
    for(const prefix of ['xy-home-v2','xy-home-v2:default']){
      localStorage.setItem(prefix+':reply-as-en','0');
      localStorage.setItem(prefix+':reply-dcp-all','0');
      localStorage.setItem(prefix+':__last-backup',String(Date.now()));
      localStorage.setItem(prefix+':__last-backup-remind',String(Date.now()));
    }
    localStorage.setItem('xy-home-v2:desk-checkin-en','0');
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/js/chat-settings-layout.js',async route=>{
   const source=fs.readFileSync(path.join(root,'js/chat-settings-layout.js'),'utf8');
   await route.fulfill({contentType:'application/javascript',body:`window.__layoutOriginalRows=Array.from(document.querySelectorAll('#page-chat-settings .set-row')).map(n=>({id:n.id,hidden:n.hidden,node:n}));\n`+source});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>window.__mochiDataReady&&window.mochiChatSettingsLayout);
  await page.evaluate(()=>document.querySelector('.app[data-app="chat"]').click());
  await page.locator('#chat-settings-btn').click();
  await page.waitForFunction(()=>!document.getElementById('page-chat-settings').hidden);
  const initial=await page.evaluate(()=>{
    const api=window.mochiChatSettingsLayout,p=document.getElementById('page-chat-settings');
    return {before:api.originalIds,after:api.currentIds(),titles:[...p.querySelectorAll('.cs-options-group > summary')].map(x=>x.textContent),open:[...p.querySelectorAll('.cs-options-group')].map(x=>x.open),rows:window.__layoutOriginalRows.map(x=>({same:document.getElementById(x.id)===x.node,hidden:x.hidden===x.node.hidden,group:x.node.closest('.cs-options-group')?.dataset.csGroup})),oldTabs:getComputedStyle(document.getElementById('cs-tabs')).display,errors:window.__mochiErrLoaded||[]};
  });
  assert.deepEqual(initial.after,initial.before);assert(initial.rows.every(x=>x.same&&x.hidden&&x.group));
  assert.deepEqual(initial.titles,['名称与头像','显示与阅读','输入与操作','数据与更多']);
  assert.deepEqual(initial.open,[true,true,false,false]);assert.equal(initial.oldTabs,'none');assert.equal(initial.errors.length,0);
  if(process.env.MOCHI_SCREENSHOT_DIR){fs.mkdirSync(process.env.MOCHI_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.MOCHI_SCREENSHOT_DIR,'chat-settings-'+width+'.png')});}
  // Help is a separate action; it must not launch avatar upload or alter settings.
  if(process.env.MOCHI_SCREENSHOT_DIR){
   await page.locator('[data-cs-group="display"] > summary').click();
   await page.screenshot({path:path.join(process.env.MOCHI_SCREENSHOT_DIR,'chat-settings-overview-'+width+'.png')});
   await page.locator('[data-cs-group="display"] > summary').click();
  }
  let picked=false;page.on('filechooser',()=>{picked=true;});
  await page.locator('#cs-avatar-partner .cs-layout-info').click();
  await page.waitForFunction(()=>document.querySelector('.cs-layout-help').open);
  assert((await page.locator('.cs-layout-help-body').textContent()).includes('头像'));
  await page.getByRole('button',{name:'关闭功能说明',exact:true}).click();assert.equal(picked,false);
  // Preserve the existing live-adjust drawer and its return to the display group.
  await page.locator('#cs-live-adjust').click();
  await page.waitForFunction(()=>{const d=document.getElementById('chat-beauty-drawer');return d&&getComputedStyle(d).display!=='none';});
  await page.locator('#chat-beauty-drawer button').filter({hasText:'✕'}).click();
  await page.waitForFunction(()=>!document.getElementById('page-chat-settings').hidden);
  assert(await page.locator('[data-cs-group="display"]').evaluate(x=>x.open));
  // An original toggle remains live after moving its existing node.
  await page.locator('[data-cs-group="input"] > summary').click();
  const old=await page.locator('#cs-enter-send').isChecked();
  await page.locator('#cs-enter-send-row .toggle').click();
  assert.notEqual(await page.locator('#cs-enter-send').isChecked(),old);
  assert.equal(await page.evaluate(()=>window.activeStore().get('cs-enter-send')),old?'off':'on');
  // Explicitly requested original profile edit still opens the original editor.
  await page.evaluate(()=>{window.__profileModal='';const original=window.openModal;window.openModal=function(title,...args){window.__profileModal=title;return original.call(this,title,...args);};});
  await page.locator('#cs-lbl-partner').click();
  assert((await page.evaluate(()=>window.__profileModal)).includes('昵称'));
  // Close only the disposable test page's modal before navigation checks.
  await page.evaluate(()=>{const mask=document.querySelector('.modal-mask');if(mask){mask.hidden=true;mask.style.display='none';}});
  const available=await page.evaluate(()=>{
    const api=window.mochiChatSettingsLayout;
    api.revealRow('cs-clear-msgs');
    const data=document.querySelector('[data-cs-group="data"]');
    const result={open:data.open,buttons:['cs-export-msgs','cs-import-msgs','cs-export-all','cs-import-all','cs-clear-msgs'].every(id=>!!data.querySelector('#'+id))};
    document.querySelector('#cs-tabs [data-tab="beautify"]').click();
    result.drawerReturn=document.querySelector('[data-cs-group="display"]').open;
    document.querySelectorAll('.cs-options-group').forEach(x=>x.open=true);
    const scroller=document.querySelector('.cs-options');scroller.scrollTop=scroller.scrollHeight;
    result.scroll=scroller.scrollTop>0;
    result.overflow=scroller.scrollWidth>scroller.clientWidth+1;
    document.documentElement.setAttribute('data-theme','dark');
    result.dark=getComputedStyle(data).backgroundColor;
    return result;
  });
  assert(available.open&&available.buttons&&available.drawerReturn&&available.scroll);assert.equal(available.overflow,false);assert.notEqual(available.dark,'rgb(255, 255, 255)');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS grouped chat settings, original controls/IDs, conditional visibility, help, toggle persistence, profile editing, data entries, scrolling and dark mode at '+width+'px');
  await page.close();
 }
}finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
