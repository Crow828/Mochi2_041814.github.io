(function () { try {
(function () {
const store={
get(k){try{return localStorage.getItem(window.activePrefix()+':'+k);}catch(e){return null;}},
set(k,v){try{localStorage.setItem(window.activePrefix()+':'+k,v);}catch(e){}}
};
const device=window.mochiDevice;
const standalone=!!(device&&device.isIOS&&(navigator.standalone===true||(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)));
if(standalone) document.documentElement.classList.add('ios-pwa-standalone');
document.documentElement.classList.remove('fs-active','fs-css-active','ios-fs-active');
function isFullscreen(){return !!(document.fullscreenElement||document.webkitFullscreenElement);}
const EG_KEY = 'fs-edge-guard';
let _egLayers = null;
let _egTouchHandler = null;
function edgeGuardEnabled() { return store.get(EG_KEY) === '1'; }
function fsAnyActive() {
const d = document.documentElement;
return isFullscreen() || d.classList.contains('fs-active')
|| d.classList.contains('fs-css-active') || d.classList.contains('ios-fs-active');
}
function enableEdgeGuard() {
if (_egLayers) return;
const css = 'position:fixed;top:0;width:24px;height:100vh;z-index:99999;background:transparent;touch-action:none;pointer-events:auto;';
const left = document.createElement('div');
left.setAttribute('style', css + 'left:0;');
const right = document.createElement('div');
right.setAttribute('style', css + 'right:0;');
document.body.appendChild(left);
document.body.appendChild(right);
_egLayers = [left, right];
_egTouchHandler = (e) => {
const t = e.touches && e.touches[0];
if (!t) return;
if (t.clientX <= 24 || t.clientX >= window.innerWidth - 24) {
try { e.preventDefault(); e.stopPropagation(); } catch (err) {}
}
};
document.addEventListener('touchstart', _egTouchHandler, { passive: false, capture: true });
}
function disableEdgeGuard() {
if (_egLayers) { _egLayers.forEach(l => { try { l.remove(); } catch (err) {} }); _egLayers = null; }
if (_egTouchHandler) { document.removeEventListener('touchstart', _egTouchHandler, true); _egTouchHandler = null; }
}
function applyEdgeGuard() {
if (edgeGuardEnabled() && fsAnyActive()) enableEdgeGuard();
else disableEdgeGuard();
}
let _egTipShown = false;
function showEdgeGuardTip() {
if (_egTipShown) return;
_egTipShown = true;
const msg = '已开启全屏边缘防误触。屏幕左右边缘 24px 内的触摸将被拦截，避免触发部分浏览器的音量/亮度边缘手势。\n\n若仍无效（雨见等浏览器的边缘手势是系统级，网页可能拦不住），最可靠的方法是在浏览器设置 → 手势/全屏中关闭「边缘滑动调节音量/亮度」。';
if (window.openModal) {
window.openModal('全屏边缘防误触', '', () => {}, { noInput: true, staticText: msg });
}
}
const egToggle = document.getElementById('sf-edge-guard');
if (egToggle) {
egToggle.checked = edgeGuardEnabled();
egToggle.addEventListener('change', () => {
store.set(EG_KEY, egToggle.checked ? '1' : '0');
applyEdgeGuard();
if (egToggle.checked) showEdgeGuardTip();
});
}
const _egObs = new MutationObserver(() => applyEdgeGuard());
_egObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
applyEdgeGuard();
function gameFsHasActive() {
var nodes = document.getElementsByClassName('poke-card game-fs');
for (var i = 0; i < nodes.length; i++) { if (!nodes[i].hidden) return true; }
return false;
}
var _gfsPhone = document.querySelector('.phone') || (document.body || document.documentElement);
function applyGameFsElevate() {
try {
if (!_gfsPhone.classList.contains('game-fs-active') && !document.getElementsByClassName('poke-card').length) return;
_gfsPhone.classList.toggle('game-fs-active', gameFsHasActive());
} catch (e) {}
}
var _gfsRaf = 0;
function _gfsSchedule() {
if (_gfsRaf) return;
_gfsRaf = requestAnimationFrame(function () { _gfsRaf = 0; applyGameFsElevate(); });
}
function _gfsHitOne(n, deep) {
if (!n || n.nodeType !== 1) return false;
if (n.classList && n.classList.contains('poke-card')) return true;
if (!deep) return false;
try { return !!n.querySelector('.poke-card'); } catch (e) { return false; }
}
function _gfsHit(muts) {
for (var i = 0; i < muts.length; i++) {
var m = muts[i];
if (m.type === 'attributes') { if (_gfsHitOne(m.target, false)) return true; continue; }
var a = m.addedNodes, r = m.removedNodes, k;
for (k = 0; k < a.length; k++) if (_gfsHitOne(a[k], true)) return true;
for (k = 0; k < r.length; k++) if (_gfsHitOne(r[k], true)) return true;
}
return false;
}
var _gfsObs = new MutationObserver(function (muts) { if (_gfsHit(muts)) _gfsSchedule(); });
_gfsObs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'], childList: true });
applyGameFsElevate();
})();
if (window.__mochiLoaded) window.__mochiLoaded.push("fullscreen.js");
} catch (__e) { if (window.__mochiErrLoaded) window.__mochiErrLoaded.push("fullscreen.js"); try { console.error("[JS] fullscreen.js", __e && __e.message || __e); } catch (x) {} if (window.__jsErrors) window.__jsErrors.push("[fullscreen.js] " + String(__e && __e.message || __e)); } })();