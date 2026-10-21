import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { mergeRealtimeRecord } from '../src/lib/portalData.js';
import { computePriceBreakdown, computePriceBreakdownCents } from '../src/lib/pricing.js';
import { formatUsdAmount, formatUSD } from '../src/lib/format.js';

test('event replay, updates and deletion keep one row per record', () => {
  const row = { id: 'one', status: 'open', created_date: '2026-10-20' };
  const initial = mergeRealtimeRecord([], { type: 'create', data: row });
  const replay = mergeRealtimeRecord(initial, { type: 'create', data: row });
  assert.equal(replay.length, 1);
  const updated = mergeRealtimeRecord(replay, { type: 'update', data: { id: 'one', status: 'handled' } });
  assert.equal(updated[0].created_date, row.created_date);
  assert.equal(updated[0].status, 'handled');
  assert.deepEqual(mergeRealtimeRecord(updated, { type: 'delete', id: 'one' }), []);
  assert.deepEqual(mergeRealtimeRecord(initial, { type: 'create', data: {} }), initial);
});

test('decimal currency boundaries and legacy pricing agree with integer cents', () => {
  const cfg = { international_shipping_usd: 12.35, import_cost_percent: 8, local_logistics_usd: 2, platform_margin_percent: 15, payment_fee_percent: 2.5 };
  for (const source_type of ['local_seller', 'international_supplier']) {
    const product = { price_usd: 19.99, source_type };
    const dollars = computePriceBreakdown(product, cfg);
    const cents = computePriceBreakdownCents(product, cfg);
    assert.equal(formatUsdAmount(dollars.total), formatUSD(cents.totalCents));
    assert.equal(dollars.total_cents, cents.totalCents);
  }
  assert.equal(formatUsdAmount(1234.56), '$1,234.56');
});

test('advanced analytics uses recorded sessions and fails on unavailable storage', async () => {
  let allowed = true, failRead = false;
  const events = [
    { session_id: 'a', name: 'cart_add' }, { session_id: 'a', name: 'cart_add' },
    { session_id: 'a', name: 'order_checkout_started' }, { session_id: 'b', name: 'cart_add' },
  ];
  globalThis.__workspaceAnalytics = {
    createClientFromRequest: () => ({ asServiceRole: { entities: { AnalyticsEvent: { filter: async () => { if (failRead) throw new Error('offline'); return events; } } } } }),
    requireAdmin: async () => allowed ? { ok: true } : { ok: false, response: Response.json({ error: 'Forbidden' }, { status: 403 }) },
    addSecurityHeaders: r => r, getClientKey: () => 'test', checkRateLimit: async () => ({ ok: true }), rateLimitErrorResponse: () => new Response('', { status: 429 }),
  };
  try {
    const source = (await readFile(new URL('../base44/functions/advancedAnalytics/entry.ts', import.meta.url), 'utf8')).replace(/^import .*;\s*$/gm, '');
    const preamble = 'const { createClientFromRequest, requireAdmin, addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } = globalThis.__workspaceAnalytics;\n';
    const code = ts.transpileModule(preamble + source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    const run = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
    const invoke = (days = 30) => run(new Request('https://test/analytics', { method: 'POST', body: JSON.stringify({ action: 'conversion-funnel', days }) }));
    const response = await invoke();
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).funnel.map(s => s.count), [2, 2, 1]);
    assert.equal((await invoke(-1)).status, 400);
    allowed = false;
    assert.equal((await invoke()).status, 403);
    allowed = true; failRead = true;
    assert.equal((await invoke()).status, 500);
  } finally { delete globalThis.__workspaceAnalytics; }
});
