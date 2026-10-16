// base44/functions/rest/entry.ts
//
// REST resource gateway for the Congo Commerce Flutter (iOS/Android) app.
//
// The Flutter ProductRepository and other services call REST endpoints under
//   https://congocommerce.base44.app/api/products, /api/categories, /api/products/:id, ...
//
// Base44's entity API is SDK-based (base44.entities.Product.list() etc.) and is not
// exposed as raw REST endpoints at predictable paths. This function bridges the gap:
// it proxies the Flutter app's REST calls onto Base44's entity system via the service
// role, returning JSON in the shape the mobile client expects.
//
// Every route:
//   - is wrapped with addSecurityHeaders + rate limiting (same pattern as all other
//     Base44 functions in this repo)
//   - parses the resource and action from the request URL path
//   - returns JSON in the shape the Flutter client expects
//
// Routes exposed (all relative to the function's mounted path):
//   GET    /products              list products (query: category, q, min_price, max_price, page, page_size, sort, featured, flash_sale)
//   GET    /products/:id          get a single product
//   GET    /products/:id/similar  get similar products
//   GET    /products/:id/reviews  get product reviews
//   GET    /categories            list categories
//
// All entity reads are performed as the service role so public data is readable
// without authentication; writes remain locked behind auth where required.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from "../../shared/securityHeaders.ts";

const RATE_LIMIT_PER_HOUR = 120;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const fail = (message: string, status = 400) =>
  addSecurityHeaders(new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } }));

const json = (data: unknown, status = 200) =>
  addSecurityHeaders(new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }));

// Match paths like /products, /products/abc123, /products/abc123/similar, /products/abc123/reviews, /categories
function parsePath(url: URL): { resource: string; id?: string; action?: string } | null {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const resource = segments[0];
  if (!["products", "categories"].includes(resource)) return null;
  if (segments.length === 1) return { resource };
  if (segments.length === 2) return { resource, id: segments[1] };
  if (segments.length === 3) return { resource, id: segments[1], action: segments[2] };
  return null;
}

