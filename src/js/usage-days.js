// Independent usage-day counter. Legacy keys and logFish alias preserve saved data.
(function(){
const gStore=window.xyStore("xy-home-v2");
const store=window.activeStore();
  // 已摸鱼天数：按和 TA 打卡或聊天的自然日统计
  // v3.9.x：改为全局累计（跨所有联系人按自然日去重），避免多联系人下每个桌面只显示各自天数
  function usageToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function usageDates() {
    try { const value=JSON.parse(gStore.get('fish-log') || '[]'); return Array.isArray(value)?value:[]; } catch (e) { return []; }
  }
  // FIX 2026-09-11 #290：摸鱼天数自动修正——天数=fish-log 长度，三种错源里两种可就地修：
  // ① 虚高（重复日期/脏值混入：读-改-写竞态、旧格式）→ 规范化（只留 YYYY-MM-DD 合法
  //    日期 + Set 去重），有变化才写回（防无谓写放大）；② 偏低（各联系人命名空间旧
  //    fish-log 副本迟到：migrateUsageDates 原来只在模块加载跑一次，早于 IDB 回填，
  //    副本后到就永远漏算）→ 见下方 restore-done/wrj-heal 再合并。③ IDB 旧快照遮蔽
  //    已由 idb.js retainValue（LS 优先）+ wrj 时间戳守卫兜住，不在此重复设防。
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
  // v3.9.x：一次性迁移——把各联系人命名空间下的旧 fish-log 合并到全局 fish-log（按自然日去重）
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
  // #290：回填完成/写日志自愈后再合并一次——此时尚未合并进全局键的各联系人旧副本
  //（只存 IDB、模块加载时还没回填进来）这时才可见；合并后规范化+刷新天数显示。
  try {
    function fishLogHeal() {
      try { migrateUsageDates(false); normalizeUsageDates(); renderUsageDays(); } catch (e) {}
    }
    document.addEventListener('mochi-restore-done', fishLogHeal);
    document.addEventListener('mochi-wrj-heal', fishLogHeal);
  } catch (e) {}

  // 兼容旧数据：以前打过卡但未计入摸鱼天数的，自动补记（旧标记视为今天打卡）
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
