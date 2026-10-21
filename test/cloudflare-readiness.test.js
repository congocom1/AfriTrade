import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { it } from 'node:test';
it('Cloudflare Pages receives static security headers without weakening authentication', () => {
  const source = readFileSync('public/_headers','utf8');
  assert.match(source, /^\/\*/m);
  for (const name of ['X-Content-Type-Options', 'Referrer-Policy', 'Strict-Transport-Security', 'Content-Security-Policy']) assert.ok(source.includes(name));
  assert.doesNotMatch(source, /unsafe-inline|Access-Control-Allow-Origin:\s*\*/);
  assert.ok(existsSync('docs/audit/CLOUDFLARE_PAGES_SETUP.md'));
});