function round2(n: unknown): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function productToFlutter(p: any) {
  return {
    id: p.id ?? "",
    title: p.name ?? p.title ?? "",
    description: p.description ?? null,
    slug: p.slug ?? null,
    category_id: p.category_id ?? null,
    category_name: p.category_name ?? null,
    brand: p.brand ?? null,
    images: Array.isArray(p.images) ? p.images : [],
    video_url: p.video_url ?? null,
    model_3d_url: p.model_3d_url ?? null,
    seller_id: p.seller_id ?? null,
    seller_name: p.seller_name ?? null,
    supplier_id: p.supplier_id ?? null,
    supplier_name: p.supplier_name ?? null,
    external_product_id: p.external_product_id ?? null,
    source_type: p.source_type ?? "local_seller",
    supplier_price: p.supplier_price ?? null,
    currency: p.currency ?? "USD",
    price_usd: round2(p.price_usd ?? 0),
    compare_at_usd: p.compare_at_usd ?? null,
    markup_percent: p.markup_percent ?? null,
    stock: p.stock ?? 0,
    weight_kg: p.weight_kg ?? null,
    origin_country: p.origin_country ?? "CD",
    status: p.status ?? "published",
    is_featured: p.is_featured ?? false,
    is_flash_sale: p.is_flash_sale ?? false,
    rating: round2(p.rating ?? 0),
    reviews_count: p.reviews_count ?? 0,
    sold_count: p.sold_count ?? 0,
    created_date: p.created_date ?? null,
    updated_date: p.updated_date ?? null,
    tenant_id: p.tenant_id ?? null,
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Content-Length": "0" } });
    }

    if (req.method !== "GET") {
      return fail("Method not allowed", 405);
    }

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const url = new URL(req.url);
    const parsed = parsePath(url);

    if (!parsed) {
      return fail("Unknown REST endpoint", 404);
    }

    // Rate limiting
    const clientKey = getClientKey(req) || "unidentified";
    const limited = await checkRateLimit(db, clientKey, {
      keyPrefix: `rest_${parsed.resource}`,
      limit: RATE_LIMIT_PER_HOUR,
      windowMs: RATE_WINDOW_MS,
    });
    if (!limited.ok) return rateLimitErrorResponse(limited);

    const { resource, id, action } = parsed;

    // ─────────────────────────────────────────────────────────────────
    // CATEGORIES
    // ─────────────────────────────────────────────────────────────────
    if (resource === "categories") {
      const categories = await db.entities.Category.list("-sort_order", 200).catch(() => []);
      return json({
        categories: (categories || []).map((c: any) => ({
          id: c.id ?? "",
          name: c.name ?? "",
          slug: c.slug ?? "",
          description: c.description ?? null,
          icon: c.icon ?? null,
          image_url: c.image_url ?? null,
          sort_order: c.sort_order ?? 0,
          active: c.active ?? true,
        })),
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // PRODUCTS LIST
    // ─────────────────────────────────────────────────────────────────
    if (resource === "products" && !id) {
      const urlParams = new URLSearchParams(url.search);
      const category = urlParams.get("category") || undefined;
      const searchQuery = urlParams.get("q") || undefined;
      const minPrice = urlParams.get("min_price") ? Number(urlParams.get("min_price")) : undefined;
      const maxPrice = urlParams.get("max_price") ? Number(urlParams.get("max_price")) : undefined;
      const minRating = urlParams.get("min_rating") ? Number(urlParams.get("min_rating")) : undefined;
      const inStockOnly = urlParams.get("in_stock") === "true";
      const origin = urlParams.get("origin") || undefined;
      const page = Math.max(1, Number(urlParams.get("page")) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(urlParams.get("page_size")) || 20));
      const sort = urlParams.get("sort") || "relevance";
      const featured = urlParams.get("featured") === "true";
      const flashSale = urlParams.get("flash_sale") === "true";

      const filter: Record<string, unknown> = {};
      if (category) filter.category_id = category;
      if (featured) filter.is_featured = true;
      if (flashSale) filter.is_flash_sale = true;
      if (origin === "local") filter.source_type = "local_seller";
      if (origin === "international") filter.source_type = "international_supplier";

      let products: any[] = [];
      try {
        products = await db.entities.Product.list("-created_date", 500, filter);
      } catch {
        products = await db.entities.Product.list("-created_date", 500).catch(() => []);
      }

      let filtered = (products || []).map(productToFlutter);

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q) ||
            (p.category_name ?? "").toLowerCase().includes(q) ||
            (p.seller_name ?? "").toLowerCase().includes(q),
        );
      }

      if (minPrice != null) filtered = filtered.filter((p) => p.price_usd >= minPrice!);
      if (maxPrice != null) filtered = filtered.filter((p) => p.price_usd <= maxPrice!);
      if (minRating != null) filtered = filtered.filter((p) => p.rating >= minRating!);
      if (inStockOnly) filtered = filtered.filter((p) => p.stock > 0);

      filtered.sort((a, b) => {
        switch (sort) {
          case "price_asc":
            return a.price_usd - b.price_usd;
          case "price_desc":
            return b.price_usd - a.price_usd;
          case "sold":
            return b.sold_count - a.sold_count;
          case "rating":
            return b.rating - a.rating;
          case "new":
            return (b.created_date ? new Date(b.created_date).getTime() : 0) - (a.created_date ? new Date(a.created_date).getTime() : 0);
          default:
            return 0;
        }
      });

      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);

      return json({
        products: paginated,
        page,
        page_size: pageSize,
        total: filtered.length,
        total_pages: Math.ceil(filtered.length / pageSize),
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // PRODUCT BY ID
    // ─────────────────────────────────────────────────────────────────
    if (resource === "products" && id && !action) {
      const product = await db.entities.Product.get(id).catch(() => null);
      if (!product) return fail("Product not found", 404);
      return json({ product: productToFlutter(product) });
    }

    // ─────────────────────────────────────────────────────────────────
    // PRODUCT SIMILAR
    // ─────────────────────────────────────────────────────────────────
    if (resource === "products" && id && action === "similar") {
      const product = await db.entities.Product.get(id).catch(() => null);
      if (!product) return fail("Product not found", 404);
      const limit = Math.min(20, Math.max(1, Number(new URLSearchParams(url.search).get("page_size")) || 8));
      const all = await db.entities.Product.list("-created_date", 200).catch(() => []);
      const similar = (all || [])
        .filter((p: any) => p.id !== id && (p.source_type ?? "local_seller") === (product.source_type ?? "local_seller"))
        .slice(0, limit)
        .map(productToFlutter);
      return json({ products: similar });
    }

    // ─────────────────────────────────────────────────────────────────
    // PRODUCT REVIEWS
    // ─────────────────────────────────────────────────────────────────
    if (resource === "products" && id && action === "reviews") {
      const product = await db.entities.Product.get(id).catch(() => null);
      if (!product) return fail("Product not found", 404);
      const reviews = await db.entities.Review
        .filter({ product_id: id }, "-created_date", 100)
        .catch(() => []);
      return json({
        reviews: (reviews || []).map((r: any) => ({
          id: r.id ?? "",
          product_id: r.product_id ?? id,
          user_name: r.user_name ?? "Anonymous",
          rating: round2(r.rating ?? 0),
          comment: r.comment ?? "",
          created_date: r.created_date ?? null,
        })),
      });
    }

    return fail("Unknown REST endpoint", 404);
  } catch (error) {
    console.error("[rest] unhandled error", error);
    return fail("REST gateway error", 500);
  }
}