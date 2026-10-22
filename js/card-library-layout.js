(function () { try {
(function(){
'use strict';
const root=document.getElementById('page-chatcard');if(!root)return;
const categories={
custom:[
['聊天字卡',['li-custom-cards-public','li-custom-cards']],
['互动功能',['li-fun-cards-public','li-fun-cards-mine']],
['日常展示',['li-checkin-cards-mine','li-quote-cards-mine']],
['TA 的互动',['li-ta-ask-mine','li-ta-choose-mine','li-ta-curious-mine','li-ta-roast-mine','li-ta-checkin-mine','li-ta-invite-mine']],
['数据管理',['li-cc-full-export','li-cc-full-import']]
],
preset:[
['聊天与回应',['li-default-cards','li-dict-cards','li-fun-cards','li-mood-cards','li-ta-mood','li-reply-cards']],
['日常展示',['li-checkin-cards','li-quote-cards','li-loc-cards']],
['TA 的互动',['li-ta-ask','li-ta-choose','li-ta-curious','li-ta-roast','li-ta-checkin','li-deskcheck','li-ta-invite']]
]
};
for(const [key,groups] of Object.entries(categories)){
const body=document.getElementById('cc-sect-'+key);if(!body||body.querySelector(':scope > .cc-library-group'))continue;
const entries=[...body.querySelectorAll(':scope > .chat-item')];
function appendGroup(title,nodes){
if(!nodes.length)return;
const section=document.createElement('section');section.className='cc-library-group';
const heading=document.createElement('h3');heading.className='cc-library-group-title';heading.id='cc-library-'+key+'-'+body.querySelectorAll('.cc-library-group').length;heading.textContent=title;
section.setAttribute('aria-labelledby',heading.id);section.appendChild(heading);nodes.forEach(node=>section.appendChild(node));body.appendChild(section);
}
const used=new Set();
for(const [title,ids] of groups){
const nodes=ids.map(id=>entries.find(e=>e.id===id)).filter(Boolean);nodes.forEach(node=>used.add(node));appendGroup(title,nodes);
}
appendGroup('其他字卡',entries.filter(node=>!used.has(node)));
}
window.mochiCardLibraryLayout=true;
})();
if (window.__mochiLoaded) window.__mochiLoaded.push("card-library-layout.js");
} catch (__e) { if (window.__mochiErrLoaded) window.__mochiErrLoaded.push("card-library-layout.js"); try { console.error("[JS] card-library-layout.js", __e && __e.message || __e); } catch (x) {} if (window.__jsErrors) window.__jsErrors.push("[card-library-layout.js] " + String(__e && __e.message || __e)); } })();