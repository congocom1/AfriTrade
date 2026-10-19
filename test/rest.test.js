import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const security = ts.transpileModule(fs.readFileSync(new URL('../base44/shared/securityHeaders.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const securityUrl = `data:text/javascript;base64,${Buffer.from(security).toString('base64')}`;
const source = fs.readFileSync(new URL('../base44/functions/rest/entry.ts', import.meta.url), 'utf8')
  .replace(/import \{ createClientFromRequest \} from "npm:[^"]+";/, 'const createClientFromRequest = () => globalThis.__restTestClient;')
  .replace('"../../shared/securityHeaders.ts"', JSON.stringify(securityUrl));
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { default: handler } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const products = [
  { id: 'public', title: 'Published', status: 'published', category_id: 'fashion', is_featured: true, is_b2b: true },
  { id: 'draft', title: 'Secret', status: 'draft', category_id: 'fashion', is_b2b: true },
];
let failReads = false;
let lastFilter;
globalThis.__restTestClient = { asServiceRole: { entities: {
  ApiRateLimit: { filter: async () => [], create: async () => ({}) },
  Product: {
    filter: async (filter) => {
      if (failReads) throw new Error('database unavailable');
      lastFilter = filter;
      return products.filter(p => Object.entries(filter).every(([k, v]) => p[k] === v));
    },
    get: async id => products.find(p => p.id === id),
    list: async () => { throw new Error('Unfiltered reads are forbidden'); },
  },
  Review: { filter: async filter => { lastFilter = filter; return []; } },
} } };
const get = path => handler(new Request(`https://example.test/api/${path}`));

test('catalog applies published and requested filters through SDK filter()', async () => {
  const response = await get('products?category=fashion&featured=true');
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).products.map(p => p.id), ['public']);
  assert.deepEqual(lastFilter, { status: 'published', category_id: 'fashion', is_featured: true });
});
test('draft products are hidden from detail, reviews and similar routes', async () => {
  for (const suffix of ['', '/reviews', '/similar']) assert.equal((await get(`products/draft${suffix}`)).status, 404);
});
test('wholesale catalog excludes drafts', async () => {
  const response = await get('b2b/products');
  assert.deepEqual((await response.json()).products.map(p => p.id), ['public']);
});
test('reviews only query published reviews', async () => {
  assert.equal((await get('products/public/reviews')).status, 200);
  assert.deepEqual(lastFilter, { product_id: 'public', status: 'published' });
});
test('database failure does not fall back to an unfiltered catalog', async () => {
  failReads = true;
  try { assert.equal((await get('products')).status, 500); }
  finally { failReads = false; }
});

test('hosted function mount accepts catalog route through path parameter', async () => {
  const response = await handler(new Request('https://example.test/api/apps/app1/functions/rest?path=%2Fproducts&category=fashion'));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).products.map(p => p.id), ['public']);
});
