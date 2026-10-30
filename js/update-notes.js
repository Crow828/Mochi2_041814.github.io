(function () { try {
(function () {
'use strict';
const settings = document.getElementById('page-setting');
const basic = settings?.querySelector('.them-sec[data-sec="basic"]');
if (!basic || document.getElementById('row-update-notes')) return;
const entries = [{date:'2026-10-31',items:[["v4.2.9 · 手机启动与显示修复","统一开屏与更新检测的版本标识；普通网址启动也直接进入聊天页面，保留开屏验证和版本检查。"],["主题色补齐","表情包分类、回复设置、提问回答和信箱操作按钮的选中底色跟随主题，文字为白色；回复设置顶部改为主题色文字和下划线，字体增加12px。"],["中文输入保护","提问卡片输入时保留原生输入节点，推迟会重建卡片的刷新；拼音组合期间不提交回答，减少输入焦点被打断。iPhone原生候选栏仍需实机验证。"],["收藏信件与回信","收藏信件关联原信，展示已有及后续的我的回信与TA的回信；旧收藏按时间和正文匹配。"],["拍一拍使用权限","点击TA头像打开拍一拍后，可关闭允许TA使用我的拍一拍；按联系人保存，不影响手动发送。"],["心意柜排版","历史月份折叠栏使用白底并独占一行，排列在当天卡片下方；删除改为红底白字椭圆按钮并左移12px。"],["更新说明页面","修正主题配色下顶部背景不一致。"]]},{date:'2026-10-29',items:[["v4.2.8 · 三款主题配色","新增奶白淡粉、奶白酒红、暖米杏；可切回原有外观，保留原先保存的自定义颜色。"],["主题按钮与导航","补齐聊天工具、字卡库、主页、信箱、朋友圈、纪念、收藏、音乐和心意市集等按钮的主题色；选中按钮使用主题底色与白字。"],["聊天外观设置","新增聊天背景、顶部栏与底部输入栏颜色选择，可分别调整或恢复跟随主题；保留壁纸、透明度与原有设置。"],["导航与页面样式","音乐及提问记录顶部改用文字加下划线导航；收藏恢复分段切换，朋友圈操作按钮保留原有颜色，修正部分标题和背景色块。"],["音乐模块","播放设置移至音乐导航下方的独立卡片；补齐歌单与听歌记录按钮颜色，桌面播放按钮和进度条跟随主题。"],["桌面主题细节","本周日常的今日标记使用主题色与白字；新增“图标线条图形跟随主题色”开关，关闭后恢复原有图标颜色。"],["字卡库排版","调整分类区、管理按钮的留白及标题与开关间距，保留分类按钮原有行距；询问、小问题、好奇与吐槽的概率滑条跟随主题。"],["寻踪与工具细节","调整寻踪历史的日期与内容缩进；优化聊天背景色设置及重新唤起输入法的图标。"]]},{date:'2026-10-26',items:[['v4.2.7 · 自定义心情管理','新增管理入口，可修改自定义 emoji、心情名称和程度，或删除选项；保留已保存的日记。'],['聊天底栏调整','默认顺序调整：表情包在照片左侧，语音在发送键左侧；保留原有按钮功能及自定义排序入口。']]},{date:'2026-10-25',items:[
['聊天历史合并','修复历史排序后按旧位置回填卡片状态的问题，改为按消息身份匹配，避免覆盖其他消息及造成日期错位。'],
['历史问题卡片','点击问题卡片时按消息身份定位，减少历史下标变化造成的无法展开选择与回答。'],
['版本重试修复','开屏关闭后仍保留本页构建号，重新检查不再因开屏元素移除而误报网络失败。'],
['字卡归属保护','取消单联系人自动搬库和跨公用、专属库自动删重，保留用户选择的字卡归属。'],
['输入法重试','关闭版本弹窗后仅释放其恢复的原输入焦点，避免影响其他输入框；聊天更多的工具中新增“重新唤起输入法”，保留草稿并重新聚焦，便于候选栏异常时重试。'],
['血糖日记备份修复','修正血糖日记被联系人迁移误搬后显示为空的问题，兼容找回旧位置的饮食及糖化记录；备份覆盖清单增加这两类记录。'],
['聊天滑动修复','限定聊天消息区的显示层级，避免主动消息标识穿过顶部栏；缩小手动翻阅历史时每次同步加载的批量，减轻滚动时的停顿，保留原有历史记录、时间与新消息补齐逻辑。'],
['新版提醒','开屏显示今日日期、当前 v4.2.6 刷新弹窗修复版本及构建时间，自动检查网页更新；明确显示最新、有更新和检查失败，支持重新检查、刷新更新或稍等。'],
['更新下载修复','修正脚本下载地址，保留弹窗显示下载进度；后台缓存写入完成后再刷新，下载失败可重试，避免重复点击干扰更新。'],
['功能包加载','补齐血糖日记等外置功能脚本，并核对页面引用的全部88个脚本；调整加载失败提示，区分可能的文件缺失与网络异常。'],
['切页优化','合并返回主页时重复的尺寸及滚动位置读取；隐藏页面内的浮层跳过几何测量，减少不必要的布局开销。'],
['验证与数据核对','完善多选收藏、回答卡片刷新及日期查找的验证时序与测试环境；完成聊天、收藏、设置、日历和血糖日记等回归检查。']
]},{date:'2026-10-24',items:[
['血糖日记','日历新增血糖日记，按日期记录饮品、甜品、高碳水及具体食物、份量和备注。'],
['月历标记','今天数字加粗、选中日期淡粉色圆圈、有饮食记录的日期显示粉点。'],
['饮食记录管理','记录放在月历下方，支持修改、取消修改及删除；可填写摄入后血糖高峰值，固定使用 mmol/L。'],
['预估糖化','手动记录当天预估 HbA1c、来源与备注，切换日期显示当天数值，优化填写入口。'],
['趋势与保存','分别呈现近30天糖化与高峰值趋势，支持高峰值类别筛选及食物查看；保存成功显示打勾与已保存提示。'],
['聊天日期查找','恢复打开时从顶部显示两个月，保留日期字体与当天样式。'],
['问题回答卡片','加强回答后问题卡片的保留与恢复，呈现问题、我的回答及 TA 的回应。'],
['朋友圈通知','聊天动态通知直达对应内容，返回时回到聊天；修复主页进入时的重复闪烁。']
]},{date:'2026-10-23',items:[
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
if (window.__mochiLoaded) window.__mochiLoaded.push("update-notes.js");
} catch (__e) { if (window.__mochiErrLoaded) window.__mochiErrLoaded.push("update-notes.js"); try { console.error("[JS] update-notes.js", __e && __e.message || __e); } catch (x) {} if (window.__jsErrors) window.__jsErrors.push("[update-notes.js] " + String(__e && __e.message || __e)); } })();