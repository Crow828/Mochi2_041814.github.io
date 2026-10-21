// Central runtime policy. Stored user values are never overwritten by feature state.
(function () {
  'use strict';
  const features = window.mochiFeatureConfig;
  if (!features) throw new Error('feature-policy-config.js must load before feature-policy.js');
  window.mochiFeatures = Object.freeze({
    features: features,
    dataManagementVisible: function (id) { const key = Object.keys(features).find(function (key) { return features[key].dataId === id; }); return !key || ((features[key].enabled && !features[key].removed) && features[key].dataManagement !== false); },
    desktopVisible: function (key) { return !features[key] || ((features[key].enabled && !features[key].removed) && features[key].desktop !== false); },
    appVisible: function (app) { const key = Object.keys(features).find(function (key) { return features[key].app === app; }); return !key || ((features[key].enabled && !features[key].removed) && features[key].desktop !== false); },
    enabled: function (key) { return !features[key] || (features[key].enabled && !features[key].removed); },
    probabilityMode: function (key) { return features[key] && features[key].probability || 'editable'; },
    disabledProbabilityKeys: function () { return Object.keys(features).filter(function (key) { return features[key].probability === 'disabled'; }); },
    lockedProbabilityKeys: function () { return Object.keys(features).filter(function (key) { return features[key].probability === 'disabled' || features[key].probability === 'locked'; }); }
  });
  // Runs before feature modules: retired static entries cannot acquire click handlers.
  function applyEntries() {
    Object.keys(features).forEach(function (key) {
      const f = features[key];
      if ((!f.enabled || f.removed) && f.settings) f.settings.forEach(function (id) { const row = document.getElementById(id); if (row) row.remove(); });
      if (f.app && !window.mochiFeatures.appVisible(f.app)) document.querySelectorAll('.app[data-app="' + f.app + '"]').forEach(function (node) { node.remove(); });
      if (f.menu && (!f.enabled || f.removed)) { const button = document.getElementById(f.menu); if (button) button.remove(); }
    });
  }
  if (typeof document !== 'undefined') {
    const css = Object.keys(features).filter(function (key) { return !(features[key].enabled && !features[key].removed) && features[key].page; }).map(function (key) { return '#' + features[key].page; });
    if (css.length) { const style = document.createElement('style'); style.id = 'feature-policy-pages'; style.textContent = css.join(',') + '{display:none!important}'; document.head.appendChild(style); }
    applyEntries();
    document.addEventListener('DOMContentLoaded', applyEntries);
    document.addEventListener('contact-switched', applyEntries);
    document.addEventListener('mochi-restore-done', applyEntries);
  }
})();
