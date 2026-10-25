const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p))});
 for(const width of [360,390,440]){
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   for(const prefix of ['xy-home-v2','xy-home-v2:default']){localStorage.setItem(prefix+':reply-as-en','0');localStorage.setItem(prefix+':reply-dcp-all','0');localStorage.setItem(prefix+':__last-backup',String(Date.now()));localStorage.setItem(prefix+':__last-backup-remind',String(Date.now()));}
   localStorage.setItem('xy-home-v2:cc-scope-migrated','1');localStorage.setItem('xy-home-v2:cc-scope-notice-done','1');localStorage.setItem('xy-home-v2:storage-guide-shown','1250');localStorage.setItem('xy-home-v2:desk-checkin-en','0');
  });
  await page.route('**/js/card-library-layout.js',route=>route.fulfill({contentType:'application/javascript',body:`window.__libraryBefore=[...document.querySelectorAll('#page-chatcard [id]')].map(e=>({id:e.id,node:e}));window.__libraryEntries=[...document.querySelectorAll('#page-chatcard .chat-item')];\n`+fs.readFileSync(path.join(root,'js/card-library-layout.js'),'utf8')}));
  await require('./startup-dialog-fixture.cjs')(page);await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.__mochiDataReady&&window.mochiCardLibraryLayout);
  assert(await page.evaluate(()=>window.__libraryBefore.every(x=>document.getElementById(x.id)===x.node)&&window.__libraryEntries.every(e=>e.closest('.cc-library-group'))));
  assert.deepEqual(await page.locator('#cc-sect-custom .cc-library-group-title').allTextContents(),['聊天字卡','互动功能','日常展示','TA 的互动','数据管理']);
  assert.deepEqual(await page.locator('#cc-sect-preset .cc-library-group-title').allTextContents(),['聊天与回应','日常展示','TA 的互动']);
  assert.equal(await page.locator('#cc-sect-custom .chat-item').count(),14);assert.equal(await page.locator('#cc-sect-preset .chat-item').count(),16);
  assert((await page.locator('#li-deskcheck').locator('..').locator('h3').textContent()).includes('TA 的互动'));
  await page.evaluate(()=>{window.xyStore('xy-home-v2').set('cc-groups-public',JSON.stringify({text:[['library-public',['分类测试公用字卡']]]}));window.activeStore().set('cc-lowcard-remind',new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')+'-'+String(new Date().getDate()).padStart(2,'0'));window.activeStore().set('cc-groups',JSON.stringify({text:[['library-own',['分类测试专属字卡']]]}));document.querySelector('.tabbar [data-page="page-chatcard"]').click();});
  await page.waitForFunction(()=>document.getElementById('cc-pub-count').textContent.trim()==='1');
  const shots=process.env.MOCHI_SCREENSHOT_DIR;if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,'library-custom-'+width+'.png')});}
  for(const [id,text] of [['li-custom-cards-public','分类测试公用字卡'],['li-custom-cards','分类测试专属字卡']]){
   await page.locator('#'+id).click();await page.waitForFunction(()=>!document.getElementById('page-custom-cards').hidden);await page.waitForFunction(text=>document.getElementById('cc-list').textContent.includes(text),text);await page.locator('#cc-back').click();
  }
  const search=page.locator('.ce-box[data-for="chatcard-search"]');await search.fill('分类测试公用字卡');await page.waitForFunction(()=>document.querySelector('.cc-search-result').textContent.includes('分类测试公用字卡'));assert(!(await page.locator('#cc-sect-custom').isVisible()));await search.fill('');await page.waitForFunction(()=>!document.getElementById('cc-sect-custom').hidden);
  await page.locator('.cc-top-tabs [data-ccsect="preset"]').click();assert(await page.locator('#cc-sect-preset').isVisible());assert(!(await page.locator('#cc-sect-custom').isVisible()));
  const sum=await page.evaluate(()=>{window.__ccRenderTabTotals();return [...document.querySelectorAll('#cc-sect-preset .chat-item .t')].reduce((n,e)=>n+(parseInt(e.textContent.replace(/[^\d]/g,''),10)||0),0);});
  assert.equal(Number(await page.locator('.cc-top-tabs [data-ccsect="preset"] .cc-tab-n').textContent()),sum);
  assert(await page.locator('#cc-sect-preset .cc-library-group').evaluateAll(all=>all.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;})));
  if(shots)await page.screenshot({path:path.join(shots,'library-preset-'+width+'.png')});
  await page.locator('#li-deskcheck').click();assert(await page.locator('#page-deskcheck').isVisible());await page.evaluate(()=>document.querySelector('.tabbar [data-page="page-chatcard"]').click());
  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));assert.notEqual(await page.locator('#cc-sect-preset .cc-library-group').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  if(shots)await page.screenshot({path:path.join(shots,'library-dark-'+width+'.png')});
  assert.equal(await page.evaluate(()=>JSON.parse(window.xyStore('xy-home-v2').get('cc-groups-public')).text[0][1][0]),'分类测试公用字卡');assert.deepEqual(errors,[]);
  console.log('PASS library groups: existing nodes/IDs, all 30 entries, public/private navigation, card search, counts, cross-desktop entry, dark mode and saved card contents at '+width+'px');await page.close();
 }
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});





