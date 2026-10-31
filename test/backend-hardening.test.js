import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function compiled(path, preamble) {
  const src = readFileSync(path, 'utf8').replace(/^import .*;\r?\n/gm, '');
  assert.doesNotMatch(src, /^import /m, `Unmocked import in ${path}`);
  return ts.transpileModule(`${preamble}\n${src}`, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
async function load(path, preamble) {
  const code = compiled(path, preamble);
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const deny = async (client) => {
  const user = await client.auth.me().catch(() => null);
  return user?.role === 'admin'
    ? { ok: true, user }
    : { ok: false, response: Response.json({ error: 'Denied' }, { status: user ? 403 : 401 }) };
};
const noEntities = new Proxy({}, { get(_target, name) { assert.fail(`Unauthorized service-role use: ${String(name)}`); } });
const securityDeps = {
  currentClient: { auth: { me: async () => null }, asServiceRole: { entities: noEntities } },
  createClientFromRequest: () => securityDeps.currentClient,
  requireAdmin: deny,
  addSecurityHeaders: (res) => res,
  getClientKey: () => 'test-client',
  checkRateLimit: async () => ({ ok: true }),
  rateLimitErrorResponse: () => Response.json({ error: 'limited' }, { status: 429 }),
  escapeHtml: (s) => s,
  typeLabel: () => 'Request',
  verificationUrl: () => 'https://example.test/verify',
  STUCK_AFTER_MS: 60000,
  listStuckExecutions: async () => assert.fail('Queue must not run'),
  resumeExecution: async () => assert.fail('Queue must not run'),
  startWorkflow: async () => assert.fail('Queue must not run'),
};
globalThis.__backendHardeningDeps = securityDeps;
const preamble = `const { createClientFromRequest, requireAdmin, addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse, escapeHtml, typeLabel, verificationUrl, STUCK_AFTER_MS, listStuckExecutions, resumeExecution, startWorkflow } = globalThis.__backendHardeningDeps;`;
const verification = (await load('base44/functions/sendDataRequestVerification/entry.ts', preamble)).default;
const queue = (await load('base44/functions/processWorkflowQueue/entry.ts', preamble)).default;
const confirm = (await load('base44/functions/confirm-payment/entry.ts', preamble)).default;
const label = (await load('base44/functions/shippingLabel/entry.ts', preamble)).default;
const post = (name, body) => new Request(`https://example.test/functions/${name}`, {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
});

describe('unauthorized service-role write protection', () => {
  for (const [name, handler, data] of [
    ['sendDataRequestVerification', verification, { request_id: 'secret-id' }],
    ['processWorkflowQueue', queue, {}],
  ]) {
    it(`${name} rejects anonymous calls before touching any service-role entity`, async () => {
      securityDeps.currentClient = ({ auth: { me: async () => null }, asServiceRole: { entities: noEntities } });
      const response = await handler(post(name, data));
      assert.equal(response.status, 401);
    });
    it(`${name} rejects nonadmins without side effects`, async () => {
      securityDeps.currentClient = ({ auth: { me: async () => ({ role: 'user' }) }, asServiceRole: { entities: noEntities } });
      const response = await handler(post(name, data));
      assert.equal(response.status, 403);
    });
  }
});

describe('manual payment confirmation cannot forge card payments', () => {
  it('rejects card orders for admins before any payment/fulfillment update', async () => {
    const cardOrder = { id: 'order-1', order_number: 'CMD-1', payment_provider: 'card', payment_status: 'PENDING' };
    const entities = {
      Order: { filter: async () => [cardOrder], update: async () => assert.fail('Card order was marked paid') },
      FulfillmentOrder: { filter: async () => assert.fail('Fulfillment was advanced') },
    };
    securityDeps.currentClient = ({
      auth: { me: async () => ({ role: 'admin', id: 'u1' }) },
      asServiceRole: { entities },
    });
    const response = await confirm(post('confirm-payment', { order_number: 'CMD-1', payment_reference: 'fake-paid' }));
    assert.equal(response.status, 409);
    assert.equal(cardOrder.payment_status, 'PENDING');
  });
});

describe('shipping label status controls', () => {
  it('rejects invalid and skipped transitions without updating label', async () => {
    const entry = { id: 'label-1', label_id: 'LBL-1', order_number: 'CMD-1', status: 'generated' };
    let updated = 0;
    securityDeps.currentClient = ({
      auth: { me: async () => ({ role: 'admin', email: 'admin@example.test' }) },
      asServiceRole: { entities: {
        ShippingLabel: { get: async () => entry, update: async (_id, patch) => { updated++; Object.assign(entry, patch); return entry; } },
        AuditLog: { create: async () => ({}) },
      } },
    });
    assert.equal((await label(post('shippingLabel', { action: 'update-status', label_id: 'label-1', status: 'delivered' }))).status, 409);
    assert.equal((await label(post('shippingLabel', { action: 'update-status', label_id: 'label-1', status: 'paid' }))).status, 400);
    assert.equal((await label(post('shippingLabel', { action: 'print', label_ids: ['label-1'] }))).status, 200);
    assert.equal(entry.status, 'printed');
    assert.equal((await label(post('shippingLabel', { action: 'print', label_ids: ['label-1'] }))).status, 200);
    assert.equal(updated, 1, 'Repeated print is idempotent');
    assert.equal((await label(post('shippingLabel', { action: 'update-status', label_id: 'label-1', status: 'in_transit' }))).status, 200);
    assert.equal((await label(post('shippingLabel', { action: 'print', label_ids: ['label-1'] }))).status, 409);
    assert.equal(entry.status, 'in_transit');
  });

  it('prevalidates every label in a batch to avoid partial printing', async () => {
    const generated = { id: 'label-a', order_number: 'CMD-A', status: 'generated' };
    const delivered = { id: 'label-b', order_number: 'CMD-B', status: 'delivered' };
    let writeCount = 0;
    securityDeps.currentClient = {
      auth: { me: async () => ({ role: 'admin', email: 'admin@example.test' }) },
      asServiceRole: { entities: { ShippingLabel: {
        get: async id => ({ 'label-a': generated, 'label-b': delivered })[id],
        update: async () => { writeCount++; return {}; },
      } } },
    };
    const response = await label(post('shippingLabel', { action: 'print', label_ids: ['label-a', 'label-b'] }));
    assert.equal(response.status, 409);
    assert.equal(writeCount, 0);
    assert.equal(generated.status, 'generated');
  });
});
