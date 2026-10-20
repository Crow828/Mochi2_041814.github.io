// Central runtime policy. Stored user values are never overwritten by feature state.
(function () {
  'use strict';
  const features = {
    garden: { enabled: false, probability: 'disabled', app: "garden", page: "page-garden", desktop: true },
    cjian: { enabled: false, probability: 'disabled', app: "cjian", page: "page-cjian", menu: "more-cjian", desktop: true },
    sync: { enabled: false, probability: 'disabled', app: "tongpin", page: "page-tongpin", desktop: true },
    reach: { enabled: false, probability: 'disabled', app: "shenshou", page: "page-shenshou", desktop: true },
    room: { enabled: false, probability: 'disabled', app: "room", page: "page-room", menu: "more-room", desktop: true },
    water: { enabled: false, probability: 'disabled', app: "water", page: "page-water", desktop: true },
    pomo: { enabled: false, probability: 'disabled', app: "pomo", page: "page-pomo", desktop: true },
    fish: { enabled: false, probability: 'disabled', desktop: false },
    drift: { enabled: false, probability: 'disabled', page: "page-drift", menu: "more-drift", desktop: false },
    piggy: { enabled: true, probability: 'locked', app: "piggy", page: "page-piggy", desktop: false },
    period: { enabled: true, probability: 'editable', app: "period", page: "page-period", desktop: true },
    accounting: { enabled: false, app: 'accounting', desktop: true },
    memoArc: { enabled: false, app: 'memo-arc', desktop: true },
    myArc: { enabled: false, app: 'my-arc', desktop: true },
    care: { enabled: true, probability: 'editable' },
    memo: { enabled: true, probability: 'editable', app: "memo", page: "page-memo", desktop: true }
  };
  Object.keys(features).forEach(function (key) { Object.freeze(features[key]); });
  Object.freeze(features);
  window.mochiFeatures = Object.freeze({
    features: features,
    desktopVisible: function (key) { return !features[key] || (features[key].enabled && features[key].desktop !== false); },
    appVisible: function (app) { const key = Object.keys(features).find(function (key) { return features[key].app === app; }); return !key || (features[key].enabled && features[key].desktop !== false); },
    enabled: function (key) { return !features[key] || features[key].enabled; },
    probabilityMode: function (key) { return features[key] && features[key].probability || 'editable'; },
    disabledProbabilityKeys: function () { return Object.keys(features).filter(function (key) { return features[key].probability === 'disabled'; }); },
    lockedProbabilityKeys: function () { return Object.keys(features).filter(function (key) { return features[key].probability === 'disabled' || features[key].probability === 'locked'; }); }
  });
  // Runs before feature modules: retired static entries cannot acquire click handlers.
  function applyEntries() {
    Object.keys(features).forEach(function (key) {
      const f = features[key];
      if (f.app && !window.mochiFeatures.appVisible(f.app)) document.querySelectorAll('.app[data-app="' + f.app + '"]').forEach(function (node) { node.remove(); });
      if (f.menu && !f.enabled) { const button = document.getElementById(f.menu); if (button) button.remove(); }
    });
  }
  if (typeof document !== 'undefined') {
    const css = Object.keys(features).filter(function (key) { return !features[key].enabled && features[key].page; }).map(function (key) { return '#' + features[key].page; });
    if (css.length) { const style = document.createElement('style'); style.id = 'feature-policy-pages'; style.textContent = css.join(',') + '{display:none!important}'; document.head.appendChild(style); }
    applyEntries();
    document.addEventListener('DOMContentLoaded', applyEntries);
    document.addEventListener('contact-switched', applyEntries);
    document.addEventListener('mochi-restore-done', applyEntries);
  }
})();
