import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { functionData, loadRecordGroups } from '../src/lib/portalData.js';

test('portal reads distinguish empty data from unavailable or malformed data', async () => {
  assert.deepEqual(await loadRecordGroups({ orders: async () => [] }), { orders: [] });
  await assert.rejects(loadRecordGroups({ orders: async () => { throw new Error('offline'); } }), /offline/);
  await assert.rejects(loadRecordGroups({ orders: async () => ({ error: 'failed' }) }), /Invalid orders/);
  assert.deepEqual(functionData({ data: { keys: [] } }), { keys: [] });
  assert.throws(() => functionData({ keys: [] }), /Invalid/);
  assert.throws(() => functionData({ data: { error: 'denied' } }), /Invalid/);
});

async function handler(file) {
  const source = await readFile(new URL(`../base44/functions/${file}/entry.ts`, import.meta.url), 'utf8');
  const injected = source.replace(/^import .*;\s*$/gm, '') + '\n';
  const preamble = 'const { createClientFromRequest, requireAdmin, addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } = globalThis.__portalContracts;\n';
  const compiled = ts.transpileModule(preamble + injected, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return (await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)).default;
}

test('API-key function actions and REST routes share the admin gate and response shape', async (t) => {
  const writes = [];
  let allowed = true;
  let failList = false;
  let failUpdate = false;
  const record = { id: 'key-1', name: 'Integration', key_hash: 'secret-hash', key_prefix: 'cg_', scopes: [], active: true };
  const db = { entities: {
    ApiKey: {
      filter: async () => { if (failList) throw new Error('storage unavailable'); return [record]; },
      get: async () => record,
      create: async (value) => { writes.push(value); return { id: 'new-key', ...value }; },
      update: async (id, value) => { if (failUpdate) throw new Error('write failed'); writes.push({ id, ...value }); return { id, ...value }; },
    },
    Tenant: { get: async () => ({ id: 'tenant-1', name: 'Shop', owner_email: 'owner@example.test' }) },
    AuditLog: { create: async () => ({}) },
  } };
  globalThis.__portalContracts = {
    createClientFromRequest: () => ({ asServiceRole: db }),
    requireAdmin: async () => allowed ? { ok: true, user: { email: 'admin@example.test' } } : { ok: false, response: Response.json({ error: 'Forbidden' }, { status: 403 }) },
    addSecurityHeaders: (response) => response,
    getClientKey: () => 'test-client',
    checkRateLimit: async () => ({ ok: true }),
    rateLimitErrorResponse: () => Response.json({ error: 'rate' }, { status: 429 }),
  };
  const run = await handler('manage-api-keys');
  const invoke = (body) => run(new Request('https://example.test/functions/manage-api-keys', { method: 'POST', body: JSON.stringify(body) }));
  try {
    await t.test('SDK list exposes keys but no hashes', async () => {
      const response = await invoke({ action: 'list' });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.keys[0].id, 'key-1');
      assert.equal(body.keys[0].key_hash, undefined);
    });
    await t.test('existing REST list stays available', async () => {
      assert.equal((await run(new Request('https://example.test/api-keys'))).status, 200);
    });
    await t.test('create returns the one-time secret and stores only its hash', async () => {
      const response = await invoke({ action: 'create', name: 'Integration', tenant_id: 'tenant-1', scopes: ['orders.read'] });
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.match(body.api_key, /^cg_/);
      assert.equal(writes.at(-1).api_key, undefined);
      assert.equal(writes.at(-1).key_hash.length, 64);
      assert.notEqual(writes.at(-1).key_hash, body.api_key);
    });
    await t.test('invalid expiration fails before writes', async () => {
      const count = writes.length;
      assert.equal((await invoke({ action: 'create', name: 'Bad', tenant_id: 'tenant-1', expires_at: 'invalid' })).status, 400);
      assert.equal(writes.length, count);
    });
    await t.test('revoke persists inactive state', async () => {
      assert.equal((await invoke({ action: 'revoke', id: 'key-1' })).status, 200);
      assert.equal(writes.at(-1).active, false);
    });
    await t.test('failed revocation is not reported as success', async () => {
      failUpdate = true;
      const original = console.error; console.error = () => {};
      try { assert.equal((await invoke({ action: 'revoke', id: 'key-1' })).status, 500); }
      finally { console.error = original; failUpdate = false; }
    });
    await t.test('missing IDs and unknown actions are rejected', async () => {
      assert.equal((await invoke({ action: 'revoke' })).status, 400);
      assert.equal((await invoke({ action: 'unknown' })).status, 400);
    });
    await t.test('non-admins cannot use SDK actions', async () => {
      allowed = false;
      assert.equal((await invoke({ action: 'list' })).status, 403);
      allowed = true;
    });
    await t.test('storage failures return an error instead of an empty success', async () => {
      failList = true;
      const original = console.error;
      console.error = () => {};
      try { assert.equal((await invoke({ action: 'list' })).status, 500); }
      finally { console.error = original; }
    });
  } finally { delete globalThis.__portalContracts; }
});

test('warehouse rejects invalid stock before persistence', async () => {
  let reads = 0;
  globalThis.__portalContracts = {
    createClientFromRequest: () => ({ asServiceRole: { entities: { ChinaWarehouseInventory: { filter: async () => { reads++; return []; } } } } }),
    requireAdmin: async () => ({ ok: true, user: { email: 'admin@example.test' } }),
  };
  const run = await handler('chinaWarehouse');
  try {
    for (const quantity of [-3, 1.5, 'invalid']) {
      const response = await run(new Request('https://example.test/functions/chinaWarehouse', { method: 'POST', body: JSON.stringify({ action: 'add-stock', warehouse_id: 'wh', product_id: 'product', sku: 'sku', quantity }) }));
      assert.equal(response.status, 400);
    }
    for (const cost_usd of [-1, 'invalid']) {
      const response = await run(new Request('https://example.test/functions/chinaWarehouse', { method: 'POST', body: JSON.stringify({ action: 'add-stock', warehouse_id: 'wh', product_id: 'product', sku: 'sku', quantity: 1, cost_usd }) }));
      assert.equal(response.status, 400);
    }
    assert.equal(reads, 0);
  } finally { delete globalThis.__portalContracts; }
});
