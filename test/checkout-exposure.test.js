import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const checkoutSource = readFileSync('base44/functions/create-checkout/entry.ts', 'utf8');
const orderSource = readFileSync('base44/functions/place-order/entry.ts', 'utf8');
const compile = (text) => ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const dynamicImport = async (text) => import(`data:text/javascript;base64,${Buffer.from(compile(text)).toString('base64')}`);

const legacy = await dynamicImport(checkoutSource);
const runtimeSource = orderSource
  .replace(/import \{ createClientFromRequest \} from "npm:@base44\/sdk@[^"]+";/, 'const { createClientFromRequest } = globalThis.__checkoutExposureDeps;')
  .replace(/import \{ postWalletEntry as postLedgerEntry \} from "\.\.\/\.\.\/shared\/walletLedger\.ts";/, 'const { postLedgerEntry } = globalThis.__checkoutExposureDeps;')
  .replace(/import \{ ClientInputError, errorStatus \} from "\.\.\/\.\.\/shared\/httpErrors\.ts";/, 'const { ClientInputError, errorStatus } = globalThis.__checkoutExposureDeps;')
  .replace(/import \{ addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse \} from "\.\.\/\.\.\/shared\/securityHeaders\.ts";/, 'const { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } = globalThis.__checkoutExposureDeps;');
assert.doesNotMatch(runtimeSource, /^(?!\/\/).*from "(?:npm:|\.\.\/\.\.\/shared\/)/m);
class InputError extends Error { status = 400; }
globalThis.__checkoutExposureDeps = {
  createClientFromRequest: () => ({ auth: { me: async () => null }, asServiceRole: { entities: { PlatformSetting: { list: async () => [] } } } }),
  postLedgerEntry: async () => assert.fail('Should not credit a wallet'),
  ClientInputError: InputError,
  errorStatus: (error) => error.status === 400 ? 400 : 500,
  addSecurityHeaders: (response) => response,
  getClientKey: () => 'test-client',
  checkRateLimit: async () => ({ ok: true }),
  rateLimitErrorResponse: () => Response.json({ error: 'Rate limited' }, { status: 429 }),
};
const placeOrderModule = await dynamicImport(runtimeSource);

// These tests intentionally exercise the compiled public entry points, rather
// than only checking that the source contains a string such as "auth.me".
describe('Wix checkout abuse boundary', () => {
  it('legacy direct endpoint does not call Wix or create privileged rows', async () => {
    const response = await legacy.default(new Request('https://example.test/functions/create-checkout', {
      method: 'POST', body: JSON.stringify({ productId: 'CMD-123', quantity: 1 }),
    }));
    assert.equal(response.status, 410);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.doesNotMatch(checkoutSource, /asServiceRole|Deno\.env|fetch\(/);
  });

  it('a guest card order is rejected before reading inventory or writing an order', async () => {
    const fakeDb = { entities: new Proxy({}, { get: (_target, property) => assert.fail(`Database touched: ${String(property)}`) }) };
    await assert.rejects(placeOrderModule.placeOrder(fakeDb, {
      paymentMethodId: 'card', items: [{ product_id: 'p1', quantity: 1 }],
    }), /Connectez-vous/);
  });

  it('the HTTP function refuses a guest card request without invoking Wix or creating an order', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => assert.fail('Wix must not be called by guest');
    try {
      const response = await placeOrderModule.default(new Request('https://example.test/functions/place-order', {
        method: 'POST', body: JSON.stringify({ paymentMethodId: 'card', items: [{ product_id: 'p1', quantity: 1 }] }),
      }));
      assert.equal(response.status, 401);
    } finally { globalThis.fetch = originalFetch; }
  });

  it('authenticated card session takes amount from the server Order and binds the buyer to the pending purchase', async () => {
    const priorFetch = globalThis.fetch;
    const priorDeno = globalThis.Deno;
    const rows = [];
    let posted;
    globalThis.Deno = { env: { get: (k) => ({ WIX_CHECKOUT_API_KEY: 'server-private-key', WIX_CHECKOUT_SITE_ID: 'site' })[k] } };
    globalThis.fetch = async (url, options) => {
      assert.match(url, /^https:\/\/www\.wixapis\.com\//);
      posted = JSON.parse(options.body);
      return Response.json({ checkoutSession: { id: 'wix-session-1', redirectUrl: 'https://www.wix.com/pay/session' } });
    };
    try {
      const url = await placeOrderModule.startVerifiedCardCheckout({ entities: { Base44Purchase: { create: async (row) => rows.push(row) } } },
        { order_number: 'CMD-100', total_cents: 1525 },
        { buyerId: 'verified-user', buyerEmail: 'verified@example.test', appUrl: 'https://afritrade-1.base44.app/' });
      assert.equal(url, 'https://www.wix.com/pay/session');
      assert.equal(posted.cart.items[0].price, '15.25');
      assert.equal(posted.cart.customerInfo.email, 'verified@example.test');
      assert.equal(posted.callbackUrls.thankYouPageUrl, 'https://afritrade-1.base44.app/order/CMD-100');
      assert.equal(rows.length, 1);
      assert.equal(rows[0].checkoutSessionId, 'wix-session-1');
      assert.equal(rows[0].appUserId, 'verified-user');
      assert.equal(rows[0].productId, 'CMD-100');
      assert.equal(rows[0].status, 'pending');
    } finally { globalThis.fetch = priorFetch; globalThis.Deno = priorDeno; }
  });
});
