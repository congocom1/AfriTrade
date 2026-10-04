import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function handler(req) {
  const caller = createClientFromRequest(req);
  // Service-role client for server-side writes (bypasses RLS)
  const db = caller.asServiceRole || caller;

  const SELLER = {
    name: 'Kin Market',
    slug: 'kin-market',
    owner_name: 'Demo Vendor',
    email: 'vendor@kin-market.demo',
    phone: '+243990000001',
    city: 'Kinshasa',
    country: 'CD',
    description: 'Demo vendor — fresh produce and household goods',
    verified: true,
    rating: 4.8,
    commission_rate: 10,
    status: 'active',
  };

  const PRODUCTS = [
    {
      title: 'Organic Plantain Chips',
      slug: 'organic-plantain-chips',
      description: 'Crispy plantain chips, salted, 150g bag. Sourced from Kinshasa smallholders.',
      category_id: 'groceries',
      category_name: 'Groceries',
      brand: 'Kin Market',
      supplier_price: 1.2,
      price_usd: 3.5,
      compare_at_usd: 4.5,
      stock: 200,
      weight_kg: 0.2,
      origin_country: 'CD',
      tags: ['snacks', 'organic', 'local'],
      is_featured: true,
      status: 'published',
    },
    {
      title: 'Mobile Money Top-Up 10 USD',
      slug: 'mtn-airtel-topup-10usd',
      description: 'MTN / Airtel mobile money top-up card, 10 USD equivalent. Instant delivery.',
      category_id: 'refills',
      category_name: 'Refills',
      brand: 'Kin Market',
      supplier_price: 9.5,
      price_usd: 10.0,
      stock: 500,
      weight_kg: 0,
      origin_country: 'CD',
      tags: ['refill', 'mobile-money'],
      status: 'published',
    },
    {
      title: 'Handwoven Basket Set',
      slug: 'handwoven-basket-set',
      description: 'Set of 3 handwoven congolese baskets, medium size, natural dyes.',
      category_id: 'crafts',
      category_name: 'Crafts',
      brand: 'Kin Market',
      supplier_price: 4.0,
      price_usd: 12.0,
      compare_at_usd: 16.0,
      stock: 25,
      weight_kg: 1.2,
      origin_country: 'CD',
      tags: ['craft', 'handmade', 'home'],
      is_featured: true,
      status: 'published',
    },
  ];

  const results = { seller: null, products: [] };

  // Seller (idempotent)
  try {
    const existing = await db.entities.Seller.filter({ slug: SELLER.slug }).catch(() => []);
    if (existing.length > 0) {
      results.seller = existing[0];
    } else {
      results.seller = await db.entities.Seller.create(SELLER);
    }
  } catch (e) {
    const any = await db.entities.Seller.filter({}).catch(() => []);
    results.seller = any[0] || null;
  }

  // Products (idempotent)
  for (const p of PRODUCTS) {
    const hit = await db.entities.Product.filter({ slug: p.slug }).catch(() => []);
    if (hit.length > 0) {
      results.products.push({ slug: p.slug, status: 'exists', id: hit[0].id });
      continue;
    }
    const payload = { ...p, seller_id: results.seller?.id, seller_name: results.seller?.name, created_by_id: results.seller?.id };
    try {
      const created = await db.entities.Product.create(payload);
      results.products.push({ slug: p.slug, status: 'created', id: created.id });
    } catch (e) {
      results.products.push({ slug: p.slug, status: 'error', error: e.message });
    }
  }

  return Response.json(results);
}
