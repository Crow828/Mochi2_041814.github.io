// Isolated fixture state, not a production flag or a modal-dismiss bypass.
// These tests cover version/input behavior; backup reminders and storage guidance are unrelated.
module.exports=async function quietStartupFixture(page){
  await page.addInitScript(()=>{
    localStorage.setItem('xy-home-v2:storage-guide-shown','1250');
    localStorage.setItem('xy-home-v2:cc-scope-notice-done','1');
    for(const prefix of ['xy-home-v2','xy-home-v2:default']){
      localStorage.setItem(prefix+':__last-backup',String(Date.now()));
      localStorage.setItem(prefix+':__last-backup-remind',String(Date.now()));
    }
  });
  await page.addLocatorHandler(page.locator('#modal-mask:visible'),async()=>{
    const title=await page.locator('#modal-title').textContent();
    throw new Error('Unexpected modal during isolated startup test: '+title);
  });
};
