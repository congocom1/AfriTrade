import { test, expect } from '@playwright/test';
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5174';
const target = new URL(baseURL);
if (!['http:', 'https:'].includes(target.protocol) || (target.protocol === 'http:' && !['localhost','127.0.0.1'].includes(target.hostname))) {
  throw new Error('Deployment verification requires a secure staging URL or localhost.');
}

test('serves the committed category artwork from its public path', async ({request}) => {
  const response = await request.get(new URL('/assets/marketplace/categories/electronics.svg', target).toString());
  expect(response.status()).toBe(200);
  expect(await response.text()).toMatch(/<svg[\s>]/i);
});

test('exposes a healthy API function, not a provider error page', async ({request}) => {
  const response = await request.post(new URL('/functions/health', target).toString(), {data: {}});
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.status).toBe('ok');
});
