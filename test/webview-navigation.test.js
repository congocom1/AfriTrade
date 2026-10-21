import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { navigationDirection, routeMotion } from '../src/lib/navigationDirection.js';
import { pullDistance, REFRESH_THRESHOLD } from '../src/lib/pullGesture.js';

const walk = dir => readdirSync(dir).flatMap(entry => {
  const path = join(dir, entry);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

describe('WebView navigation gestures', () => {
  it('uses correct exit/entrance directions for browser back and forward', () => {
    assert.equal(navigationDirection(4, 3, 'POP'), -1);
    assert.equal(navigationDirection(3, 4, 'POP'), 1);
    assert.equal(navigationDirection(4, 5, 'PUSH'), 1);
    assert.equal(navigationDirection(4, 4, 'REPLACE'), 0);
    assert.equal(routeMotion.initial(-1).x, -22);
    assert.equal(routeMotion.exit(-1).x, 22);
    assert.equal(routeMotion.exit(1).x, -22);
  });
  it('recognizes only downward vertical pull gestures, not sideways swipes', () => {
    const from = { x: 100, y: 100 };
    assert.equal(pullDistance(from, { x: 100, y: 300 }) >= REFRESH_THRESHOLD, true);
    assert.equal(pullDistance(from, { x: 300, y: 150 }), 0);
    assert.equal(pullDistance(from, { x: 100, y: 50 }), 0);
    assert.equal(pullDistance(null, from), 0);
    assert.equal(pullDistance(from, { x: 100, y: 500 }), 112);
  });
});

describe('WebView UI safety gates', () => {
  it('does not render native select controls in application JSX', () => {
    const offenders = walk('src').filter(f => f.endsWith('.jsx') && !f.endsWith('legacy-select.jsx'))
      .filter(f => /<select(?=[\s>])/.test(readFileSync(f, 'utf8')));
    assert.deepEqual(offenders, []);
    const compat = readFileSync('src/components/ui/legacy-select.jsx', 'utf8');
    assert.match(compat, /SelectTrigger/);
    assert.match(compat, /SelectContent/);
    assert.match(compat, /SelectItem/);
  });
  it('has an iOS safe-area viewport and explicit scroll constraints', () => {
    const html = readFileSync('index.html', 'utf8');
    const css = readFileSync('src/index.css', 'utf8');
    assert.match(html, /viewport-fit=cover/);
    assert.match(css, /overscroll-behavior-y:\s*none/);
    assert.match(css, /main, \.brand-app-shell main/);
    assert.match(css, /\(pointer: coarse\)/);
    assert.match(readFileSync('src/components/layout/TopBar.jsx', 'utf8'), /env\(safe-area-inset-top\)/);
    assert.match(readFileSync('src/components/layout/BottomNav.jsx', 'utf8'), /env\(safe-area-inset-bottom\)/);
    assert.match(readFileSync('src/components/QuantityStepper.jsx', 'utf8'), /min-h-11 min-w-11/);
  });
  it('enables touch refresh on the home, search and categories product feeds', () => {
    for (const page of ['Home', 'Search', 'Categories']) {
      const code = readFileSync(`src/pages/${page}.jsx`, 'utf8');
      assert.match(code, /usePullToRefresh\(load/);
      assert.match(code, /\.\.\.pullHandlers/);
      assert.match(code, /\{pullIndicator\}/);
    }
  });
});
