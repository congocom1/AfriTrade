import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canOpen } from '../src/lib/access.js';
import { isAdmin, WORKSPACES } from '../src/lib/roles.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

describe('platform role helper', () => {
  it('recognises the admin role', () => {
    assert.equal(isAdmin({ role: 'admin' }), true);
  });

  it('refuses every other role, including a missing one', () => {
    assert.equal(isAdmin({ role: 'user' }), false);
    assert.equal(isAdmin({ role: 'seller' }), false);
    assert.equal(isAdmin({ role: 'Admin' }), false);
    assert.equal(isAdmin({}), false);
    assert.equal(isAdmin(null), false);
    assert.equal(isAdmin(undefined), false);
  });

  it('never treats an undefined role as admin', () => {
    assert.equal(isAdmin({ role: undefined }), false);
    assert.equal(isAdmin({ role: null }), false);
  });
});

describe('workspace list', () => {
  it('exposes every workspace an administrator must be able to open', () => {
    const paths = WORKSPACES.map((workspace) => workspace.path);
    for (const required of ['/seller', '/creator', '/courier', '/employee']) {
      assert.ok(paths.includes(required), `missing workspace ${required}`);
    }
  });

  it('gives every workspace a translation key and a unique path', () => {
    const seen = new Set();
    for (const workspace of WORKSPACES) {
      assert.ok(workspace.key, 'workspace is missing a translation key');
      assert.ok(!seen.has(workspace.path), `duplicate workspace path ${workspace.path}`);
      seen.add(workspace.path);
    }
  });
});

describe('navigation surfaces', () => {
  const drawer = fs.readFileSync(path.join(root, 'src/components/MobileDrawer.jsx'), 'utf8');
  const topBar = fs.readFileSync(path.join(root, 'src/components/layout/TopBar.jsx'), 'utf8');

  it('renders the shared workspace list in the mobile drawer', () => {
    assert.ok(drawer.includes('<SpaceSwitcher variant="list"'), 'drawer must render the shared permission-aware switcher');
  });

  it('renders the shared workspace list in the desktop account menu', () => {
    assert.ok(topBar.includes('<SpaceSwitcher />'), 'desktop must render the shared permission-aware switcher');
    const switcher = fs.readFileSync(path.join(root, 'src/components/layout/SpaceSwitcher.jsx'), 'utf8');
    assert.ok(switcher.includes('if (access.isAdmin) spaces.push(BACKOFFICE)'));
  });

  it('no longer branches on the unused seller platform role', () => {
    for (const source of [drawer, topBar]) {
      assert.ok(!source.includes("role === 'seller'"), 'navigation still branches on the seller role');
      assert.ok(!source.includes('role === "seller"'), 'navigation still branches on the seller role');
    }
  });
});

describe('admin route protection', () => {
  const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');

  it('keeps the developer console behind the admin guard', () => {
    const developerRoute = app.indexOf('path="/developers"');
    assert.ok(developerRoute > -1, '/developers route is missing');

    // The route must sit inside an AdminOnly block, not in the public block.
    const adminOnly = app.lastIndexOf('<Route element={<RequireAccess />}>', developerRoute);
    const adminOnlyEnd = app.indexOf('</Route>', adminOnly);
    assert.ok(adminOnly > -1, '/developers is not inside an AdminOnly block');
    assert.ok(adminOnlyEnd > developerRoute, '/developers is outside the access guard');
    assert.equal(canOpen('/developers', { isAdmin: true }), true);
    for (const access of [null, {}, { roles: ['seller', 'creator', 'courier'], departments: ['technology', 'administration'] }]) {
      assert.equal(canOpen('/developers', access), false);
    }
  });

  it('hides the admin workspace link from non-administrators on the profile page', () => {
    const profile = fs.readFileSync(path.join(root, 'src/pages/Profile.jsx'), 'utf8');
    assert.ok(profile.includes('isAdmin(user)'), 'profile page does not gate the admin link');
  });
});
