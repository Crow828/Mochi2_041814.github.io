// Feature settings only. No DOM access, storage reads, or feature startup.
(function () {
  'use strict';
  const features = {
    garden: { removed: true, dataId: "garden", enabled: false, probability: 'disabled', app: "garden", page: "page-garden", desktop: true },
    cjian: { removed: true, dataId: "cjian", settings: ["row-entry-cjian-first"], enabled: false, probability: 'disabled', app: "cjian", page: "page-cjian", menu: "more-cjian", desktop: true },
    sync: { removed: true, dataId: "tongpin", enabled: false, probability: 'disabled', app: "tongpin", page: "page-tongpin", desktop: true },
    reach: { removed: true, dataId: "shenshou", enabled: false, probability: 'disabled', app: "shenshou", page: "page-shenshou", desktop: true },
    room: { removed: true, dataId: "room", enabled: false, probability: 'disabled', app: "room", page: "page-room", menu: "more-room", desktop: true },
    water: { dataId: "water", enabled: false, probability: 'disabled', app: "water", page: "page-water", desktop: true },
    pomo: { removed: true, dataId: "pomo", enabled: false, probability: 'disabled', app: "pomo", page: "page-pomo", desktop: true },
    fish: { removed: true, dataId: "fish", settings: ["row-fish-days"], enabled: false, probability: 'disabled', desktop: false },
    drift: { removed: true, dataId: "drift", enabled: false, probability: 'disabled', page: "page-drift", menu: "more-drift", desktop: false },
    piggy: { dataId: "piggy", dataManagement: false, enabled: true, probability: 'locked', app: "piggy", page: "page-piggy", desktop: false },
    period: { dataId: "period", enabled: true, probability: 'editable', app: "period", page: "page-period", desktop: true },
    accounting: { dataId: "accounting", enabled: false, app: 'accounting', desktop: true },
    memoArc: { enabled: false, app: 'memo-arc', desktop: true },
    myArc: { dataId: "myarc", enabled: false, app: 'my-arc', desktop: true },
    care: { enabled: true, probability: 'editable' },
    memo: { dataId: "memo", enabled: true, probability: 'editable', app: "memo", page: "page-memo", desktop: true }
  };
  Object.keys(features).forEach(function (key) { if (features[key].settings) Object.freeze(features[key].settings); Object.freeze(features[key]); });
  Object.freeze(features);
  window.mochiFeatureConfig = features;
})();
