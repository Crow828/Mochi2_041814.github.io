// Personal food diary shared across contacts; no dietary scoring.
(function(){
'use strict';
const page=document.getElementById('page-calendar');if(!page)return;
const original=page.querySelector('.cal-scroll');
const tabs=document.createElement('div');tabs.className='sugar-tabs';tabs.innerHTML='<button type="button" aria-pressed="true">日历</button><button type="button" aria-pressed="false">血糖日记</button>';original.before(tabs);
const panel=document.createElement('div');panel.className='cal-scroll sugar-panel';panel.hidden=true;original.after(panel);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
let selected=today(),month=selected.slice(0,7),category='',editingId=null;const store=window.xyStore('xy-home-v2'),key='sugar-diary';
const read=()=>{try{const a=JSON.parse(store.get(key)||'[]');return Array.isArray(a)?a:[];}catch{return [];}};
const categoryOf=x=>x.category||({'奶茶':'饮品','蛋糕':'甜品','其他甜食':'高碳水'}[x.food]||'');
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(items){store.set(key,JSON.stringify(items));}
let savedToastTimer;
function showSavedToast(){
 let toast=document.getElementById('sugar-saved-toast');
 if(!toast){toast=document.createElement('div');toast.id='sugar-saved-toast';toast.className='sugar-saved-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg><span>已保存</span>';document.body.appendChild(toast);}
 clearTimeout(savedToastTimer);toast.hidden=false;savedToastTimer=setTimeout(()=>{toast.hidden=true;},1800);
}

const hbaKey='sugar-hba1c';
function hbaRead(){try{const v=JSON.parse(store.get(hbaKey)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}}
function renderHba(){
const data=hbaRead(),end=new Date(today()+'T12:00:00'),start=new Date(end);start.setDate(start.getDate()-29);
const dateKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const startKey=dateKey(start),entries=Object.entries(data).filter(([d,v])=>d>=startKey&&d<=today()&&Number.isFinite(Number(v.value))).sort((a,b)=>a[0].localeCompare(b[0]));
const latest=Object.entries(data).filter(([d])=>d<=today()).sort((a,b)=>b[0].localeCompare(a[0]))[0],current=data[selected]||{};
let chart='<div class="hba-empty">填写数据后，这里会显示最近 30 天的趋势</div>';
if(entries.length){const vals=entries.map(x=>Number(x[1].value)),low=Math.min(...vals)-0.2,high=Math.max(...vals)+0.2;let marks='',previous=null;
for(const [d,v] of entries){const day=Math.round((new Date(d+'T12:00:00')-start)/86400000),x=38+day/29*284,y=90-(Number(v.value)-low)/(high-low)*65;
if(previous)marks+='<path d="M'+previous.x+' '+previous.y+' L'+x+' '+y+'"/>';
marks+='<circle cx="'+x+'" cy="'+y+'" r="3"><title>'+esc(d)+' · '+esc(v.value)+'%</title></circle>';previous={day,x,y};}
chart='<svg class="hba-chart" viewBox="0 0 336 124" role="img" aria-label="最近30天手动填写的预估糖化血红蛋白趋势，连线连接已有记录"><text x="2" y="24">'+high.toFixed(1)+'</text><text x="2" y="94">'+low.toFixed(1)+'</text><line x1="38" x2="322" y1="96" y2="96"/>'+marks+'<text x="38" y="118">'+startKey.slice(5)+'</text><text x="285" y="118">'+today().slice(5)+'</text></svg>';}
const card=document.createElement('section');card.className='cal-card glass sugar-detail hba-card';card.innerHTML='<div class="hba-heading"><h3>预估 HbA1c</h3><span>手动记录 · %</span></div><div class="hba-latest">'+(current.value?'<strong>'+esc(current.value)+'<small>%</small></strong><span>'+esc(selected)+' · 当天记录</span>':'<strong>—<small>%</small></strong><span>'+esc(selected)+' · 当天暂无数据</span>')+'</div>'+chart+'<p class="sugar-empty">最近 30 天 · 连线连接已有记录，空缺日期无数值</p><details><summary><span class="hba-entry-icon" aria-hidden="true">＋</span><span><strong>'+(current.value?'修改当天糖化数据':'填写当天糖化数据')+'</strong><small>'+esc(selected)+'</small></span><span class="hba-entry-chevron" aria-hidden="true">⌄</span></summary><form id="hba-form" novalidate><div class="sugar-field"><label for="hba-value">当天预估 HbA1c（%）</label><input id="hba-value" name="reading" inputmode="decimal" maxlength="8" placeholder="填写来源提供的数值" value="'+esc(current.value)+'"></div><div class="sugar-field"><label for="hba-source">数据来源（可选）</label><input id="hba-source" name="source" maxlength="100" placeholder="设备或 App 名称" value="'+esc(current.source)+'"></div><div class="sugar-field"><label for="hba-note">备注（可选）</label><textarea id="hba-note" name="remark" maxlength="300" placeholder="补充说明">'+esc(current.note)+'</textarea></div><p id="hba-status" role="status"></p><button type="submit" class="sugar-save">保存当天数值</button>'+(current.value?'<button type="button" class="hba-delete">删除当天数值</button>':'')+'</form></details><p class="hba-foot">此处展示来源提供的预估值，与医院检验结果分开记录。</p>';
panel.querySelector('.sugar-detail').before(card);
card.querySelector('form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,raw=f.elements.reading.value.trim(),value=Number(raw);if(!/^\d+(\.\d+)?$/.test(raw)||!Number.isFinite(value)||value<=0||value>=100){card.querySelector('#hba-status').textContent='请输入大于 0、小于 100 的百分比数值';return;}
try{const all=hbaRead();all[selected]={value,source:f.elements.source.value.trim(),note:f.elements.remark.value.trim()};store.set(hbaKey,JSON.stringify(all));render();panel.querySelector('.hba-card details').open=true;panel.querySelector('#hba-status').textContent='已保存 '+selected+' 的数值';showSavedToast();}catch{card.querySelector('#hba-status').textContent='保存失败，请重试';}};
const del=card.querySelector('.hba-delete');if(del)del.onclick=()=>{if(confirm('删除当天的预估数值？')){const all=hbaRead();delete all[selected];store.set(hbaKey,JSON.stringify(all));render();}};
}
let peakFilter='全部';
function renderPeak(){
const end=new Date(today()+'T12:00:00'),start=new Date(end);start.setDate(start.getDate()-29);
const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const records=read().filter(x=>x.date>=key(start)&&x.date<=today()&&Number(x.glucosePeak)>0&&(!x.glucoseUnit||x.glucoseUnit==='mmol/L')&&(peakFilter==='全部'||categoryOf(x)===peakFilter)).sort((a,b)=>a.date.localeCompare(b.date)||a.created-b.created);
const card=document.createElement('section');card.className='cal-card glass sugar-detail peak-card';
let chart='<div class="hba-empty">填写食物的血糖高峰值后，这里显示趋势</div>';
if(records.length){const values=records.map(x=>Number(x.glucosePeak)),low=Math.max(0,Math.min(...values)-0.5),high=Math.max(...values)+0.5;let marks='',prev=null;
records.forEach((r,i)=>{const day=Math.round((new Date(r.date+'T12:00:00')-start)/86400000),x=38+day/29*284,y=90-(Number(r.glucosePeak)-low)/(high-low)*65;if(prev)marks+='<path d="M'+prev.x+' '+prev.y+' L'+x+' '+y+'"/>';marks+='<circle data-peak="'+i+'" tabindex="0" role="button" aria-label="'+esc(r.date+' '+r.food+' '+r.glucosePeak+' mmol/L')+'" cx="'+x+'" cy="'+y+'" r="4"><title>'+esc(r.date+' · '+r.food+' · '+r.glucosePeak+' mmol/L')+'</title></circle>';prev={x,y};});
chart='<svg class="hba-chart peak-chart" viewBox="0 0 336 124" aria-label="摄入后血糖高峰值趋势，单位 mmol/L"><text x="2" y="24">'+high.toFixed(1)+'</text><text x="2" y="94">'+low.toFixed(1)+'</text><line x1="38" x2="322" y1="96" y2="96"/>'+marks+'<text x="38" y="118">'+key(start).slice(5)+'</text><text x="285" y="118">'+today().slice(5)+'</text></svg>';}
card.innerHTML='<div class="hba-heading"><h3>摄入后血糖高峰值</h3><span>mmol/L</span></div><div class="sugar-presets peak-filters" role="group" aria-label="高峰值类别">'+['全部','饮品','甜品','高碳水'].map(c=>'<button type="button" aria-pressed="'+(peakFilter===c)+'">'+c+'</button>').join('')+'</div>'+chart+'<p class="peak-info" role="status">近 30 天 · 点击数据点查看对应食物</p>';
panel.querySelector('.hba-card').after(card);
card.querySelectorAll('.peak-filters button').forEach(b=>b.onclick=()=>{peakFilter=b.textContent;card.remove();renderPeak();});
card.querySelectorAll('[data-peak]').forEach(c=>{const show=()=>{const r=records[Number(c.dataset.peak)];card.querySelector('.peak-info').textContent=r.date+' · '+r.food+(r.amount?' · '+r.amount:'')+' · '+r.glucosePeak+' mmol/L';};c.onclick=show;c.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}};});
}
function render(){
editingId=null;
const items=read(),past=items.filter(x=>x.date<=today()).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created),dayItems=items.filter(x=>x.date===selected);
const [y,m]=month.split('-').map(Number),offset=new Date(y,m-1,1).getDay(),days=new Date(y,m,0).getDate();
let cells='<span></span>'.repeat(offset);for(let n=1;n<=days;n++){const date=month+'-'+String(n).padStart(2,'0'),marked=items.some(x=>x.date===date);cells+='<button type="button" data-date="'+date+'" class="sugar-day'+(marked?' recorded':'')+(date===selected?' selected':'')+(date===today()?' is-today':'')+'" aria-label="'+date+(marked?'，有饮食记录':'')+'" aria-pressed="'+(date===selected)+'"><span>'+n+'</span>'+'</button>';}
panel.innerHTML='<div class="sugar-intro"><h2>血糖日记</h2><p>记下吃过的，给下一次选择一个参考。</p><p class="sugar-recent">'+(past.length?'最近记录：'+esc(past[0].date)+' · '+(categoryOf(past[0])?esc(categoryOf(past[0]))+' · ':'')+esc(past[0].food)+(past[0].amount?' · '+esc(past[0].amount):''):'还没有记录，从想记下的那一天开始。')+'</p></div><div class="cal-card glass"><div class="sugar-month"><button type="button" data-shift="-1" aria-label="上个月">‹</button><strong>'+y+'年'+m+'月</strong><button type="button" data-shift="1" aria-label="下个月">›</button><button type="button" id="sugar-today">今天</button></div><div class="sugar-grid">'+['日','一','二','三','四','五','六'].map(x=>'<small>'+x+'</small>').join('')+cells+'</div><p class="sugar-legend"><span></span>加粗：今天 · 淡粉色圆圈：选中日期 · 粉点：有饮食记录</p></div><div class="cal-card glass sugar-detail"><h3>'+esc(selected)+' 的记录</h3><div>'+dayItems.map(x=>'<article><div><strong>'+esc(x.food)+'</strong> '+(categoryOf(x)?'<small class="sugar-category">'+esc(categoryOf(x))+'</small>':'')+' '+esc(x.amount)+(x.glucosePeak?'<p>摄入后血糖高峰值：'+esc(x.glucosePeak)+' '+esc(x.glucoseUnit||'mmol/L')+'</p>':'')+'<p>'+esc(x.note)+'</p></div><div class="sugar-record-actions"><button type="button" data-edit="'+esc(x.id)+'" aria-label="修改'+esc(x.food)+'" title="修改记录"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg></button><button type="button" data-delete="'+esc(x.id)+'" aria-label="删除'+esc(x.food)+'">删除</button></div></article>').join('')+(dayItems.length?'':'<p class="sugar-empty">这天还没有记录</p>')+'</div><form id="sugar-form" novalidate><div class="sugar-presets" role="group" aria-label="食物类别"><button type="button" data-food="饮品">饮品</button><button type="button" data-food="甜品">甜品</button><button type="button" data-food="高碳水">高碳水</button></div><div class="sugar-field"><label for="sugar-food">食物</label><input id="sugar-food" name="food" required maxlength="60" placeholder="例如：奶茶、蛋糕"></div><div class="sugar-field"><label for="sugar-amount">份量</label><input id="sugar-amount" name="amount" maxlength="60" placeholder="例如：半杯、一小块"></div><div class="sugar-field"><label for="sugar-peak">摄入后血糖高峰值（可选）</label><div class="sugar-peak-row"><input id="sugar-peak" name="peak" inputmode="decimal" maxlength="10" placeholder="填写实际记录的数值"><span class="sugar-peak-unit">mmol/L</span></div></div><div class="sugar-field"><label for="sugar-note">备注（可选）</label><textarea id="sugar-note" name="note" maxlength="300" placeholder="记下想补充的内容"></textarea></div><p id="sugar-status" role="status"></p><button class="sugar-save" type="submit">保存记录</button><button type="button" id="sugar-edit-cancel" hidden>取消修改</button></form></div>';
renderHba();
renderPeak();
// Keep saved food records directly below the calendar, with entry form below charts.
const foodForm=panel.querySelector('#sugar-form'),foodCard=foodForm.parentElement;
const formCard=document.createElement('section');formCard.className='cal-card glass sugar-detail sugar-entry-card';
const formTitle=document.createElement('h3');formTitle.textContent='添加饮食记录';formCard.append(formTitle,foodForm);panel.appendChild(formCard);
panel.querySelector('.hba-card').before(foodCard);
panel.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{selected=b.dataset.date;render();});
panel.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{const d=new Date(y,m-1+Number(b.dataset.shift),1);month=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');selected=month+'-01';render();});
panel.querySelector('#sugar-today').onclick=()=>{selected=today();month=selected.slice(0,7);render();};
panel.querySelectorAll('[data-food]').forEach(b=>{
 b.setAttribute('aria-pressed',String(category===b.dataset.food));
 b.onclick=()=>{category=b.dataset.food;panel.querySelectorAll('[data-food]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));panel.querySelector('[name=food]').focus();};
});
panel.querySelector('#sugar-edit-cancel').onclick=()=>render();
panel.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
 const item=read().find(x=>x.id===b.dataset.edit);if(!item)return;editingId=item.id;category=categoryOf(item);
 const f=panel.querySelector('#sugar-form');f.elements.food.value=item.food||'';f.elements.amount.value=item.amount||'';f.elements.note.value=item.note||'';f.elements.peak.value=item.glucoseUnit==='mg/dL'?'':(item.glucosePeak||'');
 panel.querySelectorAll('[data-food]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.food===category)));
 f.querySelector('.sugar-save').textContent='保存修改';f.querySelector('#sugar-edit-cancel').hidden=false;panel.querySelector('#sugar-status').textContent='正在修改这条记录';f.scrollIntoView({behavior:'smooth',block:'start'});f.elements.food.focus();
});
panel.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('删除这条饮食记录？')){save(read().filter(x=>x.id!==b.dataset.delete));render();}});
panel.querySelector('#sugar-form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,food=f.elements.food.value.trim();if(!category){panel.querySelector('#sugar-status').textContent='请先选择类别';return;}if(!food){panel.querySelector("#sugar-status").textContent="请填写食物名称";return;}const peak=f.elements.peak.value.trim();if(peak&&(!/^\d+(\.\d+)?$/.test(peak)||!Number.isFinite(Number(peak))||Number(peak)<=0)){panel.querySelector('#sugar-status').textContent='血糖高峰值请填写大于 0 的数字';return;}try{const all=read(),prior=editingId?all.find(x=>x.id===editingId):null;if(editingId&&!prior)throw new Error('记录已不存在');const record={...(prior||{}),id:prior?prior.id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),date:selected,food,category,glucosePeak:peak?Number(peak):null,glucoseUnit:'mmol/L',amount:f.elements.amount.value.trim(),note:f.elements.note.value.trim(),created:prior?prior.created:Date.now()};save(prior?all.map(x=>x.id===editingId?record:x):[...all,record]);render();panel.querySelector('#sugar-status').textContent='已保存';showSavedToast();}catch{panel.querySelector('#sugar-status').textContent='保存失败，请重试';}};
}
Array.from(tabs.children).forEach((b,i)=>b.onclick=()=>{original.hidden=!!i;panel.hidden=!i;Array.from(tabs.children).forEach((x,j)=>x.setAttribute('aria-pressed',String(i===j)));if(i)render();});
})();
