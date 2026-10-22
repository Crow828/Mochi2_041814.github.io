(function () { try {
(function () {
'use strict';
const page = document.getElementById('page-chat-settings');
if (!page || page.querySelector('.cs-options')) return;
const inventory = () => Array.from(page.querySelectorAll('[id]')).map(el => el.id).sort();
const before = inventory();
const container = document.createElement('div');
container.className = 'cs-options';
const definitions = [
['profile', '名称与头像', true],
['display', '显示与阅读', true],
['input', '输入与操作', false],
['data', '数据与更多', false]
];
const groups = {};
definitions.forEach(([key, title, open]) => {
const details = document.createElement('details');
details.className = 'cs-options-group';
details.dataset.csGroup = key;
details.open = open;
const summary = document.createElement('summary');
summary.textContent = title;
details.appendChild(summary);
groups[key] = details;
container.appendChild(details);
});
function category(node, section) {
if (section === 'data' || node.querySelector('#cs-export-msgs,#cs-import-msgs,#cs-clear-msgs')) return 'data';
if (node.dataset.tag === 'profile' || node.querySelector('[id^="cs-lbl-"],[id^="cs-avatar-"]')) return 'profile';
if (node.dataset.tag === 'msg') return 'input';
return 'display';
}
Array.from(page.querySelectorAll(':scope > .them-sec')).forEach(section => {
const children = Array.from(section.children);
children.forEach(node => {
if (node.matches('.them-tabs,.gs-title')) return;
const key = category(node, section.dataset.sec);
const heading = node.previousElementSibling;
if (heading && heading.matches('.gs-title')) {
if (heading.dataset.tag) heading.hidden = false;
groups[key].appendChild(heading);
}
if (node.matches('.set-group[data-tag]')) node.hidden = false;
groups[key].appendChild(node);
});
section.dataset.csLegacy = 'true';
});
const tabs = document.getElementById('cs-tabs');
if (tabs) tabs.dataset.csLegacy = 'true';
page.appendChild(container);
page.classList.add('cs-grouped-layout');
function reveal(key) {
const group = groups[key];
if (!group) return;
group.open = true;
container.scrollTop = group.offsetTop - container.offsetTop;
}
if (tabs) tabs.addEventListener('click', event => {
const tab = event.target.closest('[data-tab]');
if (tab) reveal(tab.dataset.tab === 'data' ? 'data' : tab.dataset.tab === 'beautify' ? 'display' : 'profile');
});
const tags = document.getElementById('cs-func-tags');
if (tags) tags.addEventListener('click', event => {
const tag = event.target.closest('[data-ft]');
if (!tag) return;
container.querySelectorAll('.set-group[data-tag],.gs-title[data-tag]').forEach(node => { node.hidden = false; });
reveal(tag.dataset.ft === 'msg' ? 'input' : tag.dataset.ft === 'profile' ? 'profile' : 'display');
});
const help = document.createElement('dialog');
help.className = 'cs-layout-help';
help.setAttribute('aria-labelledby', 'cs-layout-help-title');
help.innerHTML = '<header><h2 id="cs-layout-help-title"></h2><button type="button" aria-label="关闭功能说明">×</button></header><div class="cs-layout-help-body"></div>';
document.body.appendChild(help);
const close = help.querySelector('button');
close.addEventListener('click', () => help.close());
help.addEventListener('click', event => { if (event.target === help) help.close(); });
container.querySelectorAll('.set-row').forEach(row => {
const text = row.querySelector(':scope > .txt');
if (!text || text.querySelector('.tag')) return;
const descriptions = Array.from(text.querySelectorAll(':scope > .sub')).filter(node =>
!node.id && !node.hidden && !node.querySelector('[id],button,input,a,select,textarea') && node.textContent.trim());
if (!descriptions.length) return;
const titleNode = text.cloneNode(true);
titleNode.querySelectorAll('.sub,.tag').forEach(node => node.remove());
const title = titleNode.textContent.trim();
const button = document.createElement('button');
button.type = 'button';
button.className = 'cs-layout-info';
button.textContent = 'i';
button.setAttribute('aria-label', title + '：功能说明');
button.addEventListener('click', event => {
event.stopPropagation();
event.preventDefault();
help.querySelector('h2').textContent = title;
help.querySelector('.cs-layout-help-body').textContent = descriptions.map(node => node.textContent.trim()).join('\n\n');
help.showModal();
close.focus();
});
descriptions.forEach(node => node.classList.add('cs-layout-description'));
row.appendChild(button);
});
window.mochiChatSettingsLayout = Object.freeze({
originalIds: before,
currentIds: inventory,
revealRow: function (id) {
const node = document.getElementById(id);
const group = node && node.closest('.cs-options-group');
if (!group) return false;
group.open = true;
node.scrollIntoView({block:'nearest'});
return true;
}
});
})();
if (window.__mochiLoaded) window.__mochiLoaded.push("chat-settings-layout.js");
} catch (__e) { if (window.__mochiErrLoaded) window.__mochiErrLoaded.push("chat-settings-layout.js"); try { console.error("[JS] chat-settings-layout.js", __e && __e.message || __e); } catch (x) {} if (window.__jsErrors) window.__jsErrors.push("[chat-settings-layout.js] " + String(__e && __e.message || __e)); } })();