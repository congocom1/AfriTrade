import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync('base44/shared/securityHeaders.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { checkRateLimit, rateLimitErrorResponse } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

function fakeDb() {
  let row;
  return { entities: { ApiRateLimit: {
    async filter({key_prefix, window_start}) { return row && row.key_prefix === key_prefix && row.window_start === window_start ? [row] : []; },
    async create(data) { row = { ...data, id: 'counter-1' }; return row; },
    async update(id, patch) { assert.equal(id, 'counter-1'); row = { ...row, ...patch }; return row; },
  } } };
}

describe('authenticated fail-closed rate-limit recovery contract (mocked storage)', () => {
  it('counts sequential calls; denies once the configured limit is reached', async () => {
    const db = fakeDb();
    const c = { keyPrefix:'synthetic', limit: 2, windowMs: 3600000, failClosed: true };
    assert.equal((await checkRateLimit(db, 'fake-client', c)).ok, true);
    assert.equal((await checkRateLimit(db, 'fake-client', c)).ok, true);
    const denied = await checkRateLimit(db, 'fake-client', c);
    assert.equal(denied.ok, false);
    assert.equal(denied.used, 2);
    const response = rateLimitErrorResponse(denied);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('Retry-After'), '3600');
  });
  it('returns 503 and a retry hint on counter storage failure', async () => {
    const db = { entities: { ApiRateLimit: { filter: async () => { throw new Error('offline'); } } } };
    const original = console.error;
    console.error = () => {};
    let denied;
    try { denied = await checkRateLimit(db, 'fake-client', { keyPrefix:'synthetic', limit:2, windowMs:3600000, failClosed:true }); }
    finally { console.error = original; }
    assert.equal(denied.ok, false);
    assert.equal(denied.unavailable, true);
    const response = rateLimitErrorResponse(denied);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Retry-After'), '120');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  });
});
