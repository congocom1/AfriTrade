/** Read-only remote readiness probe. Does not create orders, customers or charges. */
const target = process.env.BASE_URL;
if (!target) {
  console.error('Set BASE_URL to the exact preview/staging/deployed AfriTrade site to verify.');
  process.exit(2);
}
const base = new URL(target);
if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname))) {
  console.error('Use HTTPS or a local development URL.');
  process.exit(2);
}
const scenarios = [
  { label: 'HTML shell', path: '/', method: 'GET', content: /<html/i },
  { label: 'API health', path: '/functions/health', method: 'POST', content: /"status"\s*:\s*"ok"/i },
  { label: 'Deployed category artwork', path: '/assets/marketplace/categories/electronics.svg', method: 'GET', content: /<svg[\s>]/i },
];
let failures = 0;
for (const scenario of scenarios) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let result;
    try {
      result = await fetch(new URL(scenario.path, base), {
        method: scenario.method,
        headers: scenario.method === 'POST' ? { 'content-type': 'application/json' } : {},
        body: scenario.method === 'POST' ? '{}' : undefined,
        signal: controller.signal,
        redirect: 'follow',
      });
    } finally { clearTimeout(timeout); }
    const body = (await result.text()).slice(0, 100000);
    const passed = result.status === 200 && scenario.content.test(body);
    console.log(`${passed ? 'PASS' : 'FAIL'} ${scenario.label}: HTTP ${result.status} ${scenario.path}`);
    if (!passed) failures++;
  } catch (error) {
    failures++;
    console.log(`FAIL ${scenario.label}: ${error?.name || 'network_error'} ${scenario.path}`);
  }
}
if (failures) {
  console.error(`${failures} remote release probe(s) failed; do not mark this deployment launch-ready.`);
  process.exitCode = 1;
} else console.log('Remote read-only release probes passed. Payment, auth and concurrency still require separate staging verification.');
