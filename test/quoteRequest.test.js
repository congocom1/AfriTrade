import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = fs.readFileSync(path.join(root, 'base44/functions/quoteRequest/entry.ts'), 'utf8');
let moduleSequence = 0;

async function loadHandler(dependencies) {
  globalThis.__quoteRequestDependencies = dependencies;
  let moduleSource = source
    .replace(
      /import\s+\{\s*createClientFromRequest\s*\}\s+from\s+["']npm:@base44\/sdk@[^"']+["'];?/,
      'const { createClientFromRequest } = globalThis.__quoteRequestDependencies;',
    )
    .replace(
      /import\s+\{[^}]+\}\s+from\s+["']\.\.\/\.\.\/shared\/securityHeaders\.ts["'];?/,
      'const { addSecurityHeaders, checkRateLimit, getClientKey, rateLimitErrorResponse } = globalThis.__quoteRequestDependencies.securityHeaders;',
    );
  assert.doesNotMatch(moduleSource, /npm:@base44\/sdk|securityHeaders\.ts/);
  moduleSource = ts.transpileModule(moduleSource, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const modulePath = path.join(path.dirname(fileURLToPath(import.meta.url)), `quoteRequest-${++moduleSequence}.testmod.mjs`);
  fs.writeFileSync(modulePath, moduleSource);
  return import(pathToFileURL(modulePath).href);
}

function dependencies({ user, entities }) {
  return {
    createClientFromRequest: () => ({ auth: { me: async () => user }, asServiceRole: { entities } }),
    securityHeaders: {
      addSecurityHeaders: (response) => response,
      checkRateLimit: async () => ({ ok: true }),
      getClientKey: () => '192.0.2.10',
      rateLimitErrorResponse: () => Response.json({ error: 'rate limited' }, { status: 429 }),
    },
  };
}

function request(body) {
  return new Request('https://local.test/functions/quoteRequest', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('quoteRequest endpoint', () => {
  it('rejects anonymous requests before reading products', async () => {
    let reads = 0;
    const handler = await loadHandler(dependencies({ user: null, entities: { Product: { get: async () => { reads += 1; } } } }));
    const response = await handler.default(request({ action: 'submit', product_id: 'product-1', quantity: 10 }));

    assert.equal(response.status, 401);
    assert.equal(reads, 0);
  });

  it('derives the seller from the product and rejects quantities below MOQ', async () => {
    const product = { id: 'product-1', title: 'Bulk coffee', status: 'published', is_b2b: true, moq: 50, seller_id: 'seller-1' };
    const created = [];
    const entities = {
      Product: { get: async () => product },
      Seller: { get: async () => ({ id: 'seller-1', name: 'Coffee Co', email: 'seller@example.test' }) },
      QuoteRequest: { create: async (row) => { created.push(row); return { id: 'quote-1', ...row }; } },
      AuditLog: { create: async () => ({}) },
    };
    const handler = await loadHandler(dependencies({ user: { email: 'buyer@example.test', name: 'Buyer' }, entities }));
    const tooSmall = await handler.default(request({ action: 'submit', product_id: product.id, quantity: 49, seller_email: 'attacker@example.test' }));
    const accepted = await handler.default(request({ action: 'submit', product_id: product.id, quantity: 50, seller_email: 'attacker@example.test' }));

    assert.equal(tooSmall.status, 400);
    assert.equal(accepted.status, 200);
    assert.equal(created[0].seller_email, 'seller@example.test');
    assert.equal(created[0].buyer_email, 'buyer@example.test');
  });

  it('does not let an unrelated user respond to a quote', async () => {
    let updates = 0;
    const quote = { id: 'quote-1', buyer_email: 'buyer@example.test', seller_email: 'seller@example.test', status: 'submitted' };
    const entities = { QuoteRequest: { get: async () => quote, update: async () => { updates += 1; } } };
    const handler = await loadHandler(dependencies({ user: { email: 'other@example.test' }, entities }));
    const response = await handler.default(request({ action: 'respond', quote_id: quote.id, quoted_unit_price_usd: 10 }));

    assert.equal(response.status, 403);
    assert.equal(updates, 0);
  });

  it('allows the buyer to accept a supplier response', async () => {
    const quote = { id: 'quote-1', buyer_email: 'buyer@example.test', seller_email: 'seller@example.test', status: 'responded' };
    const entities = {
      QuoteRequest: {
        get: async () => quote,
        update: async (_id, patch) => ({ ...quote, ...patch }),
      },
    };
    const handler = await loadHandler(dependencies({ user: { email: 'buyer@example.test' }, entities }));
    const response = await handler.default(request({ action: 'accept', quote_id: quote.id }));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.quote.status, 'accepted');
    assert.ok(body.quote.accepted_at);
  });
});