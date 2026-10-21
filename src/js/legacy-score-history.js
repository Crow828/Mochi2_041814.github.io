// Kept solely for existing history views and backups; gameplay was removed.
(function(){
 const store=window.activeStore();
 function history(key){try{const a=JSON.parse(store.get(key)||'[]');return Array.isArray(a)?a.slice().reverse():[];}catch(e){return [];}}
 function number(key){return Number(store.get(key)||0)||0;}
 window.getFishHistory=()=>history('fish-day-add');
 window.getWorkHistory=()=>history('work-day-add');
 window.getFishTotals=()=>({mine:number('fish-total'),ta:number('fish-total-ta')});
 window.getWorkTotals=()=>({mine:number('work-total'),ta:number('work-total-ta')});
})();
