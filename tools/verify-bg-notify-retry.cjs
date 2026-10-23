const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/js/bg-keep.js'),'utf8');
const section=source.slice(source.indexOf('    const bgT2 ='),source.indexOf('    const runTest ='));
assert(section.includes('bgT2Arm')&&section.includes('visibilitychange'));
let next=0,now=0;const timers=new Map(),messages=[],pending=[],asked=[];let visibility;
const context={Date:{now:()=>now+1},document:{visibilityState:'visible',addEventListener:(name,fn)=>{if(name==='visibilitychange')visibility=fn;}},
 window:{openModal:()=>{}},store:{get:()=> 'TA'},toast:t=>messages.push(t),askSeen:v=>asked.push(v),
 setTimeout:(fn,delay)=>{const id=++next;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id),
 showSysNotification:(_title,_opts,channel,control)=>new Promise(resolve=>pending.push({channel,resolve,control}))};
vm.createContext(context);vm.runInContext(section+'\nglobalThis.arm=bgT2Arm;globalThis.state=bgT2;',context);
function tick(ms){const end=now+ms;for(;;){let found;for(const [id,t]of timers)if(t.at<=end&&(!found||t.at<found[1].at))found=[id,t];if(!found)break;now=found[1].at;timers.delete(found[0]);found[1].fn();}now=end;}
function visible(value){context.document.visibilityState=value;visibility();}
async function finish(index){pending[index].channel('sw');pending[index].resolve(true);await Promise.resolve();}
(async()=>{
 context.arm();context.arm();assert.equal(messages.filter(s=>s.includes('第二段已就绪')).length,2,'Retry must always acknowledge and rearm');
 visible('hidden');tick(2000);visible('visible');context.arm();visible('hidden');tick(5000);assert.equal(pending.length,1,'Interrupted wait is cancelled; retry sends once');
 await finish(0);visible('visible');tick(1800);assert.equal(asked.length,1);
 context.arm();visible('hidden');tick(5000);await finish(1);visible('visible');
 context.arm();tick(1800);assert.equal(asked.length,1,'Previous round must not open a confirmation over the new test');
 visible('hidden');tick(5000);assert.equal(pending.length,3);visible('visible');context.arm();
 await finish(2);assert.equal(context.state.sent,false,'Late send completion must not complete a fresh round');
 visible('hidden');tick(5000);assert.equal(pending.length,4);await finish(3);visible('visible');tick(1800);assert.equal(asked.length,2);
 context.arm();visible('hidden');now+=20000;visible('visible');tick(1800);
 assert.equal(pending.length,4,'Suspended timer must not replay a test notification in the foreground');
 assert(messages.at(-1).includes('未补发前台测试通知'),'Report suspension instead of success');
 context.arm();visible('hidden');tick(5000);assert(pending[4].control.canSend());visible('visible');
 assert.equal(pending[4].control.canSend(),false,'Delayed preparation may not send after return');
 pending[4].resolve(false);await Promise.resolve();tick(1800);assert(messages.at(-1).includes('未补发前台测试通知'));
 context.arm();visible('hidden');tick(5000);pending[5].control.onSubmit();visible('visible');await finish(5);tick(1800);
 assert(messages.at(-1).includes('无法确认'),'Late receipt must be inconclusive');assert.equal(asked.length,2);
 // Exercise the real sending function, holding media preparation across a foreground return.
 const sender=source.slice(source.indexOf('  function showSysNotification('),source.indexOf('  // v3.5.114：请求权限'));
 let prepare,delivered=0;const sendContext={document:{visibilityState:'hidden'},navigator:{serviceWorker:{}},
   window:{Notification:{}},Notification:{permission:'granted'},lastNotifyChannel:'',BADGE_DATAURL:'',NOTIFY_ICON:'',
   kaSWReady:()=>Promise.resolve({showNotification:()=>{delivered++;return Promise.resolve();}}),
   prepMediaBlobs:(_opts,done)=>{prepare=done;},kaWithTimeout:fn=>Promise.resolve().then(fn),
   swNotifyLater:()=>{throw Error('Self-test must not enter replay queue');}};
 vm.createContext(sendContext);vm.runInContext(sender,sendContext);
 const guarded=sendContext.showSysNotification('test',{},()=>{}, {canSend:()=>sendContext.document.visibilityState==='hidden'});
 await Promise.resolve();assert(prepare);sendContext.document.visibilityState='visible';prepare();assert.equal(await guarded,false);assert.equal(delivered,0);
 const ordinary=sendContext.showSysNotification('normal',{});await Promise.resolve();prepare();assert.equal(await ordinary,true);assert.equal(delivered,1,'Normal notification remains functional');
 console.log('PASS retries, interrupted locks, suspended timers, delayed receipts, guarded real send chain and normal notifications');
})().catch(e=>{console.error(e);process.exitCode=1;});
