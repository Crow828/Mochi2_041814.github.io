// Read-only release notes; append future dated entries to this list.
(function () {
  'use strict';
  const settings = document.getElementById('page-setting');
  const basic = settings?.querySelector('.them-sec[data-sec="basic"]');
  if (!basic || document.getElementById('row-update-notes')) return;
  const entries = [{date:'2026-10-23',items:[
    ['设置排版','调整分类栏样式、分区间距、标题与开关对齐，整理部分功能的位置和说明。'],
    ['字卡库分类','重新整理聊天字卡、互动功能、日常展示、TA 的互动及数据管理等分组。'],
    ['日历清理','移除已停用的摸鱼、工作统计展示，保留仍在使用的备忘与心情功能。'],
    ['自定义心情','可以添加 emoji、名称和心情程度，你和 TA 共用自定义心情列表；TA 仍会独立生成心情。'],
    ['聊天多选收藏','支持勾选你和 TA 的多条消息并保存为组合收藏，保留消息顺序与双方气泡。'],
    ['收藏展示与备注','单条和组合收藏统一外框，增加类型标题、备注和日期时间；调整分类栏、多选圆圈及备注排版。'],
    ['收藏显示修复','情绪、心意等标签移到正文下方；修正朋友圈作者、头像与方向，以及姓名显示为“默认”的问题。'],
    ['信件展示','收藏信件采用姓名与原信时间、独立标题、正文的信纸排版。'],
    ['更新说明','在设置的通用分类增加更新入口，按日期折叠收录更新内容。']
  ]}];
  const group = document.createElement('div'); group.className = 'set-group glass'; group.id = 'settings-update-group';
  group.innerHTML = '<h3 class="settings-group-title">更新</h3><button type="button" class="set-row update-notes-entry" id="row-update-notes"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M8 11h5M8 15h7"/><path d="M15 6a4 4 0 1 1 2 3.5M15 3v3h3"/></svg></span><span class="txt">更新说明<span class="sub">按日期查看更新内容</span></span><span class="arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6"/></svg></span></button>';
  basic.appendChild(group);
  const page = document.createElement('div'); page.className = 'page'; page.id = 'page-update-notes'; page.hidden = true;
  page.innerHTML = '<div class="chat-head"><button type="button" class="ch-back" id="update-notes-back" aria-label="返回设置"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button><span class="ch-name">更新说明</span></div><div class="update-notes-list"></div>';
  entries.forEach(entry => {
    const details = document.createElement('details'); details.className = 'update-notes-date';
    const summary = document.createElement('summary'); summary.textContent = entry.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/,'$1年$2月$3日');
    const list = document.createElement('ul');
    entry.items.forEach(([title,text]) => {const li=document.createElement('li'),heading=document.createElement('strong'),body=document.createElement('p');heading.textContent=title;body.textContent=text;li.append(heading,body);list.appendChild(li);});
    details.append(summary,list); page.querySelector('.update-notes-list').appendChild(details);
  });
  settings.after(page);
  function show(target) {document.querySelectorAll('.page').forEach(p=>{if(!p.hidden)p.hidden=true;});target.hidden=false;}
  document.getElementById('row-update-notes').addEventListener('click',()=>{show(page);page.querySelector('summary')?.focus({preventScroll:true});});
  document.getElementById('update-notes-back').addEventListener('click',()=>{show(settings);document.getElementById('row-update-notes').focus({preventScroll:true});});
})();
