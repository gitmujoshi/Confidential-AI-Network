/**
 * The console scrolls inside the main pane. Playwright fullPage shots measure the
 * document, so expand those panes (and stretch the fixed sidebar) before capture.
 */
async function prepareFullPageCapture(page) {
  await page.evaluate(() => {
    const set = (el, props) => {
      if (!el) return;
      Object.entries(props).forEach(([key, value]) => {
        el.style.setProperty(key, value, 'important');
      });
    };
    const open = {
      height: 'auto',
      'min-height': '0',
      'max-height': 'none',
      overflow: 'visible',
      flex: 'none',
    };
    set(document.documentElement, { height: 'auto', overflow: 'visible' });
    set(document.body, { height: 'auto', overflow: 'visible' });
    set(document.getElementById('root'), { ...open, display: 'block' });
    document.querySelectorAll('.can-app-frame, .can-scroll, main').forEach((el) => set(el, open));
    const main = document.querySelector('main');
    const shell = main && main.parentElement;
    set(shell, { height: 'auto', overflow: 'visible', position: 'relative' });
    document.querySelectorAll('.MuiDrawer-paper').forEach((el) => {
      set(el, { position: 'absolute', top: '0', bottom: '0', height: 'auto' });
    });
    document.querySelectorAll('.MuiAppBar-root').forEach((el) => {
      set(el, { position: 'absolute', top: '0' });
    });
  });
}

module.exports = { prepareFullPageCapture };
