// Application fullscreen was retired. Keep the standalone safe-area and shared game helpers.
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
  // v3.9.x：全屏边缘防误触——部分国产浏览器（雨见/UC/QQ 等）全屏下左右边缘上下滑
  // 会调节音量/亮度（浏览器自带手势，网页拦不住）。用户开启后用边缘透明拦截层
  //（touch-action:none 吃掉边缘触摸，浏览器看不到边缘手势触发）+ touchstart 兜底
  // 尝试阻挡。对系统级手势可能无效，最可靠仍是浏览器设置关闭边缘滑动调节。
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
  // 全屏态变化（fs-active/fs-css-active/ios-fs-active class 切换）时同步启用/停用
  const _egObs = new MutationObserver(() => applyEdgeGuard());
  _egObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  applyEdgeGuard();

  // #320 全屏游戏面板抬层：`.game-fs` 面板在 #page-chat（.page z-index:2）的层叠上下文
  //   内，z-index 永远被压到 2，低于全局顶部提醒条（ver-update-bar/backup-remind-bar 998）
  //   ——全屏时头部难度下拉被提醒条盖住、点不到（连连看/消消乐全屏选不了难度的根因）。
  //   任一可见 .game-fs 生效时给 .phone 挂 game-fs-active 类，chat-pages.css 据此把
  //   所在 page 抬到 1000（>998），面板 z-9999 才真正置顶；退出后还原，提醒条照常显示。
  function gameFsHasActive() {
    // FIX 2026-09-11 #338 手机端卡顿成分：本检查挂在 document.body 整树观察器上，
    // 每个 DOM 变动批都做一次类并集选择器全文档扫描（4× 降频实测：切桌面一个阶段
    // 扫 74 次 ≈260ms 主线程）。改用 getElementsByClassName 活集合（C++ 直索引，
    // 双类匹配语义与 '.poke-card.game-fs' 完全等价，无选择器引擎/无快照分配）。
    var nodes = document.getElementsByClassName('poke-card game-fs');
    for (var i = 0; i < nodes.length; i++) { if (!nodes[i].hidden) return true; }
    return false;
  }
  var _gfsPhone = document.querySelector('.phone') || (document.body || document.documentElement);
  function applyGameFsElevate() {
    try {
      // #970：无游戏面板且壳上也没挂类 ⇒ 直接返回，省掉一次全文档类名查询。
      // 本观察器挂在整棵 body 子树（class/hidden/childList），而本应用 class 切换极其频繁
      // （气泡插入、面板开合、圆点高亮、scroll-lock…），原实现每个变更批次都做一次
      // document.getElementsByClassName('poke-card game-fs') 全文档匹配。
      if (!_gfsPhone.classList.contains('game-fs-active') && !document.getElementsByClassName('poke-card').length) return;
      _gfsPhone.classList.toggle('game-fs-active', gameFsHasActive());
    } catch (e) {}
  }
  // #970：rAF 合并——同一帧内的成批变更只评估一次（原来每个 mutation 批次跑一次），
  // 且把评估挪出 mutation 微任务路径；语义不变（一帧内照样完成提层/撤层）。
  var _gfsRaf = 0;
  function _gfsSchedule() {
    if (_gfsRaf) return;
    _gfsRaf = requestAnimationFrame(function () { _gfsRaf = 0; applyGameFsElevate(); });
  }
  // #1301 观察器只对本该它管的变化醒：#338/#970 把「每次评估」的成本一路压低（活集合 +
  // 无面板直返回 + rAF 合帧），但**触发评估**的条件仍是「body 整树任何一次 class／hidden／
  // 子节点变化」。而本应用 91% 的 DOM 住在隐藏页里（无头实测 16405/18040 节点），切页与
  // 页面内每次渲染都会把整批 MutationRecord 推进来——每批都要过一遍 applyGameFsElevate，
  // 那趟 `document.getElementsByClassName('poke-card').length` 是**全文档**活集合取长
  // （集合缓存随每次 DOM 变更失效，等于每批重扫整棵树）。393×852 DPR3＋6× 节流实测：
  // 20 次切页里本观察器自耗时 506ms，另带 ~1.8s 的选择器查询。
  // 现在改为先在 MutationRecord 上判「这一批里到底有没有碰 .poke-card」：属性记录只看
  // 被改的那个元素自身，childList 记录只进「新插入／移除的那棵子树」做局部 querySelector
  // （作用域是那一小段子树，不是整篇文档）。真碰到了才 _gfsSchedule()，评估逻辑一字未动。
  // 零机型分支：判据是「记录里有没有这个类名」，与内核、UA、型号无关。
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
