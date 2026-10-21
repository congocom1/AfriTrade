import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync('base44/shared/securityHeaders.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { checkRateLimit, rateLimitErrorResponse } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const config = { keyPrefix: 'place_order', limit: 1, windowMs: 60000, failClosed: true };

describe('rate-limit storage failures', () => {
  it('denies a billable request when the counter query fails', async () => {
    const client = { entities: { ApiRateLimit: { filter: async () => { throw Error('unavailable'); } } } };
    const result = await checkRateLimit(client, 'identity', config);
    assert.equal(result.ok, false);
    assert.equal(result.unavailable, true);
    const response = rateLimitErrorResponse(result);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).status, 'unavailable');
  });
  it('denies a billable request when the counter write fails', async () => {
    const client = { entities: { ApiRateLimit: { filter: async () => [], create: async () => { throw Error('write failed'); } } } };
    const result = await checkRateLimit(client, 'identity', config);
    assert.equal(result.ok, false);
    assert.equal(result.unavailable, true);
  });
  it('enforces the available quota with 429, not 503', async () => {
    const row = { id: 'counter', request_count: 1 };
    const client = { entities: { ApiRateLimit: { filter: async () => [row] } } };
    const result = await checkRateLimit(client, 'identity', config);
    assert.equal(result.ok, false);
    assert.equal(result.unavailable, undefined);
    assert.equal(rateLimitErrorResponse(result).status, 429);
  });
  it('retains pre-auth no-storage behavior and can operate with a working counter', async () => {
    assert.equal((await checkRateLimit(null, 'anonymous', config)).ok, true);
    let created;
    const client = { entities: { ApiRateLimit: { filter: async () => [], create: async (row) => { created = row; return { id: 'counter', ...row }; } } } };
    assert.equal((await checkRateLimit(client, 'account', config)).ok, true);
    assert.equal(created.request_count, 1);
  });
});
