const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(b);});});

(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p))});
 for(const mode of ['missing-marker','shared-content']){
  const own=JSON.stringify({text:[['专属',['专属卡'+(mode==='shared-content'?'甲'.repeat(240000):'')]]],emoji:[],image:[],poke:[],sticker:[],voice:[],kaomoji:[],mjfree:[]});
  const pub=mode==='shared-content'?own:JSON.stringify({text:[['公用',['公用卡']]],emoji:[],image:[],poke:[],sticker:[],voice:[],kaomoji:[],mjfree:[]});
  const p=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  await p.addInitScript(({own,pub,mode})=>{
   localStorage.setItem('xy-home-v2:default:cc-groups',own);localStorage.setItem('xy-home-v2:cc-groups-public',pub);localStorage.setItem('xy-home-v2:cc-scope-notice-done','1');
   if(mode==='shared-content')localStorage.setItem('xy-home-v2:cc-scope-migrated','1');
   for(const pre of ['xy-home-v2','xy-home-v2:default']){localStorage.setItem(pre+':checkin-en','0');localStorage.setItem(pre+':reply-as-en','0');for(const k of ['ta-ask','ta-choose','ta-curious','ta-roast','ta-invite','ta-ask-card'])localStorage.setItem(pre+':'+k,JSON.stringify({settings:{enabled:false,prob:0,popupProb:0}}));}
  },{own,pub,mode});
  await require('./startup-dialog-fixture.cjs')(p);await require('./quiet-startup-fixture.cjs')(p);await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.waitForFunction(()=>window.__mochiDataReady&&typeof window.storeFor==='function');await p.waitForTimeout(1000);
  assert.equal(await p.evaluate(()=>window.storeFor('default').get('cc-groups')),own);assert.equal(await p.evaluate(()=>window.xyStore('xy-home-v2').get('cc-groups-public')),pub);
  await p.evaluate(async({own,pub})=>{window.storeFor('default').set('cc-groups',own);window.xyStore('xy-home-v2').set('cc-groups-public',pub);await window.idbSet('xy-home-v2:default:cc-groups',own);await window.idbSet('xy-home-v2:cc-groups-public',pub);},{own,pub});
  if(mode==='shared-content')await p.waitForTimeout(31000);
  assert.equal(await p.evaluate(()=>window.idbGet('xy-home-v2:default:cc-groups')),own);assert.equal(await p.evaluate(()=>window.idbGet('xy-home-v2:cc-groups-public')),pub);
  console.log('PASS preserve private/public ownership '+mode);await p.close();
 }
}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
