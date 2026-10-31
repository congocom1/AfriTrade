import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for advancedAnalytics (admin-only endpoint)
const ADVANCED_ANALYTICS_RATE_LIMIT_PER_HOUR = 30; // Lower limit for expensive admin operations
const RATE_WINDOW_MS = 3600 * 1000;

const fail = (error, status = 400) => Response.json({ error }, { status });

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return addSecurityHeaders(fail('Méthode non autorisée', 405));
    const base44 = createClientFromRequest(req);

    // Rate limiting for advancedAnalytics
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[advancedAnalytics] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "advanced_analytics",
        limit: ADVANCED_ANALYTICS_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    // These figures are platform-wide revenue and customer counts, read with
    // the service role — operator-only business intelligence, so the caller
    // must be an administrator.
    const auth = await requireAdmin(base44);
    if (!auth.ok) return addSecurityHeaders(auth.response);
    const db = base44.asServiceRole;

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "advanced_analytics",
        limit: ADVANCED_ANALYTICS_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    if (body.days != null && (!Number.isInteger(body.days) || body.days < 1 || body.days > 366)) return fail('Période invalide', 400);
    if (body.limit != null && (!Number.isInteger(body.limit) || body.limit < 1 || body.limit > 100)) return fail('Limite invalide', 400);

    switch (action) {
      case 'dashboard': return await dashboard(db, body);
      case 'conversion-funnel': return await conversionFunnel(db, body);
      case 'cohort': return await cohort(db, body);
      case 'revenue': return await revenue(db, body);
      case 'top-products': return await topProducts(db, body);
      default: return fail('Action invalide');
    }
  } catch(e) {
    console.error('analytics failed', e);
    return fail('Erreur serveur', 500);
  }
}

async function dashboard(db, body) {
  const { days = 30 } = body;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [orders, revenues, customers, products] = await Promise.all([
    db.entities.Order.filter({ created_date: { $gte: since } }, '-created_date', 500),
    db.entities.TenantInvoice.filter({ issued_at: { $gte: since }, status: 'paid' }, '-issued_at', 200),
    db.entities.User.filter({ created_date: { $gte: since } }, '-created_date', 500),
    db.entities.Product.list('title', 200),
  ]);
  const totalRevenue = revenues.reduce((s, r) => s + (Number(r.total_usd) || 0), 0);
  const paidOrders = orders.filter((o) => o.payment_status === 'PAID');
  const avgOrderValue = paidOrders.length ? paidOrders.reduce((s, o) => s + (Number(o.total_usd) || 0), 0) / paidOrders.length : 0;
  const newCustomers = new Set(customers.map((u) => u.email)).size;
  return Response.json({
    total_orders: orders.length,
    paid_orders: paidOrders.length,
    total_revenue: totalRevenue,
    avg_order_value: Math.round(avgOrderValue * 100) / 100,
    new_customers: newCustomers,
    total_products: products.length,
    period_days: days,
  });
}

async function conversionFunnel(db, body) {
  const { days = 30 } = body;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const events = await db.entities.AnalyticsEvent.filter({ created_date: { $gte: since } }, '-created_date', 1000);
  const sessions = new Set(events.map(e => e.session_id).filter(Boolean));
  const count = (name) => new Set(events.filter(e => e.name === name).map(e => e.session_id).filter(Boolean)).size;
  const step = (label, value) => ({ step: label, count: value, rate: sessions.size ? Math.round(value / sessions.size * 1000) / 10 : 0 });
  return Response.json({
    funnel: [step('Sessions suivies', sessions.size), step('Ajout panier', count('cart_add')), step('Checkout', count('order_checkout_started'))],
    source: 'recorded_analytics_events',
    truncated: events.length === 1000,
  });
}

async function cohort(db, body) {
  const since = new Date(Date.now() - (body.days || 90) * 86400000).toISOString();
  const orders = await db.entities.Order.filter({ created_date: { $gte: since } }, '-created_date', 500);
  const cohorts = {};
  for (const o of orders) {
    const month = (o.created_date || '').slice(0, 7);
    if (!month) continue;
    if (!cohorts[month]) cohorts[month] = { count: 0, revenue: 0, paid: 0 };
    cohorts[month].count++;
    if (o.payment_status === 'PAID') { cohorts[month].paid++; cohorts[month].revenue += Number(o.total_usd) || 0; }
  }
  return Response.json({ cohort: Object.entries(cohorts).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => ({ month, ...d })) });
}

async function revenue(db, body) {
  const { days = 30 } = body;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const invoices = await db.entities.TenantInvoice.filter({ issued_at: { $gte: since } }, '-issued_at', 200);
  const byStatus = { paid: 0, open: 0, past_due: 0, draft: 0 };
  for (const inv of invoices) { if (byStatus[inv.status] !== undefined) byStatus[inv.status] += Number(inv.total_usd) || 0; }
  return Response.json({ revenue_by_status: byStatus, total: Object.values(byStatus).reduce((a, b) => a + b, 0) });
}

async function topProducts(db, body) {
  const { limit = 10 } = body;
  const products = await db.entities.Product.list('-created_date', limit * 2);
  return Response.json({ products: products.slice(0, limit).map((p) => ({ id: p.id, title: p.title, stock: p.stock, price_usd: p.price_usd, status: p.status })) });
}