import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import { securityHeadersPlugin } from '../scripts/security-headers-plugin.js';

test('production HTML places supported metadata in head', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'afritrade-headers-'));
  try {
    await writeFile(path.join(root, 'index.html'), '<!doctype html><html><head><title>Test</title></head><body>Test</body></html>');
    const result = await build({ root, configFile: false, logLevel: 'silent',
      plugins: [securityHeadersPlugin()], build: { write: false } });
    const html = result.output.find(file => file.fileName === 'index.html').source;
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
    assert.match(head, /http-equiv="Content-Security-Policy"/);
    // *.base44.app does NOT match the apex host used by the Base44 SDK.
    // Without this explicit origin, every public entity request fails with CSP.
    assert.match(head, /connect-src[^";]*https:\/\/base44\.app https:\/\/\*\.base44\.app/);
    assert.match(head, /name="referrer" content="strict-origin-when-cross-origin"/);
    assert.ok(head.indexOf('Content-Security-Policy') < head.indexOf('<title>'));
    assert.doesNotMatch(html, /frame-ancestors|http-equiv="(?:X-Frame-Options|Strict-Transport-Security|X-Content-Type-Options|Permissions-Policy|X-XSS-Protection)"/);
    assert.equal(html.slice(html.indexOf('</html>') + 7).trim(), '');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('development does not inject production CSP', () => {
  const plugin = securityHeadersPlugin();
  plugin.configResolved({ command: 'serve' });
  assert.equal(plugin.transformIndexHtml.handler(), undefined);
});

for (const hook of ['configureServer', 'configurePreviewServer']) {
  test(`${hook} sends HTTP headers and continues the response`, async () => {
    let middleware;
    securityHeadersPlugin()[hook]({ middlewares: { use(fn) { middleware = fn; } } });
    const server = createServer((req, res) => middleware(req, res, () => res.end('ok')));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const response = await fetch(`http://127.0.0.1:${server.address().port}`);
      assert.equal(await response.text(), 'ok');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
      assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
      assert.equal(response.headers.get('strict-transport-security'), null);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
}