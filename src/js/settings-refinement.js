// Settings refinements: move existing nodes so original handlers and saved values survive.
(function(){
 'use strict';
 const freq=document.getElementById('sf-desk-freq');
 const info=document.getElementById('sf-desk-freq-tag');
 if(freq&&info)freq.querySelector('.freq-head')?.appendChild(info);
 const disabled=window.mochiFeatures.disabledProbabilityKeys();
 const panel=document.querySelector('#page-reply-settings [data-rps-panel="cards"]')||document.getElementById('dcf-prob-fish-rs')?.closest('.gs-panel');
 const rows=disabled.map(key=>document.getElementById('dcf-prob-'+key+'-rs')?.closest('.gs-row')).filter(Boolean);
 if(rows.length){
  const box=rows[0].parentElement;
  const details=document.createElement('details');details.className='retired-probabilities';details.id='retired-probabilities';
  const summary=document.createElement('summary');summary.textContent='已停用的字卡概率（'+rows.length+'项）';
  details.appendChild(summary);box.insertBefore(details,rows[0]);rows.forEach(row=>details.appendChild(row));
 }
 for(const [key,title] of [['rps','猜拳'],['game','玩游戏'],['cuddle','贴贴'],['cc','分享你的字卡']]){
  const row=document.getElementById('ai-'+key+'-en')?.closest('.gs-row');if(!row)continue;
  const probability=document.querySelector('#page-reply-settings .stepper[data-k="ai-'+key+'-prob"]')?.closest('.gs-row');
  if(!probability)continue;
  const details=document.createElement('details');details.className='invitation-fold';details.dataset.invitation=key;
  const heading=document.createElement('summary');heading.className='invitation-group-title';heading.textContent=title;
  details.appendChild(heading);row.before(details);details.appendChild(row);details.appendChild(probability);
 }
 window.mochiSettingsRefinement=true;
})();

