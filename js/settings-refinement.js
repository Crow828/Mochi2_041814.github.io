(function () { try {
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
if (window.__mochiLoaded) window.__mochiLoaded.push("settings-refinement.js");
} catch (__e) { if (window.__mochiErrLoaded) window.__mochiErrLoaded.push("settings-refinement.js"); try { console.error("[JS] settings-refinement.js", __e && __e.message || __e); } catch (x) {} if (window.__jsErrors) window.__jsErrors.push("[settings-refinement.js] " + String(__e && __e.message || __e)); } })();