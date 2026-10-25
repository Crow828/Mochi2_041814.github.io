// Exercise the same dismiss button a user presses before testing another feature.
// Keep the dialog enabled in production; version-dialog tests deliberately do not use this helper.
const installed = new WeakSet();
module.exports = async function handleStartupDialog(page) {
  if (installed.has(page)) return;
  installed.add(page);
  await page.addLocatorHandler(page.locator('#startup-update-dialog[open]'), async () => {
    await page.locator('#startup-update-dialog [data-update-later]').click();
  });
};
