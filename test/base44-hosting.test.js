import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

describe('Base44-only hosting configuration', () => {
  it('does not ship optional Cloudflare Pages deployment artifacts', () => {
    for (const path of ['public/_headers', 'wrangler.toml', 'wrangler.json', 'wrangler.jsonc', 'docs/audit/CLOUDFLARE_PAGES_SETUP.md']) {
      assert.equal(existsSync(path), false, `Unexpected standalone Cloudflare deployment artifact: ${path}`);
    }
  });
  it('preserves application security middleware and Base44 site build configuration', () => {
    const config = JSON.parse(readFileSync('base44/config.jsonc', 'utf8'));
    assert.equal(config.site.outputDirectory, './dist');
    assert.equal(config.site.buildCommand, 'npm run build');
    assert.ok(existsSync('scripts/security-headers-plugin.js'));
    assert.ok(existsSync('base44/shared/securityHeaders.ts'));
  });
});
