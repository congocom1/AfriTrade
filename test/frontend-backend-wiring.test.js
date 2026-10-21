import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCheckoutQuote, findCoupon } from '../src/lib/orderService.js';

const root = 'src';
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filepath = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(filepath) : /\.(jsx?|tsx?)$/.test(entry.name) ? [filepath] : [];
  });
}
function source(path) { return readFileSync(path, 'utf8'); }

const expectedCallers = [
  ['src/pages/Checkout.jsx', /buildCheckoutQuote\(base44,\s*\{/],
  ['src/pages/Checkout.jsx', /findCoupon\(base44,\s*couponInput\)/],
  ['src/pages/BulkOrders.jsx', /advanceFulfillment\(base44,\s*f,\s*target\)/],
  ['src/pages/admin/AdminOrders.jsx', /advanceFulfillment\(base44,\s*f,\s*target\)/],
  ['src/pages/seller/SellerOrders.jsx', /advanceFulfillment\(base44,\s*f,\s*target\)/],
  ['src/pages/seller/SellerOrders.jsx', /advanceFulfillment\(base44,\s*f,\s*'CANCELLED'\)/],
  ['src/pages/courier/CourierConsole.jsx', /respondToShipment\(base44,\s*\{\s*shipment,\s*accepted\s*\}\)/],
  ['src/pages/courier/CourierConsole.jsx', /courierUpdateShipment\(base44,\s*\{/],
];

describe('frontend-to-Base44 wiring', () => {
  it('passes the SDK client to quote, coupon and fulfillment helpers', () => {
    for (const [filename, pattern] of expectedCallers) assert.match(source(filename), pattern, filename);
  });

  it('quotes cart lines with a real SDK-style Product.get lookup', async () => {
    const client = { entities: { Product: { get: async (id) => ({ id, name: 'Test', price_usd: 30, stock: 5, source_type: 'local_seller' }) } } };
    const quote = await buildCheckoutQuote(client, { items: [{ product_id: 'p1', quantity: 2 }], deliveryFee: 4, pricingConfig: { free_shipping_threshold_usd: 0 } });
    assert.equal(quote.subtotal, 60);
    assert.equal(quote.localShipping, 4);
    assert.equal(quote.total, 64);
    assert.equal(quote.has_stock_issue, false);
  });

  it('retrieves active coupons through a real SDK-style Coupon.filter lookup', async () => {
    const client = { entities: { Coupon: { filter: async (where) => {
      assert.deepEqual(where, { code: 'SAVE10' });
      return [{ code: 'SAVE10', active: true, type: 'percent', value: 10 }];
    } } } };
    assert.equal((await findCoupon(client, 'save10'))?.code, 'SAVE10');
  });

  it('ensures all other referenced Base44 functions exist on disk', () => {
    const registered = new Set(readdirSync('base44/functions'));
    const invoked = new Set();
    for (const file of sourceFiles(root)) {
      for (const match of source(file).matchAll(/\bfunctions\.invoke\(\s*['"]([^'"]+)['"]/g)) invoked.add(match[1]);
    }
    // All statically invoked frontend functions now have backend entries.
    const outstanding = new Set();
    assert.deepEqual([...invoked].filter((name) => !registered.has(name)).sort(), [...outstanding]);
  });
});
