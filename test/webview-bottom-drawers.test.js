import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { navigationDirection, routeMotion } from '../src/lib/navigationDirection.js';

const read = path => readFileSync(`src/${path}`, 'utf8');
const css = read('index.css');

describe('AfriTrade WebView presentation contract', () => {
  it('contains root scroll bounce but hides scrollbars only in the mobile media query', () => {
    assert.match(css, /html, body\s*\{\s*overscroll-behavior:\s*none;/);
    assert.match(css, /@media \(max-width: 767px\)\s*\{\s*html, body, body \*\s*\{[\s\S]*?scrollbar-width:\s*none;/);
    assert.match(css, /body \*::-webkit-scrollbar\s*\{\s*display:\s*none;/);
    assert.doesNotMatch(css, /overflow:\s*hidden;\s*\/\*\s*mobile/i);
  });
  it('keeps content links and selectable text out of the user-select restriction', () => {
    const blocks = [...css.matchAll(/([^{}]+)\{\s*(?:-[\w-]+:\s*[^;]+;\s*)*user-select:\s*none;/g)];
    assert.ok(blocks.length > 0);
    for (const block of blocks) {
      const selector = block[1].replace(/\/\*[\s\S]*?\*\//g, '');
      assert.doesNotMatch(selector, /\.app-nav-item|\.bottom-nav-item|\barticle\b|\bmain\b|\bp\b|(^|[,\s])a(?=\W|$)/);
    }
    assert.match(css, /\[role="tab"\], \.header-icon-button/);
  });
  it('retains safe area padding for top bar and bottom nav', () => {
    assert.match(read('components/layout/TopBar.jsx'), /pt-\[env\(safe-area-inset-top\)\]/);
    assert.match(read('components/layout/BottomNav.jsx'), /pb-\[env\(safe-area-inset-bottom\)\]/);
  });
  it('animates only routed content inside AppLayout and does not remount navigation', () => {
    const layout = read('components/layout/AppLayout.jsx');
    const app = read('App.jsx');
    assert.match(layout, /useLocation\(\)/);
    assert.match(layout, /useNavigationType\(\)/);
    assert.match(layout, /navigationDirection\(/);
    assert.match(layout, /<AnimatePresence mode="wait" initial=\{false\} custom=\{direction\}>/);
    assert.match(layout, /key=\{location\.pathname\}/);
    assert.match(layout, /<Outlet\s*\/>/);
    assert.ok(layout.indexOf('<TopBar />') < layout.indexOf('<AnimatePresence'));
    assert.ok(layout.indexOf('<BottomNav />') > layout.indexOf('</AnimatePresence>'));
    assert.doesNotMatch(app, /<AnimatePresence|<motion\.div/);
    assert.equal(navigationDirection(9, 8, 'POP'), -1);
    assert.equal(navigationDirection(8, 9, 'POP'), 1);
    assert.equal(routeMotion.exit(-1).x, 22);
  });
  it('keeps all Radix interactive primitives with mobile bottom-drawer styles', () => {
    for (const [file, flag] of [
      ['components/ui/dialog.jsx', 'data-webview-dialog-content'],
      ['components/ui/alert-dialog.jsx', 'data-webview-alert-dialog-content'],
      ['components/ui/sheet.jsx', 'data-webview-sheet-content'],
      ['components/ui/drawer.jsx', 'data-webview-drawer-content'],
      ['components/ui/select.jsx', 'data-webview-select-content'],
    ]) {
      assert.match(read(file), new RegExp(`<[^>]*?${flag}`, 's'), `${file} lost mobile marker`);
      assert.ok(css.includes(`[${flag}]`), `${file} has no responsive CSS`);
    }
    assert.match(read('components/ui/select.jsx'), /data-webview-select-backdrop/);
    assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\[data-radix-popper-content-wrapper\]:has\(\[data-webview-select-content\]\)/);
    assert.match(css, /padding-bottom:\s*max\(1\.5rem, env\(safe-area-inset-bottom\)\)/);
    assert.match(css, /max-height:\s*calc\(100dvh - env\(safe-area-inset-top\) - 12px\)/);
  });
});
