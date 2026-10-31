import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import {
  hoursSince,
  addDays,
  discountCode,
  frenchDate,
  money,
  orderNumber,
  paymentState,
  resolveFulfillment,
  tenantOf,
} from '../../shared/fulfillments.ts';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

/**
 * Still unpaid after 24 hours: the customer gets a 10 % code by e-mail.
 *
 * The code is derived from the fulfillment id, so a repeated run reuses the
 * same coupon instead of minting a second one, and the send is recorded in the
 * app's order-notification ledger (sent / failed / skipped) like every other
 * customer message.
 */

const DISCOUNT_PERCENT = 10;
const VALID_DAYS = 7;
const EVENT = 'payment_discount';

// Rate limiting configuration for sendUnpaidDiscountEmail
const DISCOUNT_EMAIL_RATE_LIMIT_PER_HOUR = 120;
const RATE_WINDOW_MS = 3600 * 1000;

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
        keyPrefix: 'send_unpaid_discount_email',
        limit: DISCOUNT_EMAIL_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
        failClosed: true,
      }
    );
    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const { fulfillment, order } = await resolveFulfillment(base44, fulfillmentId);
    if (!fulfillment) return Response.json({ error: 'FulfillmentOrder not found' }, { status: 404 });

    // Missing parent state is not evidence of an unpaid order. Never send a
    // customer reminder or issue a discount while payment status is unknown.
    if (!order?.id || !order.payment_status) {
      return addSecurityHeaders(Response.json({ error: 'Authoritative payment state unavailable' }, { status: 503, headers: { 'Retry-After': '120' } }));
    }
    const state = paymentState(fulfillment, order);
    if (state.paid) return Response.json({ skipped: true, reason: 'already paid', payment_status: state.payment_status });
    if (state.closed) return Response.json({ skipped: true, reason: `order is ${state.payment_status || state.fulfillment_status}` });

    if (!fulfillment.created_date || hoursSince(fulfillment.created_date) < 24) {
      return addSecurityHeaders(Response.json({ skipped: true, reason: '24-hour waiting period not reached' }));
    }
    const reference = orderNumber(fulfillment, order);
    const tenant = tenantOf(fulfillment, order);
    const email = String(order?.customer_email || '').trim();
    const code = discountCode(fulfillment.id);

    const alreadySent = await base44.asServiceRole.entities.OrderNotification
      .filter({ order_number: reference, event: EVENT });
    if (alreadySent.some((row) => row.status === 'sent')) return Response.json({ skipped: true, reason: 'discount already sent' });
    if (alreadySent.some((row) => ['queued', 'sending', 'delivery_unknown'].includes(row.status))) {
      return addSecurityHeaders(Response.json({ error: 'Delivery outcome requires review' }, { status: 409 }));
    }

    const expiresAt = addDays(VALID_DAYS);
    const subject = `Votre commande ${reference} vous attend — ${DISCOUNT_PERCENT} % de remise`;
    const message =
      `Votre commande ${reference} (${money(order?.total_usd)}) n'est toujours pas réglée. ` +
      `Pour vous remercier de votre patience, utilisez le code ${code} : ${DISCOUNT_PERCENT} % de remise, ` +
      `valable jusqu'au ${frenchDate(expiresAt)}. Saisissez-le au moment du paiement.`;

    const ledger = await base44.asServiceRole.entities.OrderNotification.create({
      ...tenant,
      order_id: order?.id || '',
      order_number: reference,
      fulfillment_number: fulfillment.fulfillment_number || '',
      event: EVENT,
      label: `Relance impayé — ${DISCOUNT_PERCENT} %`,
      customer_name: order?.customer_name || '',
      customer_email: email,
      customer_phone: order?.customer_phone || '',
      subject,
      message,
      channel: 'email',
      provider: 'email',
      status: 'queued',
      attempts: 0,
    });

    if (!email) {
      await base44.asServiceRole.entities.OrderNotification.update(ledger.id, {
        status: 'skipped',
        error: 'Aucun e-mail client',
      });
      return Response.json({ sent: false, skipped: true, reason: 'no customer email', order_number: reference });
    }

    const coupons = await base44.asServiceRole.entities.Coupon.filter({ code });
    const coupon = coupons[0] || await base44.asServiceRole.entities.Coupon.create({
      ...tenant,
      code,
      description: `${DISCOUNT_PERCENT} % — commande ${reference} non réglée`,
      type: 'percent',
      value: DISCOUNT_PERCENT,
      min_order_usd: 0,
      usage_limit: 1,
      usage_count: 0,
      expires_at: expiresAt,
      active: true,
    });

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6">
        <p>Bonjour ${order?.customer_name ? String(order.customer_name).replace(/[<>&]/g, '') : ''},</p>
        <p>Votre commande <strong>${reference}</strong> (${money(order?.total_usd)}) n'est toujours pas réglée.</p>
        <p>Pour vous remercier de votre patience, voici <strong>${DISCOUNT_PERCENT} % de remise</strong> :</p>
        <p style="margin:20px 0">
          <span style="display:inline-block;border:2px dashed #111;border-radius:12px;padding:12px 22px;font-size:20px;font-weight:800;letter-spacing:.08em">${code}</span>
        </p>
        <p>Ce code est valable jusqu'au <strong>${frenchDate(expiresAt)}</strong> et s'applique une seule fois. Saisissez-le au moment du paiement.</p>
        <p style="font-size:13px;color:#555">Aucun montant n'a été prélevé. L'équipe AfriTrade</p>
      </div>
    `;

    try {
      await base44.asServiceRole.entities.OrderNotification.update(ledger.id, { status: 'sending', attempts: 1 });
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        html,
        text: message,
        from_name: 'AfriTrade',
      });
    } catch (error) {
      const status = Number(error?.status || error?.statusCode || error?.response?.status || 0);
      const retryable = status === 429; // 503 may have occurred after mail acceptance: require human review
      await base44.asServiceRole.entities.OrderNotification.update(ledger.id, {
        status: retryable ? 'failed' : 'delivery_unknown',
        attempts: 1,
        error: String(error?.message || error).slice(0, 500),
      });
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'billing.unpaid_discount_failed',
        actor: 'system',
        entity: 'FulfillmentOrder',
        entity_id: fulfillment.id,
        reference,
        severity: 'warning',
        details: { code, error: String(error?.message || error).slice(0, 300) },
      });
      return addSecurityHeaders(Response.json({ sent: false, retryable, reason: 'email delivery failed; review notification ledger', order_number: reference }, { status: retryable ? status : 503, headers: { 'Retry-After': retryable ? '120' : '3600' } }));
    }

    await base44.asServiceRole.entities.OrderNotification.update(ledger.id, {
      status: 'sent', channel: 'email', provider: 'email', sent_at: new Date().toISOString(), attempts: 1, error: '',
    });

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'billing.unpaid_discount_sent',
      actor: 'system',
      entity: 'FulfillmentOrder',
      entity_id: fulfillment.id,
      reference,
      severity: 'info',
      details: { code, coupon_id: coupon.id, discount_percent: DISCOUNT_PERCENT, expires_at: expiresAt },
    });

    return Response.json({
      sent: true,
      coupon_id: coupon.id,
      expires_at: expiresAt,
      order_number: reference,
    });
  } catch (error) {
    console.error('[sendUnpaidDiscountEmail] failed', { error: String(error?.message || error).slice(0, 200) });
    return addSecurityHeaders(Response.json({ error: 'Discount email unavailable; verify notification ledger before retry' }, { status: 503, headers: { 'Retry-After': '120' } }));
  }
}