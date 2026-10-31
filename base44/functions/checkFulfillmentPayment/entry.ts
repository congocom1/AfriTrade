import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { orderNumber, paymentState, resolveFulfillment } from '../../shared/fulfillments.ts';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for checkFulfillmentPayment
const CHECK_FULFILLMENT_PAYMENT_RATE_LIMIT_PER_HOUR = 120; // Allow 120 requests per hour
const RATE_WINDOW_MS = 3600 * 1000;

/**
 * Payment check used by both branches of the "Unpaid Fulfillment Followup"
 * workflow. A workflow cannot re-read a record after its durable wait, so the
 * state is resolved here each time the follow-up wakes up.
 *
 * `paid`   -> the customer paid: log the analytics event and stop.
 * `closed` -> cancelled or refunded: stop, never nudge a dead order.
 */

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    // Sensitive data: establish administrator identity before parsing input or
    // consuming rate-limit resources.
    const auth = await requireAdmin(base44);
    if (!auth.ok) return addSecurityHeaders(auth.response);
    if (req.method !== 'POST') return addSecurityHeaders(Response.json({ error: 'Method not allowed' }, { status: 405 }));
    const body = await req.json().catch(() => ({}));
    const fulfillmentId = String(body.fulfillment_id || '').trim();
    if (!fulfillmentId) return addSecurityHeaders(Response.json({ error: 'fulfillment_id is required' }, { status: 400 }));
    const clientKey = getClientKey(req);
    if (!clientKey) console.warn('[checkFulfillmentPayment] applying shared unidentified rate limit');
    // A payment status for an arbitrary order: only the follow-up workflow (or
    // an administrator) may read it.
    const db = base44.asServiceRole;

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "check_fulfillment_payment",
        limit: CHECK_FULFILLMENT_PAYMENT_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
        failClosed: true,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const { fulfillment, order } = await resolveFulfillment(base44, fulfillmentId);
    if (!fulfillment) return addSecurityHeaders(Response.json({ error: 'FulfillmentOrder not found' }, { status: 404 }));

    // Unknown parent payment status is NOT proof that the order is unpaid.
    // A 503 fails the managed workflow rather than branching into customer reminders.
    if (!order?.id || !order.payment_status) {
      return addSecurityHeaders(Response.json({ error: 'Authoritative payment state unavailable' }, { status: 503, headers: { 'Retry-After': '120' } }));
    }
    const state = paymentState(fulfillment, order);

    return addSecurityHeaders(Response.json({
      fulfillment_id: fulfillment.id,
      order_number: orderNumber(fulfillment, order),
      paid: state.paid,
      closed: state.closed,
      payment_status: state.payment_status,
      fulfillment_status: state.fulfillment_status,
    }));
  } catch (error) {
    console.error('[checkFulfillmentPayment] payment lookup failed', { type: error?.name || 'unknown' });
    return addSecurityHeaders(Response.json({ error: 'Payment status temporarily unavailable' }, { status: 503, headers: { 'Retry-After': '120' } }));
  }
}