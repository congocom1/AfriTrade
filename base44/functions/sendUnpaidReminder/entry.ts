import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import {
  hoursSince,
  money,
  orderNumber,
  paymentState,
  resolveFulfillment,
  tenantOf,
} from '../../shared/fulfillments.ts';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for sendUnpaidReminder
const SEND_UNPAID_REMINDER_RATE_LIMIT_PER_HOUR = 120; // Allow 120 requests per hour
const RATE_WINDOW_MS = 3600 * 1000;

/**
 * One hour after an unpaid fulfillment order is created: a reminder lands in
 * the customer's feed. Keyed to the order number, so a repeated run never
 * posts the reminder twice.
 */

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    // Fail closed: reject anonymous callers before consuming a rate-limit slot
    // or touching the request. They get 401 rather than 400, and no slot burns.
    const auth = await requireAdmin(base44);
    if (!auth.ok) return addSecurityHeaders(auth.response);

    const body = await req.json().catch(() => ({}));
    const fulfillmentId = String(body.fulfillment_id || '').trim();
    if (!fulfillmentId) return addSecurityHeaders(Response.json({ error: 'fulfillment_id is required' }, { status: 400 }));

    // The workflow runs on schedule; cap raw calls per IP as outbound traffic.
    const clientKey = getClientKey(req);
    const rateLimitResult = await checkRateLimit(
      base44.asServiceRole,
      clientKey || 'unidentified',
      {
        keyPrefix: 'send_unpaid_reminder',
        limit: SEND_UNPAID_REMINDER_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
        failClosed: true,
      }
    );
    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const { fulfillment, order } = await resolveFulfillment(base44, fulfillmentId);
    if (!fulfillment) return Response.json({ error: 'FulfillmentOrder not found' }, { status: 404 });

    const state = paymentState(fulfillment, order);
    if (state.paid) return Response.json({ skipped: true, reason: 'already paid', payment_status: state.payment_status });
    if (state.closed) return Response.json({ skipped: true, reason: `order is ${state.payment_status || state.fulfillment_status}` });

    const reference = orderNumber(fulfillment, order);
    const title = `Rappel : votre commande ${reference} n'est pas encore réglée`;
    const existing = await base44.asServiceRole.entities.Notification
      .filter({ title, order_number: reference })
      .catch(() => []);
    if (existing.length) return Response.json({ skipped: true, reason: 'reminder already sent', notification_id: existing[0].id });

    const hours = hoursSince(fulfillment.created_date);
    const payment = order?.payment_method || order?.payment_provider || 'mobile money';
    const message =
      `Votre commande ${reference} (${money(order?.total_usd)}) est enregistrée mais son paiement ` +
      `n'a pas encore été confirmé — aucun montant n'a été prélevé. Finalisez le règlement par ${payment} ` +
      `depuis « Mes commandes » ou répondez à ce message : notre équipe vous accompagne.`;

    const notification = await base44.asServiceRole.entities.Notification.create({
      ...tenantOf(fulfillment, order),
      title,
      message,
      type: 'payment',
      audience: 'customer',
      order_number: reference,
    });

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'billing.unpaid_reminder',
      actor: 'system',
      entity: 'FulfillmentOrder',
      entity_id: fulfillment.id,
      reference,
      severity: 'info',
      details: { hours_since_creation: hours, payment_status: state.payment_status, amount_usd: order?.total_usd ?? 0 },
    });

    return Response.json({
      reminded: true,
      order_number: reference,
      notification_id: notification.id,
      hours_since_creation: hours,
    });
  } catch (error) {
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
}