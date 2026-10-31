import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const sellerProfileSource = readFileSync('base44/functions/sellerProfile/entry.ts', 'utf8');
const webhookSource = readFileSync('base44/functions/payments-webhook/entry.ts', 'utf8');

const compile = (text) => ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const dynamicImport = async (text) => import(`data:text/javascript;base64,${Buffer.from(compile(text)).toString('base64')}`);

// Drive the real sellerProfile handler with the shared security helpers stubbed out,
// so the storefront-branding validation is exercised end to end.
const runtimeSource = sellerProfileSource
  .replace(/import \{ createClientFromRequest \} from ['"]npm:@base44\/sdk@[^'"]+['"];/, 'const { createClientFromRequest } = globalThis.__sellerProfileDeps;')
  .replace(/import \{ sameIdentity \} from '\.\.\/\.\.\/shared\/fulfillmentAccess\.js';/, 'const sameIdentity = (a, b) => !!a && !!b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();')
  .replace(/import \{ addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse \} from ['"]\.\.\/\.\.\/shared\/securityHeaders\.ts['"];/, 'const { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } = globalThis.__sellerProfileDeps;');
// Every dependency must be stubbed, or the transpiled module cannot be imported from a data: URL.
assert.doesNotMatch(runtimeSource, /^(?!\/\/).*\bfrom ['"](?:npm:|\.\.\/\.\.\/shared\/)/m);

const seller = { id: 'seller-1', email: 'seller@example.com', status: 'active', name: 'Boutique' };
const updates = [];

globalThis.__sellerProfileDeps = {
  addSecurityHeaders: (response) => response,
  getClientKey: () => 'test-client',
  checkRateLimit: async () => ({ ok: true }),
  rateLimitErrorResponse: () => new Response('rate limited', { status: 429 }),
  createClientFromRequest: () => ({
    auth: { me: async () => ({ id: 'user-1', email: 'seller@example.com', role: 'user' }) },
    asServiceRole: {
      entities: {
        Seller: {
          get: async () => seller,
          update: async (id, patch) => { updates.push(patch); return { ...seller, ...patch }; },
        },
        AuditLog: { create: async () => ({}) },
      },
    },
  }),
};

const handler = (await dynamicImport(runtimeSource)).default;

const profileRequest = (profile) => new Request('https://afritrade-2.base44.app/functions/sellerProfile', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'profile', seller_id: seller.id, profile }),
});

describe('seller branding URL scheme validation', () => {
  it('rejects javascript: and data: storefront branding URLs without persisting them', async () => {
    for (const hostile of ['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'vbscript:msgbox(1)']) {
      for (const field of ['logo_url', 'banner_url']) {
        const response = await handler(profileRequest({ [field]: hostile }));
        assert.equal(response.status, 400, `${field} accepted ${hostile}`);
        assert.deepEqual(await response.json(), { error: 'Lien invalide' });
      }
    }
    assert.equal(updates.length, 0);
  });

  it('still accepts real http(s) links and clearing the field', async () => {
    const ok = await handler(profileRequest({ logo_url: 'https://cdn.example.com/logo.png', banner_url: 'http://cdn.example.com/banner.png' }));
    assert.equal(ok.status, 200);
    const cleared = await handler(profileRequest({ logo_url: '' }));
    assert.equal(cleared.status, 200);
    assert.deepEqual(updates.at(-1), { logo_url: '' });
  });

  it('keeps rejecting unknown fields and oversized values', async () => {
    assert.equal((await handler(profileRequest({ evil: 'x' }))).status, 400);
    assert.equal((await handler(profileRequest({ name: 'x'.repeat(121) }))).status, 400);
  });
});

describe('payments webhook idempotency marker', () => {
  it('uses schema-defined IdempotencyKey fields only', () => {
    // Regression: the marker was written with used_at/context and no scope, so the
    // write was invalid and the replay guard could never fire.
    assert.doesNotMatch(webhookSource, /^\s*used_at:/m);
    assert.doesNotMatch(webhookSource, /^\s*context:/m);
    assert.match(webhookSource, /scope: "payments_webhook"/);
    assert.match(webhookSource, /status: "completed"/);
  });

  it('short-circuits on the persisted marker field', () => {
    assert.match(webhookSource, /if \(existing\.length && existing\[0\]\.status === "completed"\)/);
    assert.doesNotMatch(webhookSource, /existing\[0\]\.used_at/);
  });

  it('still refuses a payment that does not match the stored order', () => {
    assert.match(webhookSource, /return new Response\("Payment mismatch", \{ status: 409 \}\)/);
  });
});