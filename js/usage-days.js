(function () { try {
(function(){
const gStore=window.xyStore("xy-home-v2");
const store=window.activeStore();
function usageToday() {
const d = new Date();
return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function usageDates() {
try { const value=JSON.parse(gStore.get('fish-log') || '[]'); return Array.isArray(value)?value:[]; } catch (e) { return []; }
}
function normalizeUsageDates() {
const seen = new Set();
const clean = usageDates().filter(d =>
typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !seen.has(d) && seen.add(d));
const old = usageDates();
if (old.length !== clean.length || old.some((d, i) => d !== clean[i])) {
gStore.set('fish-log', JSON.stringify(clean));
}
return clean;
}
function recordUsageDay() {
const list = normalizeUsageDates();
const t = usageToday();
if (list.indexOf(t) === -1) {
list.push(t);
gStore.set('fish-log', JSON.stringify(list));
}
renderUsageDays();
}
function renderUsageDays() {
const el = document.getElementById('fish-days');
if (el) el.textContent = normalizeUsageDates().length || 0;
}
window.logUsageDay = recordUsageDay;
window.logFish = recordUsageDay; // 供聊天页调用
function migrateUsageDates(setMark) {
try {
const all = new Set();
try { JSON.parse(gStore.get('fish-log') || '[]').forEach(d => all.add(d)); } catch (e) {}
const contacts = window.getContacts ? window.getContacts() : [{ id: 'default' }];
contacts.forEach(c => {
try {
const s = window.xyStore('xy-home-v2:' + c.id);
JSON.parse(s.get('fish-log') || '[]').forEach(d => all.add(d));
} catch (e) {}
});
if (all.size) gStore.set('fish-log', JSON.stringify(Array.from(all).sort()));
if (setMark) gStore.set('fish-log-global-migrated', '1');
} catch (e) {}
}
migrateUsageDates(false); // 模块加载时先合并 LS 已有的
renderUsageDays();
try {
function fishLogHeal() {
try { migrateUsageDates(false); normalizeUsageDates(); renderUsageDays(); } catch (e) {}
}
document.addEventListener('mochi-restore-done', fishLogHeal);
document.addEventListener('mochi-wrj-heal', fishLogHeal);
} catch (e) {}
(function () {
const ck = store.get('checkin');
if (ck) {
const d = ck === '1' ? usageToday() : ck; // 旧格式 '1' -> 今天；新格式为日期
const list = usageDates();
if (list.indexOf(d) === -1) {
list.push(d);
gStore.set('fish-log', JSON.stringify(list));
renderUsageDays();
}
}
})();
window.mochiUsageDays = Object.freeze({today:usageToday,dates:normalizeUsageDates,log:recordUsageDay,migrate:migrateUsageDates,render:renderUsageDays});
})();
if (window.__mochiLoaded) window.__mochiLoaded.push("usage-days.js");
} catch (__e) { if (window.__mochiErrLoaded) window.__mochiErrLoaded.push("usage-days.js"); try { console.error("[JS] usage-days.js", __e && __e.message || __e); } catch (x) {} if (window.__jsErrors) window.__jsErrors.push("[usage-days.js] " + String(__e && __e.message || __e)); } })();