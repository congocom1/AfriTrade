import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const raw = readFileSync('base44/functions/verifyDataRequest/entry.ts', 'utf8');
const src = raw.replace(/^import .*;\r?\n/gm, '');
assert.doesNotMatch(src, /^import /m);
const preamble = 'const { createClientFromRequest, escapeHtml, addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } = globalThis.__verificationDeps;\n';
const compiled = ts.transpileModule(preamble + src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
let client, shouldLimit = false, queries = 0, writes = 0, limiterCalls = 0;
globalThis.__verificationDeps = {
  createClientFromRequest: () => client,
  escapeHtml: v => String(v).replaceAll('<', '&lt;'),
  addSecurityHeaders: r => r,
  getClientKey: () => 'client',
  checkRateLimit: async (db, key, config) => {
    assert.equal(db, client.asServiceRole);
    assert.equal(key, 'client');
    assert.equal(config.failClosed, true);
    limiterCalls++;
    return { ok: !shouldLimit, limit: 60, used: 0 };
  },
  rateLimitErrorResponse: () => Response.json({ error: 'blocked' }, { status: 429 }),
};
const { default: handler } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const get = token => handler(new Request(`https://example.test/verifyDataRequest?token=${encodeURIComponent(token)}`));

describe('data-verification public capability throttling', () => {
  it('rejects attempts blocked by the real limiter before private token lookup', async () => {
    client = { asServiceRole: { entities: { DataRequest: { filter: async () => { queries++; return []; } } } } };
    shouldLimit = true;
    const response = await get('bad-token');
    assert.equal(response.status, 429);
    assert.equal(queries, 0);
    assert.equal(limiterCalls, 1);
  });
  it('invalid tokens are checked against the limiter before lookup', async () => {
    shouldLimit = false;
    const response = await get('bad-token');
    assert.equal(response.status, 404);
    assert.equal(queries, 1);
    assert.equal(limiterCalls, 2);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  });
  it('refuses other methods and oversized tokens without a privileged write', async () => {
    const post = await handler(new Request('https://example.test/verifyDataRequest?token=anything', { method: 'POST' }));
    assert.equal(post.status, 405);
    const long = await get('x'.repeat(129));
    assert.equal(long.status, 400);
    assert.equal(writes, 0);
    assert.equal(queries, 1);
  });
});
