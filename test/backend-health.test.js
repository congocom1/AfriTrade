import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const original = readFileSync('base44/functions/health/entry.ts', 'utf8');
const compiled = ts.transpileModule(original, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { default: handler } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

describe('public API liveness endpoint', () => {
  for (const method of ['GET', 'POST']) {
    it(`${method} reports only public liveness fields`, async () => {
      const result = await handler(new Request('https://api.example.test/health', { method }));
      assert.equal(result.status, 200);
      assert.deepEqual(await result.json(), { status: 'ok', service: 'AfriTrade API' });
      assert.equal(result.headers.get('cache-control'), 'no-store');
      assert.equal(result.headers.get('x-content-type-options'), 'nosniff');
    });
  }
  it('refuses unsupported methods without revealing backend internals', async () => {
    const result = await handler(new Request('https://api.example.test/health', { method: 'DELETE' }));
    assert.equal(result.status, 405);
    assert.deepEqual(await result.json(), { error: 'Method not allowed' });
  });
  it('does not depend on privileged service-role or secrets', () => {
    assert.doesNotMatch(original, /asServiceRole|Deno\.env|createClientFromRequest|\.entities\./);
  });
});