// Optional palettes: a reversible visual layer, never rewrite existing beauty keys.
(function(){
 'use strict';
 const root=document.documentElement,themePage=document.getElementById('page-theme');
 if(!themePage||document.getElementById('theme-palette-panel'))return;
 const palettes={
  rose:{name:'奶白淡粉',hint:'轻柔的玫瑰调',bg:'#FAF6F7',paper:'#FFFCFD',accent:'#A45D73',bubble:'#F3DFE7',ink:'#3C3035'},
  wine:{name:'奶白酒红',hint:'沉静的红色点缀',bg:'#F8F5F3',paper:'#FFFDFC',accent:'#853C4A',bubble:'#EEDDE0',ink:'#382E31'},
  apricot:{name:'暖米杏',hint:'温暖的燕麦调',bg:'#F8F4EE',paper:'#FFFCF7',accent:'#916139',bubble:'#F1E1CC',ink:'#3C342D'}
 };
 const store=window.xyStore('xy-home-v2'),key='theme-palette';
 const panel=document.createElement('section');panel.id='theme-palette-panel';panel.className='set-group glass theme-palette-panel';
 panel.innerHTML='<h3 class="settings-group-title">主题配色</h3><p class="theme-palette-intro">三种浅色配色，点击即可查看整体效果。切回原有外观可恢复原先的自定义颜色。</p><div class="theme-palette-choices" role="group" aria-label="主题配色"></div><p id="theme-palette-status" role="status" aria-live="polite"></p><div class="theme-palette-demo" aria-label="聊天配色示意"><span class="theme-palette-demo-title">聊天预览</span><div class="theme-palette-demo-in">今天也慢慢来。</div><div class="theme-palette-demo-out">好呀，陪你一起。</div><span class="theme-palette-demo-send">发送</span></div><button type="button" id="theme-palette-reset">切回原有外观</button>';
 const first=themePage.querySelector('.set-group');if(first)first.before(panel);else themePage.appendChild(panel);
 const iconFollowKey='theme-icon-follow';
 const iconRow=document.createElement('div');iconRow.className='theme-icon-follow-row';
 iconRow.innerHTML='<span class="txt" id="theme-icon-follow-label">图标线条图形跟随主题色</span><label class="toggle"><input type="checkbox" id="theme-icon-follow" aria-labelledby="theme-icon-follow-label"><span class="tk"></span></label>';
 panel.querySelector('.theme-palette-demo').before(iconRow);
 const iconFollowInput=iconRow.querySelector('input');
 function applyIconFollow(){
  const enabled=store.get(iconFollowKey)==='1';
  iconFollowInput.checked=enabled;
  if(enabled)root.setAttribute('data-theme-icon-follow','1');else root.removeAttribute('data-theme-icon-follow');
 }
 iconFollowInput.addEventListener('change',()=>{
  if(!window.__mochiDataReady){applyIconFollow();return;}
  try{store.set(iconFollowKey,iconFollowInput.checked?'1':'0');applyIconFollow();}catch(e){applyIconFollow();}
 });
 const buttons=new Map(),demo=panel.querySelector('.theme-palette-demo');
 for(const [id,p] of Object.entries(palettes)){
  const button=document.createElement('button');button.type='button';button.className='theme-palette-choice';button.dataset.palette=id;button.setAttribute('aria-pressed','false');
  const colors=document.createElement('span');colors.className='theme-palette-swatches';colors.setAttribute('aria-hidden','true');
  [p.bg,p.paper,p.accent,p.bubble].forEach(color=>{const swatch=document.createElement('i');swatch.style.backgroundColor=color;colors.appendChild(swatch);});
  const name=document.createElement('strong');name.textContent=p.name;const hint=document.createElement('small');hint.textContent=p.hint;
  button.append(colors,name,hint);button.onclick=()=>choose(id);panel.querySelector('.theme-palette-choices').appendChild(button);buttons.set(id,button);
 }
 const entry=document.createElement('button');entry.type='button';entry.id='row-color-palette';entry.className='set-row theme-palette-entry';entry.innerHTML='<span class="txt">主题配色<span class="sub">奶白淡粉 · 奶白酒红 · 暖米杏</span></span><span class="val" id="theme-palette-value">原有外观</span>';
 document.getElementById('row-appearance')?.after(entry);
 const show=()=>{document.getElementById('row-appearance')?.click();panel.scrollIntoView({block:'start'});};entry.onclick=show;
 function apply(){
  applyIconFollow();
  const selected=store.get(key),p=Object.prototype.hasOwnProperty.call(palettes,selected)?palettes[selected]:null;
  if(p)root.dataset.softPalette=selected;else root.removeAttribute('data-soft-palette');
  for(const name of ['bg','paper','accent','bubble','ink']){
   if(p)root.style.setProperty('--palette-'+name,p[name]);else root.style.removeProperty('--palette-'+name);
  }
  if(window.applyChatSettings)window.applyChatSettings();
  buttons.forEach((b,id)=>b.setAttribute('aria-pressed',String(id===selected)));
  document.getElementById('theme-palette-value').textContent=p?p.name:'原有外观';
  const dark=root.getAttribute('data-theme')==='dark';
  document.getElementById('theme-palette-status').textContent=p?(dark?'已选择 '+p.name+'，关闭深色模式后显示配色。':'当前配色：'+p.name):'当前使用原有外观。';
  const sample=p||palettes.rose;
  for(const name of ['bg','paper','accent','bubble','ink'])demo.style.setProperty('--sample-'+name,sample[name]);
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',getComputedStyle(root).getPropertyValue('--page-bg').trim());
 }
 function choose(id){
  if(!window.__mochiDataReady){document.getElementById('theme-palette-status').textContent='外观数据正在读取，请稍后再试。';return;}
  try{store.set(key,id);apply();}catch(e){document.getElementById('theme-palette-status').textContent='配色未保存，请重试。';}
 }
 document.getElementById('theme-palette-reset').onclick=()=>choose('original');
 document.addEventListener('mochi-restore-done',apply);document.addEventListener('contact-switched',apply);
 new MutationObserver(apply).observe(root,{attributes:true,attributeFilter:['data-theme']});
 apply();
 const previewParams=new URLSearchParams(location.search);
 const previewChat=previewParams.get('preview')==='chat';
 if(previewChat||previewParams.get('show-palettes')==='1'){
  const open=()=>requestAnimationFrame(()=>{if(previewChat){if(window.enterChat)window.enterChat();}else show();});if(window.__mochiDataReady)open();else document.addEventListener('mochi-restore-done',open,{once:true});
 }
})();
