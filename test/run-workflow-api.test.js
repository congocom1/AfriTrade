import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const src = readFileSync('base44/functions/runWorkflow/entry.ts', 'utf8').replace(/^import .*;\s*$/gm, '');
assert.doesNotMatch(src, /^import /m);
const preamble = `const { createClientFromRequest, cancelExecution, listDefinitions, resumeExecution, requireAdmin, addSecurityHeaders } = globalThis.__runWorkflowDeps;\n`;
const compiled = ts.transpileModule(preamble + src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const deps = { currentUser: null, calls: [],
  createClientFromRequest: () => ({ auth: { me: async () => deps.currentUser }, asServiceRole: { entities: new Proxy({}, { get() { assert.fail('Unauthorized privileged read/write'); } }) } }),
  requireAdmin: async client => {
    const user = await client.auth.me();
    return user?.role === 'admin' ? { ok: true, user } : { ok: false, response: Response.json({ error: 'Unauthorized' }, { status: user ? 403 : 401 }) };
  },
  addSecurityHeaders: response => response,
  listDefinitions: async () => { deps.calls.push(['list']); return [{ code: 'seller_onboarding' }]; },
  resumeExecution: async (_client, id, options) => { deps.calls.push(['retry', id, options]); return { ok: true, status: 'COMPLETED' }; },
  cancelExecution: async (_client, id, options) => { deps.calls.push(['cancel', id, options]); return { ok: true, status: 'CANCELLED' }; },
};
globalThis.__runWorkflowDeps = deps;
const { default: handler } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const post = body => new Request('https://example.test/functions/runWorkflow', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

describe('runWorkflow admin gateway', () => {
  it('rejects anonymous and non-admin requests without workflow side effects', async () => {
    deps.calls = [];
    deps.currentUser = null;
    assert.equal((await handler(post({ action: 'cancel', execution_id: 'some-id' }))).status, 401);
    deps.currentUser = { role: 'seller' };
    assert.equal((await handler(post({ action: 'list' }))).status, 403);
    assert.deepEqual(deps.calls, []);
  });
  it('denies invalid methods, actions and patches before invoking engine', async () => {
    deps.currentUser = { role: 'admin', email: 'admin@example.test' };
    deps.calls = [];
    assert.equal((await handler(new Request('https://example.test/functions/runWorkflow'))).status, 405);
    assert.equal((await handler(post({ action: 'start' }))).status, 400);
    assert.equal((await handler(post({ action: 'retry', execution_id: 'abc', input_patch: [] }))).status, 400);
    assert.equal((await handler(post({ action: 'cancel', execution_id: '' }))).status, 400);
    assert.deepEqual(deps.calls, []);
  });
  it('lists definitions and delegates retry/cancel with verified actor', async () => {
    deps.calls = [];
    const listed = await handler(post({ action: 'list' }));
    assert.deepEqual((await listed.json()).definitions, [{ code: 'seller_onboarding' }]);
    assert.equal(listed.headers.get('cache-control'), 'no-store');
    assert.equal((await handler(post({ action: 'retry', execution_id: 'e1', input_patch: { decision: 'approve' } }))).status, 200);
    assert.equal((await handler(post({ action: 'cancel', execution_id: 'e2', reason: 'Owner approved' }))).status, 200);
    assert.deepEqual(deps.calls.map(c => c[0]), ['list', 'retry', 'cancel']);
    assert.equal(deps.calls[1][2].actorEmail, 'admin@example.test');
    assert.equal(deps.calls[2][2].reason, 'Owner approved');
  });
  it('does not report false success when the engine refuses an operation', async () => {
    deps.cancelExecution = async () => ({ ok: false, error: 'Already completed' });
    assert.equal((await handler(post({ action: 'cancel', execution_id: 'e3' }))).status, 409);
  });
});
