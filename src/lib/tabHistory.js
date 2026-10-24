/**
 * Per-tab navigation memory for the bottom tab bar.
 *
 * Each tab keeps its own position, so switching tabs and coming back restores
 * where the user was instead of dropping them at the tab root. Tapping the tab
 * you are already in clears that position and returns to its root.
 *
 * TAB_ROOTS mirrors the tab bar in components/layout/BottomNav.jsx: every tab
 * except Home, which owns "/" and is the fallback for pages that belong to no
 * tab (product pages, checkout, ...).
 */

const TAB_ROOTS = ['/discover', '/categories', '/cart', '/profile'];

/** The tab a path belongs to. Anything outside a tab subtree belongs to Home. */
export function tabRootFor(pathname) {
  if (!pathname) return '/';
  return TAB_ROOTS.find((root) => pathname === root || pathname.startsWith(`${root}/`)) || '/';
}

const lastPathByTab = new Map();
// The tab whose history the user is extending. A page that belongs to no tab
// (a product, checkout, ...) is filed under this tab.
let activeTab = null;

/** The tab the user is inside right now: drives the highlight and the tap targets. */
export function currentTabRoot(pathname) {
  const root = tabRootFor(pathname);
  if (root !== '/') return root;
  if (pathname === '/') return '/';
  return activeTab || '/';
}

/**
 * Records a location change. Landing on a tab root starts that tab's history
 * fresh, a page inside a tab extends it, and a page outside every tab is filed
 * under the tab the user is inside.
 */
export function rememberTabPath(pathname) {
  const root = tabRootFor(pathname);
  if (root !== '/') {
    activeTab = root;
    if (pathname === root) lastPathByTab.delete(root);
    else lastPathByTab.set(root, pathname);
    return;
  }
  if (pathname === '/') {
    activeTab = '/';
    lastPathByTab.delete('/');
    return;
  }
  if (activeTab) lastPathByTab.set(activeTab, pathname);
}

/** Where a tab tap should land: its remembered position, else its root. */
export function tabTargetPath(root) {
  return lastPathByTab.get(root) || root;
}

/** Forgets a tab's position, so the next tap lands on its root. */
export function resetTabPath(root) {
  lastPathByTab.delete(root);
}

/**
 * Hands the history to a tab, called when the user opens it. Without this a
 * restored page would still be filed under the tab the user came from.
 */
export function activateTab(root) {
  activeTab = root;
}