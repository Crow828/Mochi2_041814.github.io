(function () { try {
(function(){
const store=window.activeStore();
function history(key){try{const a=JSON.parse(store.get(key)||'[]');return Array.isArray(a)?a.slice().reverse():[];}catch(e){return [];}}
function number(key){return Number(store.get(key)||0)||0;}
window.getFishHistory=()=>history('fish-day-add');
window.getWorkHistory=()=>history('work-day-add');
window.getFishTotals=()=>({mine:number('fish-total'),ta:number('fish-total-ta')});
window.getWorkTotals=()=>({mine:number('work-total'),ta:number('work-total-ta')});
})();
if (window.__mochiLoaded) window.__mochiLoaded.push("legacy-score-history.js");
} catch (__e) { if (window.__mochiErrLoaded) window.__mochiErrLoaded.push("legacy-score-history.js"); try { console.error("[JS] legacy-score-history.js", __e && __e.message || __e); } catch (x) {} if (window.__jsErrors) window.__jsErrors.push("[legacy-score-history.js] " + String(__e && __e.message || __e)); } })();