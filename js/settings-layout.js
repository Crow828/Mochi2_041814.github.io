(function () { try {
(function () {
'use strict';
const page=document.getElementById('page-setting');
if(!page)return;
const section=key=>page.querySelector(':scope > .them-sec[data-sec="'+key+'"]');
const basic=section('basic'),tools=section('tools');
const daily=document.getElementById('row-open-divination')?.closest('.set-group');
const lock=document.getElementById('applock-en')?.closest('.set-group');
if(daily&&basic)basic.insertBefore(daily,basic.querySelector('#row-reset')?.closest('.set-group')||null);
if(lock&&tools)tools.appendChild(lock);
const names=[
['#row-export','数据备份与恢复'],['#row-contacts','联系人与群聊'],
['#row-entry-show-list','启动与桌面'],['#row-theme-mode','外观与美化'],
['#row-reset','本地数据清理'],['#row-general','聊天与声音'],
['#applock-en','隐私与应用锁'],['#bg-keepalive','后台与消息提醒'],
['#row-screen-adj','屏幕显示与适配'],['#row-card-audit','字卡检查'],
['#row-open-divination','寻踪与占卜'],['#row-feature-data','数据与存储工具'],
['#row-diagnostics','设备与性能诊断']
];
page.querySelectorAll(':scope > .them-sec > .set-group').forEach(group=>{
const existing=group.querySelector(':scope > .gs-title,:scope > .settings-group-title');
if(existing){existing.classList.add('settings-group-title');return;}
const match=names.find(([selector])=>group.querySelector(selector));
const heading=document.createElement('h3');heading.className='settings-group-title';
const label=group.querySelector('.txt,:scope > .gs-row > span');
heading.textContent=match?match[1]:label?label.childNodes[0].textContent.trim():'设置选项';
group.prepend(heading);
});
if(tools){
const groups=[...tools.querySelectorAll(':scope > .set-group')];
const ordered=['#applock-en','#row-feature-data','#row-card-audit','#row-screen-adj'].map(sel=>groups.find(g=>g.querySelector(sel))).filter(Boolean);
const tips=groups.find(g=>g.querySelector('.settings-group-title')?.textContent.trim()==='使用提示');
if(tips)ordered.push(tips);
[...ordered,...groups.filter(g=>!ordered.includes(g))].forEach(g=>tools.appendChild(g));
}
function compactHelp(){
document.querySelectorAll('.page .tag').forEach(tag=>{
const owner=tag.closest('.page');
if(!owner||!(owner.id==='page-setting'||owner.id==='page-theme'||/settings$/.test(owner.id)))return;
if(tag.textContent.trim()!=='功能说明')return;
const row=tag.closest('.set-row,.gs-row');
const label=row?.querySelector('.txt,:scope > span');
const clone=label?.cloneNode(true);clone?.querySelectorAll('.sub,.tag').forEach(n=>n.remove());
const name=clone?.textContent.trim()||'设置项';
tag.textContent='i';tag.classList.add('settings-info');
tag.setAttribute('aria-label',name+'：功能说明');tag.setAttribute('title',name+'：功能说明');
if(row)row.appendChild(tag);
});
}
compactHelp();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',compactHelp,{once:true});
window.mochiSettingsLayout=Object.freeze({compactHelp:compactHelp});
})();
if (window.__mochiLoaded) window.__mochiLoaded.push("settings-layout.js");
} catch (__e) { if (window.__mochiErrLoaded) window.__mochiErrLoaded.push("settings-layout.js"); try { console.error("[JS] settings-layout.js", __e && __e.message || __e); } catch (x) {} if (window.__jsErrors) window.__jsErrors.push("[settings-layout.js] " + String(__e && __e.message || __e)); } })();