// Exercise the same dismiss button a user presses before testing another feature.
// Keep the dialog enabled in production; version-dialog tests deliberately do not use this helper.
const installed = new WeakSet();
module.exports = async function handleStartupDialog(page) {
  if (installed.has(page)) return;
  // Feature tests use the repository notice so external CORS failures cannot derail startup.
  await page.route('https://ling233330-star.github.io/mochi/notice.json*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': '*' },
    path: require('node:path').join(__dirname, '..', 'notice.json')
  }));
  installed.add(page);
  await page.addLocatorHandler(page.locator('#startup-update-dialog[open]'), async () => {
    await page.locator('#startup-update-dialog [data-update-later]').click();
  });
};
