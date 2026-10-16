import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { addSecurityHeaders, checkRateLimit, getClientKey, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

const fail = (error: string, status = 400) => addSecurityHeaders(Response.json({ error }, { status }));
const LIMIT = 90;
const WINDOW_MS = 60 * 60 * 1000;
const clean = (value: unknown, max = 2000) => String(value || '').trim().slice(0, max);
const sameEmail = (a: unknown, b: unknown) => clean(a, 320).toLowerCase() === clean(b, 320).toLowerCase();

export default async function (req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return fail('Method not allowed', 405);
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const clientKey = getClientKey(req) || 'unidentified';
    const rate = await checkRateLimit(db, clientKey, { keyPrefix: 'quote_request', limit: LIMIT, windowMs: WINDOW_MS });
    if (!rate.ok) return rateLimitErrorResponse(rate);

    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return fail('Authentication required', 401);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return fail('Invalid request body');
    const action = clean(body.action, 32);
    if (!['submit', 'respond', 'accept', 'cancel', 'moderate'].includes(action)) return fail('Invalid action');

    if (action === 'submit') {
      const product = await db.entities.Product.get(clean(body.product_id, 120)).catch(() => null);
      if (!product || product.status !== 'published' || !(product.is_b2b || product.b2b_only || product.wholesale_price_usd != null)) return fail('Wholesale product not available', 404);
      const quantity = Number(body.quantity);
      if (!Number.isInteger(quantity) || quantity < Number(product.moq || 1) || quantity > 10000000) return fail(`Quantity must meet the MOQ of ${product.moq || 1}`);
      const seller = product.seller_id ? await db.entities.Seller.get(product.seller_id).catch(() => null) : null;
      const quote = await db.entities.QuoteRequest.create({
        quote_number: `RFQ-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        tenant_id: product.tenant_id || '',
        product_id: product.id,
        product_title: product.title,
        product_image: product.images?.[0] || '',
        supplier_id: product.supplier_id || '',
        supplier_name: product.supplier_name || product.brand || 'AfriTrade supplier',
        seller_id: product.seller_id || '',
        seller_name: product.seller_name || seller?.name || '',
        seller_email: seller?.email || product.tenant_owner_email || '',
        buyer_name: clean(user.full_name || user.name, 120) || 'AfriTrade buyer',
        buyer_email: user.email,
        buyer_phone: clean(body.phone, 40),
        buyer_country: clean(body.country, 2).toUpperCase(),
        quantity,
        target_price_usd: Math.max(0, Number(body.target_price_usd) || 0),
        currency: 'USD',
        message: clean(body.message),
        status: 'submitted',
      });
      await db.entities.AuditLog.create({ action: 'quote.submitted', actor: user.email, entity: 'QuoteRequest', entity_id: quote.id, reference: quote.quote_number, details: { product_id: product.id, quantity } }).catch(() => {});
      return addSecurityHeaders(Response.json({ quote }));
    }

    const quote = await db.entities.QuoteRequest.get(clean(body.quote_id, 120)).catch(() => null);
    if (!quote) return fail('Quote request not found', 404);
    const admin = user.role === 'admin';
    const buyer = sameEmail(quote.buyer_email, user.email);
    const seller = sameEmail(quote.seller_email, user.email);
    const now = new Date().toISOString();

    if (action === 'respond') {
      if (!admin && !seller) return fail('Forbidden', 403);
      if (quote.status !== 'submitted') return fail('Quote request is no longer awaiting a response', 409);
      const price = Number(body.quoted_unit_price_usd);
      if (!(price > 0) || price > 100000000) return fail('A valid unit price is required');
      const updated = await db.entities.QuoteRequest.update(quote.id, { status: 'responded', quoted_unit_price_usd: price, seller_response: clean(body.seller_response), responded_at: now });
      return addSecurityHeaders(Response.json({ quote: updated }));
    }
    if (action === 'accept') {
      if (!admin && !buyer) return fail('Forbidden', 403);
      if (quote.status !== 'responded') return fail('Only a supplier response can be accepted', 409);
      const updated = await db.entities.QuoteRequest.update(quote.id, { status: 'accepted', accepted_at: now });
      return addSecurityHeaders(Response.json({ quote: updated }));
    }
    if (action === 'cancel') {
      if (!buyer) return fail('Forbidden', 403);
      if (!['submitted', 'responded'].includes(quote.status)) return fail('Quote request cannot be cancelled', 409);
      const updated = await db.entities.QuoteRequest.update(quote.id, { status: 'cancelled' });
      return addSecurityHeaders(Response.json({ quote: updated }));
    }
    if (!admin) return fail('Forbidden', 403);
    const status = clean(body.status, 20);
    if (!['accepted', 'declined', 'expired'].includes(status)) return fail('Invalid moderation status');
    const updated = await db.entities.QuoteRequest.update(quote.id, { status, ...(status === 'accepted' ? { accepted_at: now } : {}) });
    return addSecurityHeaders(Response.json({ quote: updated }));
  } catch (error) {
    console.error('quoteRequest failed', error);
    return fail('Quote request could not be processed', 500);
  }
}