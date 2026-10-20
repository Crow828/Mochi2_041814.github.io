// ===== 功能：状态栏显示真实时间 =====
(function () {
  const el = document.getElementById('clock');
  if (!el) return;
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  function update() {
    const d = new Date();
    el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  update();
  setInterval(update, 15000); // 每 15 秒校准一次
})();

// ===== v3.26.x：防骗+署名禁倒卖声明「运行时回填」——删掉源码/产物里的字也没用 =====
// template.html 里放的两条置顶声明是静态兜底；这里再用 JS 常量 + 官方远程源强制回填。
// 只要元素缺失（被删）或文案被改，加载时就会重新写回「开屏顶部两条 + 设置页底部」。
// 想彻底去掉必须连这段逻辑一起删——等于改代码本身；有网时再从作者官方站点取权威文案
// 覆盖本地（二传者自己部署的副本也会向官方域名拉取），防二改者连 JS 里的字一起改。
// （本机制 f7a8b5c 首建、0965278 清理时被整块移除，现按防倒卖需求恢复并扩展双条。）
(function () {
  const OFFICIAL_NOTICE = 'https://ling233330-star.github.io/mochi/notice.json';
  const MARK_KEY = '小红书@言序（1842523578）';
  // 两条声明：tag 对应静态 DOM 的 data-anti-scam 标记；key 为 notice.json 权威字段；marks 为在位判定特征词
  // #621：防骗 + 署名禁倒卖合并为一张置顶声明卡（用户要求「并成一张」）。
  // keys = 该卡按序拼接的 notice.json 权威字段（alert + alert2）；marks = 在位判定特征词（两段特征都在才算在位）。
  const BARS = [
    { tag: '1', title: '免费 · 署名 · 防倒卖', keys: ['alert', 'alert2'],
      marks: ['免费', '诈骗', '署名', '倒卖', MARK_KEY] }
  ];
  const texts = {}; // notice 字段 -> 当前权威文案（先本地兜底，官方拉取后覆盖）
  texts['alert'] = 'Mochi字卡网站完全免费，作者只有小红书这一个账号：小红书@言序（1842523578）。如有出现任何收费情况，均为诈骗，注意防止被骗。';
  texts['alert2'] = '二传、分享本站链接必须标注作者署名：小红书 @言序（1842523578），禁止删除或修改。严禁冒为自己制作、删除篡改署名，或以任何形式收费倒卖本站链接、安装包——本站完全免费，收费即诈骗。如果你是花钱买来的链接：你被骗了，请拒付退款并举报卖家。';
  // 一张卡正文 = 各权威字段按序拼接
  function barText(bar) { return bar.keys.map(function (k) { return texts[k] || ''; }).filter(Boolean).join(' '); }
  // 判定一条置顶块文案是否仍为官方声明（标题+全部特征词在位才认为在位，避免每次重建；
  // 空白归一化——文案里「小红书 @言序」带空格而锚点串不带，空格差异不能算被篡改）
  function marked(box, bar) {
    const t = (box.textContent || '').replace(/\s+/g, '');
    const title = bar.title.replace(/\s+/g, '');
    return t.indexOf(title) > -1 && bar.marks.every(function (m) { return t.indexOf(m) > -1; });
  }
  // 开屏置顶块（#613 起：防骗卡在公告区第 1 张；署名禁倒卖卡仍在置顶声明区 = 防未成年锁卡之后）
  // v8.29 #976：7 张必读卡整组前移到 #splash-mustread（品牌卡之前）后，本回填的
  //   ①查找范围放宽到整个开屏滚动容器（卡片搬到哪个容器都能认领，不再写死 #splash-notice）；
  //   ②重建插入点＝必读卡组最顶（保持「合并声明卡在必读区最顶」这条口径）；老副本没有
  //   #splash-mustread 时回退 #splash-notice——二传副本（旧结构）照常被兜住。
  function splashHost() {
    return document.getElementById('splash-mustread') || document.getElementById('splash-notice');
  }
  function splashScope() {
    return document.getElementById('splash-box') || document;
  }
  function ensureBar(bar, refNode) {
    const host = splashHost();
    if (!host) return null;
    const scope = splashScope();
    let box = scope.querySelector('.splash-alert[data-anti-scam="' + bar.tag + '"]');
    if (!box) {
      // 兼容旧副本/标记被删：按官方标题文本认领已有置顶块
      const heads = scope.querySelectorAll('.splash-alert .splash-alert-t');
      for (let i = 0; i < heads.length; i++) {
        if (heads[i].textContent.trim() === bar.title) { box = heads[i].parentNode; break; }
      }
    }
    if (!box) {
      box = document.createElement('div');
      box.className = 'splash-alert';
      host.insertBefore(box, refNode || host.firstChild);
    }
    box.setAttribute('data-anti-scam', bar.tag);
    if (!marked(box, bar)) { // 缺失或被改 → 重建/改写回官方文案
      box.innerHTML = '<div class="splash-alert-t"></div><p></p>';
      box.querySelector('.splash-alert-t').textContent = bar.title;
      box.querySelector('p').textContent = barText(bar);
    }
    return box;
  }
  // 设置页底部块（#page-setting 版本行下方）：防骗+署名禁倒卖 合并为一段
  function ensureSettings() {
    const page = document.getElementById('page-setting');
    if (!page) return;
    let box = page.querySelector('.set-alert');
    const st = box ? (box.textContent || '') : '';
    if (box && MARK_KEY && st.indexOf(MARK_KEY) > -1 && st.indexOf('免费') > -1 && st.indexOf('倒卖') > -1) return;
    if (!box) {
      box = document.createElement('div');
      const anchor = page.querySelector('.ver-credit') || null;
      page.insertBefore(box, anchor ? anchor.nextSibling : null);
    }
    box.className = 'set-alert';
    box.setAttribute('data-anti-scam', 's');
    box.innerHTML = '<b></b>';
    box.querySelector('b').textContent = texts['alert'];
    box.appendChild(document.createTextNode(' ' + texts['alert2']));
  }
  // 远程时效公告（可选）：官方 notice.json 下发 { bulletin: { text, until } }，until=epoch 毫秒（缺省/过期自动摘除）。
  // 用途：临时插播场景（如发现倒卖，对所有联网副本含二传远程挂横幅）；notice.json 不带 bulletin 字段 = 完全不显示，零开销。
  let bulletin = null;
  function ensureBulletin() {
    const host = splashHost(); // #976：与置顶声明卡同一宿主（必读卡组，回退公告卡）
    if (!host) return;
    const scope = splashScope();
    let box = scope.querySelector('.splash-alert[data-anti-scam="3"]');
    const active = !!(bulletin && typeof bulletin.text === 'string' && bulletin.text.trim()
      && (!bulletin.until || Date.now() < bulletin.until));
    if (!active) { if (box) box.remove(); return; }
    const want = bulletin.text.trim();
    if (!box) {
      box = document.createElement('div');
      box.className = 'splash-alert';
      const b1 = scope.querySelector('.splash-alert[data-anti-scam="1"]');
      host.insertBefore(box, b1 ? b1.nextSibling : host.firstChild);
    }
    box.setAttribute('data-anti-scam', '3');
    if (box.textContent !== '公告' + want) { // 内容变化 → 重写（标题固定「公告」）
      box.innerHTML = '<div class="splash-alert-t"></div><p></p>';
      box.querySelector('.splash-alert-t').textContent = '公告';
      box.querySelector('p').textContent = want;
    }
  }
  function run() {
    // #613/#621：合并置顶声明卡（免费 · 署名 · 防倒卖）重建锚点 = 公告区最顶——refNode 传 null，
    // ensureBar 落到 notice.firstChild；只影响「卡被删后重建插到哪」，静态顺序由 template.html 决定。
    ensureBar(BARS[0], null);
    ensureSettings();
    ensureBulletin();
    setupCardLockCard();
  }
  // ===== #1273 开屏解锁入口的三件地基（零机型／零 UA 分支，判据只取「组件在不在场」与事件形态）=====
  // ① cardLockStateKnown：锁卡状态问得到才算数，问不到按默认锁定态渲染（见 setupCardLockCard）。
  // ② cardLockTap：轻点走 device.js 的 touch/pointer/click 三路共用防重入原语 mochiTapOn——这颗按钮
  //    原本只绑 click，而「长按候选判定／滚动回弹／点按期重渲」吞掉合成 click 的内核上，手指真的点了、
  //    界面上什么都不会发生（本批无头真跑：捕获阶段吞 click 后真实触摸＝弹窗 0 次）。原语不在才回退裸
  //    click，老语义保底可用。
  // ③ cardLockMissingNote：解锁要用的外置件没在场时不再静默 return，把「缺的是哪件、怎么办」写进卡上
  //    看得见的状态行，并挂一条有界复核（≤20s，件一到位整卡重渲染，用户再点就正常走）。
  function cardLockStateKnown() {
    try { return typeof window.cardLockOpen === 'function' ? !!window.cardLockOpen() : false; } catch (e) { return false; }
  }
  function cardLockTap(el, fn) {
    if (window.mochiTapOn && window.mochiTapOn(el, fn)) return;
    el.addEventListener('click', fn);
  }
  let cardLockFixTimer = null;
  // #1503 委托兜底（作者报「开屏点了【输入密码解锁】不弹窗、进主页后才出现」）：部分内核整卡
  //   重渲/吞 click 时，按钮自身的监听可能失效或晚到——点击事件仍会冒泡到 document，按目标
  //   认领（谁在位谁响应），保证「点【输入密码解锁】当场弹二级验证输入框」。promptCardUnlock
  //   内置防重入（已开的二级验证弹窗直接跳过），与本按钮自身监听双路径不叠加。
  document.addEventListener('click', function (e) {
    try {
      const t = e.target;
      if (!t || !t.closest) return;
      const btn = t.closest('.cardlock-btn');
      if (!btn || !btn.closest('#splash-cardlock-actions')) return;
      const mk = document.getElementById('modal-mask');
      if (mk && !mk.hidden) return;   // 已有弹窗在前：不叠加
      if (String(btn.textContent || '').indexOf('输入密码解锁') === 0) promptCardUnlock();
    } catch (err) {}
  }, true);
  // 缺件真话要有「留底」：setupCardLockCard 是 actions.innerHTML='' 整卡重渲染，远程公告回写
  // （clock.js 顶部 fetch 落地后 run() 补刷）等会把刚写上的那句抹掉——无头实测点完 0.8s 后状态行
  // 又是空的，用户看到的仍是一句「点了没反应」。留底在组件补齐前由每次重渲染自己补回。
  let cardLockMissMsg = '';
  function cardLockReady() { return !!(window.cardLockTryUnlock && window.openModal); }
  function cardLockMissingNote(miss, okState) {
    let host = okState;
    if (!host) {
      const actions = document.getElementById('splash-cardlock-actions');
      if (actions) {
        host = actions.querySelector('.cardlock-state');
        if (!host) { host = document.createElement('div'); host.className = 'cardlock-state'; actions.appendChild(host); }
      }
    }
    const msg = '解锁要用的 ' + miss + ' 这次没加载成功（不是密码不对）——顶部若出现「点此重试」点它，或重开一次页面；组件一到位这里自己恢复。';
    cardLockMissMsg = msg;
    if (host) host.textContent = msg;
    else if (window.toast) window.toast(msg); // 开屏已隐藏（进入后的提醒弹窗那条路）时至少给一句真话
    if (cardLockFixTimer) return;
    let waited = 0;
    cardLockFixTimer = setInterval(function () {
      waited += 1200;
      if (window.cardLockOpen && window.cardLockTryUnlock && window.openModal) {
        clearInterval(cardLockFixTimer); cardLockFixTimer = null;
        cardLockMissMsg = '';
        setupCardLockCard(); // 整卡重渲染＝按钮接回真流程，状态行随之消失
        return;
      }
      if (waited >= 20000) { clearInterval(cardLockFixTimer); cardLockFixTimer = null; }
    }, 1200);
  }
  // ===== #319 防未成年人·系统内置字卡锁：开屏锁卡状态渲染 + 解锁/上锁交互 =====
  // 闸门本体在 card-lock.js（jsFiles 靠前加载）；这里只管开屏这张卡的 UI。
  // 解锁成功：就地生效（#1497 会话闸，不再刷新），锁卡经 mochi-cardlock-open 事件重渲为「重新上锁」。
  // #998 锁定态 tip 的密码口径：答案在第一页公告的章节里（第一页顶部「目录」可逐章翻），并写明不是第二页
  //   「进入前 · 作者必读公告」上的两个日期（用户直派「时间就在开屏第一页的某个目录，不要看第二页」）。
  function setupCardLockCard() {
    const card = document.getElementById('splash-cardlock');
    // #1273：入口本体不再要求闸门模块在场。原写法 `if (!card || !window.cardLockOpen) return;` 在
    //   js/card-lock.js 没加载成功（外置包首拉失败、#802 自愈也没补回来）时整张卡一个按钮都不出＝
    //   用户所见「点『输入密码解锁』点不了」（无头真跑复现：拦掉该文件后 actions 容器空、点按零反馈）。
    //   现在状态问得到就照状态渲染、问不到按默认锁定态渲染（#319 默认本就是 locked），按钮照常出现，
    //   点下去给的是真话而不是沉默。
    if (!card) return;
    const tip = document.getElementById('splash-cardlock-tip');
    const actions = document.getElementById('splash-cardlock-actions');
    if (!actions) return;
    const open = cardLockStateKnown();
    if (tip) tip.textContent = open
      ? '系统内置字卡已解锁（成年人验证已通过）。如需恢复未成年人保护，可重新上锁。'
      : '系统内置字卡已全部锁定，这是面向未成年人的保护措施，不是 bug。锁定影响：默认聊天字卡、词典（含词典拼字）、其他系统预设互动字卡全部停用；你自建的字卡与情绪 / 心意 / 意图字卡不受影响。豁免说明（#499）：聊天情绪字卡、TA 的心情、聊天回应字卡这三大互动链不受锁定影响，未解锁也照常触发与抽取。所以若发现「某功能开关都开了却没效果」，先看是不是锁定中。不输密码也能正常使用全部功能，密码只管两件事：解锁系统内置字卡、跳过开屏的 2 个问答。注意：锁定时若自定义字卡（含 mj 字卡）一张都没添加，回复会更单薄（情绪/回应字卡仍在，但少了系统预设内容），自己在自定义字卡里添加几张即可。密码一共 6 位数字：前两位是 99，后 4 位是 mochi 字卡生日的字面数字（把生日日期原样写成 4 位数），生日写在开屏第一页的章节目录里（点开第一页顶部的「目录」逐章翻一下就能找到）——第一页的章节目录里和第二页最顶那张时间线卡都写着——日期一直是很简单的字面意思，不是隐藏答案；开屏最底下的部署时间不算（那只是用来判断有没有更新到新版本）。这个密码与开屏问答页的「暗号」是同一个。解开密码请勿二传（不要告诉别人），一旦有人二传，密码就会被重新设置。';
    actions.innerHTML = '';
    const state = document.createElement('div');
    state.className = 'cardlock-state';
    if (open) {
      const relock = document.createElement('button');
      relock.className = 'cardlock-btn cardlock-btn-ghost';
      relock.type = 'button';
      relock.textContent = '重新上锁';
      cardLockTap(relock, function () {
        window.cardLockRelock();
        state.textContent = '已重新上锁，页面即将刷新…';
        // #404 同款：等 'locked' 确认落进 IDB 再刷新（重锁丢失＝未成年人保护失效，更不能容忍）
        const goReloadAfterPersist = function () { setTimeout(function () { location.reload(); }, 300); };
        if (window.cardLockConfirmPersisted) window.cardLockConfirmPersisted('locked', goReloadAfterPersist);
        else setTimeout(function () { location.reload(); }, 900);
      });
      actions.appendChild(relock);
    } else {
      const unlock = document.createElement('button');
      unlock.className = 'cardlock-btn';
      unlock.type = 'button';
      unlock.textContent = '输入密码解锁';
      cardLockTap(unlock, function () {
        promptCardUnlock(state);
      });
      actions.appendChild(unlock);
      // #1508（作者复报「总是按不动、没有任何反应」）两道兜底：①整行可点——点动作区任意位置
      //   （不止那颗按钮）都拉起解锁输入框（防重入由 promptCardUnlock 自带）；②点击路径打点进
      //   __mochiPhaseLog（卡顿自检「冻结前序操作」行可见）——下次诊断单直接指认哪条事件路死了。
      cardLockTap(actions, function () { promptCardUnlock(state); });
      const ph = function (tag) { try { if (window.__mochiPhase) window.__mochiPhase(tag); } catch (e) {} };
      ['touchstart', 'pointerdown', 'click'].forEach(function (evName) {
        actions.addEventListener(evName, function () { ph('锁卡' + evName); }, { capture: true, passive: true });
      });
    }
    actions.appendChild(state);
    // 重渲染不许吃掉刚写下的真话（组件仍缺位时补回同一句）
    if (cardLockMissMsg && !cardLockReady()) state.textContent = cardLockMissMsg;
  }
  // #XXX 二级验证·输入解锁密码：开屏锁卡与「进入后强制提醒弹窗」共用同一解锁流程（拆出来避免
  // 两处重复）。okState 可选：解锁成功时写入「验证通过」提示文本的元素（开屏锁卡用，解锁就地生效不刷新）。开屏仍在（splash 未隐藏）时为避免 z-index 盖住 modal，给 splash 挂 .under-modal，
  // mask [hidden] 恢复时移除；进入后开屏已隐藏则整段跳过。
  // #998 解锁弹窗 staticText 同口径（第一页章节指路＋不是第二页日期）。
  // #812：staticText 末尾补「与开屏问答页暗号同码」互指说明——两入口同码（card-lock 校验
  // mochi#990815 散列、applock QA_SKIP_CODE='990815'），此前两边只讲公式互不通气＝用户各自猜码。
  // #1497：作者拍板维持同码 990815（「输两次」＝两把锁各自当场输一次，见 card-lock.js 会话闸）。
  function promptCardUnlock(okState) {
    // #1273：原来这里是「openModal 与 cardLockTryUnlock 任一缺失就直接 return」＝缺件时点了像没反应
    //   （无头真跑：删掉 window.openModal 后按钮的 click 真的到了处理函数，弹窗 0 次、状态行空）。
    //   现在把「缺的是哪件」写在卡上，并在件到位后自己重渲整卡。
    const miss = !window.cardLockTryUnlock ? 'js/card-lock.js' : (!window.openModal ? 'js/personalize.js' : '');
    if (miss) { cardLockMissingNote(miss, okState); return; }
    // #1503 防重入：委托兜底与按钮自身监听双路径都可能到这——二级验证输入框已在前时不重复渲染
    const exMask = document.getElementById('modal-mask');
    if (exMask && !exMask.hidden) {
      const ti = exMask.querySelector('.modal-t') || exMask.querySelector('.modal-title');
      if (ti && String(ti.textContent || '').indexOf('二级验证') === 0) return;
    }
    const splash = document.getElementById('splash');
    const mask = document.getElementById('modal-mask');
    const splashVisible = splash && !splash.classList.contains('hide');
    if (splashVisible) splash.classList.add('under-modal');
    let mo = null;
    if (splashVisible && mask && 'MutationObserver' in window) {
      mo = new MutationObserver(function () { if (mask.hidden) { splash.classList.remove('under-modal'); } });
      mo.observe(mask, { attributes: true, attributeFilter: ['hidden'] });
    }
    // openModal 标准验证模式：失败 ctl.hint + ctl.stay 不关窗（chat-settings renameChatScheme 同款）
    const ctl = window.openModal('二级验证 · 输入解锁密码', '', function (v) {
      const r = window.cardLockTryUnlock(String(v == null ? '' : v).trim());
      if (!r.ok) { ctl.hint(r.msg || '密码不对'); ctl.stay(); return; }
      // #1497 解锁就地生效不刷新：card-lock.js 已切会话闸（解锁态只活本页生命周期），
      //   这里若照旧 reload＝新页面加载当场打回锁定＝「输对了也被弹回锁定」死循环。
      //   各消费端（回复池/字卡库/词典拼字）经 mochi-cardlock-open 事件与取值时闸自会重同步。
      if (okState) okState.textContent = '验证通过';
      if (mo) { try { mo.disconnect(); } catch (e) {} }
      // #961 解锁成功后先弹「字卡体量提醒」，用户点掉即完（#1497 起解锁不再刷新）。
      const sizeTip = window.mochiPresetSizeTip;
      if (sizeTip && window.openModal) {
        const ctl2 = window.openModal('解锁成功 · 字卡使用提醒', '', function () {
        }, { noInput: true, big: true, warn: true, lock: true, staticText: '系统内置字卡已解锁，聊天与各功能可以正常取用。\n\n' + sizeTip });
        if (ctl2 && ctl2.okText) ctl2.okText('知道了');
      }
    }, { inputmode: 'numeric', placeholder: '输入二级验证密码', staticText: '密码一共 6 位数字：前两位是 99，后 4 位是 mochi 字卡生日的字面数字（把生日日期原样写成 4 位数），生日就在开屏第一页的章节目录里（点开顶部的「目录」逐章翻一下就能找到）——第一页的章节目录里和第二页最顶那张时间线卡都写着——日期一直是很简单的字面意思，不是隐藏答案；开屏最底下的部署时间不算（那只是用来判断有没有更新到新版本）。解开密码请勿二传（不要告诉别人），一旦有人二传，密码就会被重新设置。这个密码与开屏问答页的「暗号」是同一个（同一串 6 位数字）：在开屏问答页点「输暗号跳过问答」用的也是它。' });
  }
  // #1498（2026-09-30 作者口径「二级密码不要弹窗啊，就放在开屏爱点不点」）：进入应用的强制
  //   提醒弹窗（含其长文案与测试钩）整段摘除。
  //   二级密码唯一解锁入口＝开屏公告区那张锁卡（自愿点击）；锁定只影响系统预设字卡可用与否，
  //   不弹窗不打扰。会话闸见 card-lock.js（每次加载从锁定开始）。
  // FIX 2026-09-13 #389：解锁态可能「晚到」——card-lock.js 走 xyStore 后，杀进程回滚的
  // 解锁状态由 wrj 自愈链（mochi-wrj-heal）异步修回并补发 mochi-cardlock-open/-locked。
  // 开屏锁卡此前只在首屏渲染一次，晚到的解锁会一直显示「输入密码解锁」假象，这里监听
  // 两个状态事件整卡重渲染（setupCardLockCard 幂等，重复触发安全）。
  document.addEventListener('mochi-cardlock-open', setupCardLockCard);
  document.addEventListener('mochi-cardlock-locked', setupCardLockCard);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  // 可选官方远程源：失败（离线/被墙/CORS）不阻塞，保留本地兜底；权威文案有变才强刷
  fetch(OFFICIAL_NOTICE, { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function (d) {
      let dirty = false;
      ['alert', 'alert2'].forEach(function (k) {
        if (d && typeof d[k] === 'string' && d[k].trim() && d[k].trim() !== texts[k]) {
          texts[k] = d[k].trim();
          dirty = true;
        }
      });
      // 远程时效公告：与本地状态不同才刷（含下发/摘除）
      if (d && typeof d.bulletin === 'object' && d.bulletin) {
        const nb = { text: String(d.bulletin.text || ''), until: Number(d.bulletin.until) || 0 };
        if (nb.text && (!bulletin || bulletin.text !== nb.text || bulletin.until !== nb.until)) {
          bulletin = nb;
          dirty = true;
        } else if (!nb.text && bulletin) {
          bulletin = null;
          dirty = true;
        }
      }
      if (dirty) run(); // 强刷回写
    })
    .catch(function () { /* 保留本地兜底 */ });
})();

// ===== 开屏加载动画：页面就绪后淡出并移除 =====
(function () {
// Personal deployment: enter directly, then run onboarding after stored data is ready.
const splash = document.getElementById('splash');
if (splash) splash.remove();
let entered = false;
let poll;
function enterWhenReady() {
  if (entered || !window.__mochiDataReady) return;
  entered = true;
  clearInterval(poll);
  document.removeEventListener('mochi-restore-done', enterWhenReady);
  if (window.hydrateLibScopes && ((navigator.deviceMemory || 8) > 4)) {
    setTimeout(function () {
      try { Promise.resolve(window.hydrateLibScopes(['own'])).catch(function () {}); } catch (e) {}
    }, 1500);
  }
  try { if (window.mochiContactEntryFlow) window.mochiContactEntryFlow(); } catch (e) {}
}
document.addEventListener('mochi-restore-done', enterWhenReady);
poll = setInterval(enterWhenReady, 300);
enterWhenReady();
})();

function renderSplashSections(container, sections, opt) {
  if (!container || !Array.isArray(sections)) return;
  const collapsible = !!(opt && opt.collapsible);
  // 首次打开强制展开：今日未读过 → 本章节初始不收起（全文可读）
  const forceExpand = !!(opt && opt.expandFirst) && !!window.__splashForceExpand;
  sections.forEach(function (sec) {
    const wrap = document.createElement('div');
    // v3.8.z：全折叠（已读后） / v3.8.z2：首次打开展开全文
    wrap.className = 'splash-sec-wrap'
      + (collapsible ? ' splash-sec-collapsible' : '')
      + (collapsible && !forceExpand ? ' is-collapsed' : '');
    let h = null;
    if (sec && sec.h) {
      h = document.createElement('p');
      h.className = 'splash-sec';
      h.textContent = String(sec.h);
      wrap.appendChild(h);
    }
    if (sec && Array.isArray(sec.p)) {
      // 折叠模式：细节内容包进 .splash-sec-content，点击标题切换显隐
      const body = collapsible ? document.createElement('div') : null;
      if (body) { body.className = 'splash-sec-content'; }
      sec.p.forEach(function (it) {
        const p = document.createElement('p');
        if (it && typeof it === 'object') {
          if (it.h !== undefined) { p.className = 'splash-sub'; p.textContent = String(it.h); }
          else if (it.b !== undefined) { p.className = 'splash-bullet'; p.textContent = String(it.b); }
          else if (it.hl !== undefined) { p.className = 'splash-item splash-hl'; p.textContent = String(it.hl); }
          else { p.className = 'splash-item'; p.textContent = String(it.t !== undefined ? it.t : ''); }
        } else {
          p.className = 'splash-item';
          p.textContent = String(it);
        }
        if (body) body.appendChild(p); else wrap.appendChild(p);
      });
      if (body) wrap.appendChild(body);
    }
    container.appendChild(wrap);
  });
}

// v3.8.y：开屏公告「书签目录」——顶部可折叠入口（点击展开竖排章节索引，点击即展开并跳转对应章节）
// 复用 renderSplashSections 生成的 .splash-sec-wrap，在线/离线兜底两套 DOM 都生效
function buildSplashToc(list) {
  if (!list) return;
  if (list.querySelector('.splash-toc')) return; // 已注入则跳过（防重复）
  const headers = list.querySelectorAll('.splash-sec-wrap .splash-sec');
  if (!headers.length) return;
  const toc = document.createElement('div');
  toc.className = 'splash-toc';
  // 折叠入口头：显示章节数量，点击展开/收起
  const head = document.createElement('button');
  head.type = 'button';
  head.className = 'splash-toc-head';
  head.setAttribute('aria-expanded', 'false');
  const headText = document.createElement('span');
  headText.className = 'splash-toc-head-text';
  headText.textContent = '目录（' + headers.length + ' 章）';
  const chevron = document.createElement('span');
  chevron.className = 'splash-toc-chev';
  chevron.textContent = '▾';
  head.appendChild(headText);
  head.appendChild(chevron);
  head.addEventListener('click', function () {
    toc.classList.toggle('open');
    head.setAttribute('aria-expanded', String(toc.classList.contains('open')));
  });
  toc.appendChild(head);
  // 可致的正文行
  const body = document.createElement('div');
  body.className = 'splash-toc-body';
  headers.forEach(function (h) {
    const wrap = h.parentNode; // .splash-sec-wrap
    // 标签去【】取正文；竖排整行有足够宽度，仅极长标题截断
    let label = String(h.textContent).replace(/^【|】$/g, '').trim() || '章节';
    if (label.length > 18) label = label.slice(0, 18) + '…';
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'splash-toc-chip';
    chip.textContent = label;
    chip.addEventListener('click', function (e) {
      e.stopPropagation();
      // 点击正文后自动收起目录，减少遮挡
      toc.classList.remove('open');
      head.setAttribute('aria-expanded', 'false');
      Array.prototype.forEach.call(body.children, function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      // 折叠章节默认收起 → 从书签跳转时展开细节
      if (wrap.classList.contains('is-collapsed')) wrap.classList.remove('is-collapsed');
      // 滚动到该章节（#splash-box 是整页滚动容器，scrollIntoView 会滚动到它）
      wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    body.appendChild(chip);
  });
  toc.appendChild(body);
  list.insertBefore(toc, list.firstChild);
}

// ===== 开屏公告远程化：notice.json 在线覆盖公告文案 =====
// 用法：改 src/pwa/notice.json 内容 → 构建部署，开屏公告即更新（无需改代码）。
// 字段：title / sub / tip（前置提示块，数组，元素可为字符串或 {h:块标题,p:[段落]}）
//       / sections（[{h:章节标题,p:[条目]}]，优先于旧 list）；notice.json 的 summary 字段自 v8.44 #1216
//       起废弃（用户直派「必读摘要全部删掉」）：填了也不再渲染，必读内容只有开屏顶卡＋第一页目录两份口径。
//       条目支持四种：字符串=自动编号条目；{h:"子标题"}；{b:"子列表项"}；{hl:"高亮条目"}（橙色加粗显眼标出）。
//       sections 为空数组 / hide:true 时隐藏整个公告区。
// 失败（离线/无网络）静默保留 template.html 写死的默认文案兜底。
(function () {
  const notice = document.getElementById('splash-notice');
  if (!notice) return;
  // #386：file:// 直开本地文件时 fetch 被浏览器 CORS 拦截（origin 'null'），
  // 跳过远程公告，直接保留 template.html 静态兜底文案。
  if (location.protocol === 'file:') return;
  fetch('./notice.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('notice fetch ' + r.status); return r.json(); })
    .then(function (data) {
      if (!data || typeof data !== 'object') return;
      const title = notice.querySelector('.splash-notice-title');
      const sub = notice.querySelector('.splash-notice-sub');
      const list = notice.querySelector('.splash-notice-list');
      if (data.title !== undefined && title) title.textContent = String(data.title);
      if (data.sub !== undefined && sub) sub.textContent = String(data.sub);
      if (Array.isArray(data.sections)) {
        if (!data.sections.length || data.hide) { notice.style.display = 'none'; return; }
        if (list) {
          list.innerHTML = '';
          // 章节：字符串=自动编号条目；{h}=子标题；{b}=子列表项
          // v3.8.y：开屏公告折叠成章节索引，点标题展开细节
          renderSplashSections(list, data.sections, { collapsible: true, expandFirst: true });
          // v3.8.y：添加「书签目录」横向可跳转（需要等 renderSplashSections 生成 DOM 后再注入）
          buildSplashToc(list);
        }
      } else if (Array.isArray(data.list)) {
        if (!data.list.length || data.hide) { notice.style.display = 'none'; return; }
        if (list) {
          list.innerHTML = '';
          data.list.forEach(function (t) {
            const p = document.createElement('p');
            p.className = 'splash-item';
            p.textContent = String(t);
            list.appendChild(p);
          });
        }
      } else if (data.hide) {
        notice.style.display = 'none';
      }
      // 公告渲染完成（或隐藏）→ 通知开屏重新判定"是否已滑到底"
      document.dispatchEvent(new Event('mochi-notice-rendered'));
    })
    .catch(function () { /* 失败：保留模板默认公告 */ });
})();
// v3.8.y：离线兜底（notice.json 加载失败时）公告用 template.html 里的静态章节，同样补一份「书签目录」。
// 在线路径已由上方 .then 内 buildSplashToc 注入（<button> 选择器会先序跳过已存在的 .splash-toc，不会重复）。
// v3.8.z：静态（离线/模板）章节原本是平铺展开，这里统一升级成「可折叠 + 默认收起」；折叠交互走
//   一次事件委托完成（在线 renderSplashSections 已带 splash-sec-collapsible 类，会跳过；点击由同委托处理，
//   两者统一，不重复绑定）。
window.addEventListener('DOMContentLoaded', function () {
  const nl = document.querySelector('.splash-notice-list');
  if (!nl) return;
  // 1) 离线平铺章节 → 折叠章节（默认收起），与在线折叠结构一致
  //    仅当渲染时序为「先 DOMContentLoaded 后 notice 异步填充」时才会动到模板静态 DOM；
  //    若 notice 已先行渲染（各节都已带 splash-sec-collapsible 类）则整体跳过。移动只允许
  //    把标题后的兄弟节点收进 content，绝不移入 content 自身/子孙，杜绝 "父节点塞进自身"。
  Array.prototype.forEach.call(nl.querySelectorAll('.splash-sec-wrap'), function (wrap) {
    if (wrap.classList.contains('splash-sec-collapsible')) return; // 在线已处理
    const head = wrap.querySelector(':scope > .splash-sec');
    if (!head) return;
    wrap.classList.add('splash-sec-collapsible');
    // 首次打开强制展开全文阅读；已读后再次打开才折叠
    if (!window.__splashForceExpand) wrap.classList.add('is-collapsed');
    let content = wrap.querySelector(':scope > .splash-sec-content');
    if (!content) {
      content = document.createElement('div');
      content.className = 'splash-sec-content';
      wrap.appendChild(content);
    }
    // 把标题之后的所有兄弟节点收进 content
    while (head.nextSibling && !content.contains(head.nextSibling)) content.appendChild(head.nextSibling);
  });
  // 2) 折叠/展开交互：事件委托，一次注册，在线/离线都生效
  nl.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== nl && !(t.classList && t.classList.contains('splash-sec'))) t = t.parentNode;
    if (!t || t === nl || !t.parentNode) return;
    const wrap = t.parentNode;
    if (wrap.classList && wrap.classList.contains('splash-sec-collapsible')) {
      wrap.classList.toggle('is-collapsed');
    }
  });
  buildSplashToc(nl);
  document.dispatchEvent(new Event('mochi-notice-rendered'));
});


// Personal desktop layout: remaining utility apps belong to page two.
(function () {
  function moveApps() {
    const target = document.querySelector('.app-grid.p2-grid');
    if (!target) return;
    ['eat', 'market', 'giftbox', 'period', 'memo'].forEach(function (id) {
      const app = document.querySelector('.app[data-app="' + id + '"]');
      if (app && app.parentNode !== target) target.appendChild(app);
    });
  }
  function schedule() { moveApps(); setTimeout(moveApps, 300); }
  document.addEventListener('DOMContentLoaded', schedule);
  document.addEventListener('mochi-restore-done', schedule);
  document.addEventListener('contact-switched', schedule);
  if (document.readyState !== 'loading') schedule();
})();
