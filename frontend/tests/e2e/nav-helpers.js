/**
 * On xs viewports the nav lives in a temporary drawer; open it before using sidebar items.
 */
async function openSideNavIfMobile(page) {
  const openDrawer = page.getByRole('button', { name: /open drawer/i });
  if (await openDrawer.isVisible().catch(() => false)) {
    await openDrawer.click();
  }
}

/**
 * MUI portals the mobile drawer outside the layout `nav` landmark, so avoid chaining
 * `getByRole('navigation')` for drawer items. After `openSideNavIfMobile`, target the
 * sidebar control directly (first match is the drawer / permanent rail).
 */
function sidebarButton(page, name, { exact = true } = {}) {
  const opts = typeof name === 'string' ? { name, exact } : { name };
  return page.getByRole('button', opts).first();
}

module.exports = { openSideNavIfMobile, sidebarButton };
