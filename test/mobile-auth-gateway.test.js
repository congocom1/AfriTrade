import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const dataUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const security = dataUrl(compile(fs.readFileSync(new URL('../base44/shared/securityHeaders.ts', import.meta.url), 'utf8')));
const source = fs.readFileSync(new URL('../base44/functions/auth/entry.ts', import.meta.url), 'utf8')
  .replace(/import \{ createClientFromRequest \} from "npm:[^"]+";/, 'const createClientFromRequest = () => globalThis.__mobileAuthClient;')
  .replace('"../../shared/securityHeaders.ts"', JSON.stringify(security));
const { default: handler } = await import(dataUrl(compile(source)));
globalThis.__mobileAuthClient = {
  getConfig: () => ({ appId: 'app1', serverUrl: 'https://base44.app' }),
  asServiceRole: { entities: { ApiRateLimit: { filter: async () => [], create: async () => ({}) } } },
};
test('hosted login and password reset use platform API URLs and mobile field names', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return Response.json({ access_token: 'test-token', user: { id: 'u1' } });
  };
  try {
    const login = await handler(new Request('https://example.test/api/apps/app1/functions/auth?action=login', {
      method: 'POST', body: JSON.stringify({ email: 'test@example.test', password: 'test-password' }),
    }));
    assert.equal(login.status, 200);
    assert.equal((await login.json()).access_token, 'test-token');
    assert.equal(calls[0].url, 'https://base44.app/api/apps/app1/auth/login');
    const reset = await handler(new Request('https://example.test/api/apps/app1/functions/auth?action=reset-password', {
      method: 'POST', body: JSON.stringify({ token: 'reset-token', password: 'new-password', password_confirm: 'new-password' }),
    }));
    assert.equal(reset.status, 200);
    assert.deepEqual(calls[1].body, { reset_token: 'reset-token', new_password: 'new-password' });
  } finally { globalThis.fetch = originalFetch; }
});
