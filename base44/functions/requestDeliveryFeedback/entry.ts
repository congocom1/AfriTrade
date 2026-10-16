import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { escapeHtml, pageUrl } from '../../shared/app.ts';
import { orderNumber, resolveFulfillment, tenantOf } from '../../shared/fulfillments.ts';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for requestDeliveryFeedback
const REQUEST_DELIVERY_FEEDBACK_RATE_LIMIT_PER_HOUR = 60; // Allow 60 requests per hour per user
const RATE_WINDOW_MS = 3600 * 1000;

/**
 * Three days after a fulfillment order is delivered (see the "Delivered
 * Feedback Request" workflow): asks the customer for a review — but only when
 * they have not reviewed this order yet.
 *
 * A low rating is handled by the "Review Followup" workflow, which opens a
 * support ticket for the shopping assistant to reach out.
 */

const DELIVERED = ['DELIVERED'];
const EVENT = 'delivery_feedback_request';
const MAX_ITEMS = 3;

/** One link per article, straight to the page carrying the review form. */
async function itemLinks(base44, fulfillment, order) {
  const items = (fulfillment.items?.length ? fulfillment.items : order?.items) || [];
  const links = [];
  for (const item of items.slice(0, MAX_ITEMS)) {
    const product = item?.product_id
      ? await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null)
      : null;
    links.push({
      title: item?.title || product?.title || 'votre article',
      // The slug is seller-controlled: it is encoded as a single path segment
      // here and attribute-escaped again at the sink, so it can never break out
      // of the href in the e-mail body.
      url: product?.slug
        ? pageUrl(`/product/${encodeURIComponent(String(product.slug))}`)
        : pageUrl('/order-history'),
    });
  }
  return links;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const fulfillmentId = String(body.fulfillment_id || '').trim();
    if (!fulfillmentId) return addSecurityHeaders(Response.json({ error: 'fulfillment_id is required' }, { status: 400 }));

    // Rate limiting for requestDeliveryFeedback
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[requestDeliveryFeedback] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "request_delivery_feedback",
        limit: REQUEST_DELIVERY_FEEDBACK_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    // A customer-facing e-mail goes out, so only the platform's own follow-up
    // workflow (or an administrator) may trigger it.
    const auth = await requireAdmin(base44);
    if (!auth.ok) return addSecurityHeaders(auth.response);
    const db = base44.asServiceRole;

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "request_delivery_feedback",
        limit: REQUEST_DELIVERY_FEEDBACK_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const { fulfillment, order } = await resolveFulfillment(base44, fulfillmentId);
    if (!fulfillment) return addSecurityHeaders(Response.json({ error: 'FulfillmentOrder not found' }, { status: 404 }));

    const status = String(fulfillment.status || '').toUpperCase();
    if (!DELIVERED.includes(status)) {
      return addSecurityHeaders(Response.json({ skipped: true, reason: `fulfillment is ${status || 'unknown'}` }));
    }
    if (String(order?.status || '').toUpperCase() === 'CANCELLED') {
      return addSecurityHeaders(Response.json({ skipped: true, reason: 'order was cancelled' }));
    }

    const reference = orderNumber(fulfillment, order);

    const reviews = reference
      ? await base44.asServiceRole.entities.Review.filter({ order_number: reference }).catch(() => [])
      : [];
    if (reviews.length) {
      return addSecurityHeaders(Response.json({
        skipped: true,
        reason: 'review already submitted',
        order_number: reference,
        review_id: reviews[0].id,
      }));
    }

    const alreadySent = await base44.asServiceRole.entities.OrderNotification
      .filter({ order_number: reference, event: EVENT, status: 'sent' })
      .catch(() => []);
    if (alreadySent.length) {
      return addSecurityHeaders(Response.json({ skipped: true, reason: 'feedback request already sent', order_number: reference }));
    }

    const links = await itemLinks(base44, fulfillment, order);
    const email = String(order?.customer_email || '').trim();
    const subject = `Votre avis nous intéresse — commande ${reference}`;
    const message = [
      `Bonjour ${order?.customer_name || ''},`.trim(),
      '',
      `Votre commande ${reference} vous a été livrée il y a quelques jours. Qu'avez-vous pensé de votre achat ?`,
      ...links.map((link) => `• ${link.title} : ${link.url}`),
      '',
      'Votre note aide les autres clients à choisir en confiance.',
      "Si quelque chose ne s'est pas bien passé, répondez à cet e-mail : notre équipe vous aidera.",
      '',
      "L'équipe AfriTrade",
    ].join('\n');

    const ledger = await base44.asServiceRole.entities.OrderNotification.create({
      ...tenantOf(fulfillment, order),
      order_id: order?.id || '',
      order_number: reference,
      fulfillment_number: fulfillment.fulfillment_number || '',
      event: EVENT,
      label: "Demande d'avis après livraison",
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
      return addSecurityHeaders(Response.json({ sent: false, skipped: true, reason: 'no customer email', order_number: reference }));
    }

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6">
        <p>Bonjour ${String(order?.customer_name || '').replace(/[<>&]/g, '')},</p>
        <p>Votre commande <strong>${reference}</strong> vous a été livrée il y a quelques jours. Qu'avez-vous pensé de votre achat ?</p>
        <ul style="padding-left:18px">
          ${links.map((link) => `<li><a href="${escapeHtml(link.url)}">${escapeHtml(link.title)}</a></li>`).join('')}
        </ul>
        <p>Votre note aide les autres clients à choisir en confiance.</p>
        <p style="font-size:13px;color:#555">Si quelque chose ne s'est pas bien passé, répondez à cet e-mail : notre équipe vous aidera.</p>
        <p style="font-size:13px;color:#555">L'équipe AfriTrade</p>
      </div>
    `;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        html,
        text: message,
        from_name: 'AfriTrade',
      });
      await base44.asServiceRole.entities.OrderNotification.update(ledger.id, {
        status: 'sent',
        channel: 'email',
        provider: 'email',
        sent_at: new Date().toISOString(),
        attempts: 1,
        error: '',
      });
    } catch (error) {
      await base44.asServiceRole.entities.OrderNotification.update(ledger.id, {
        status: 'failed',
        attempts: 1,
        error: String(error?.message || error).slice(0, 500),
      });
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'support.feedback_request_failed',
        actor: 'system',
        entity: 'FulfillmentOrder',
        entity_id: fulfillment.id,
        reference,
        severity: 'warning',
        details: { error: String(error?.message || error).slice(0, 300) },
      });
      return addSecurityHeaders(Response.json({ sent: false, reason: 'email refused', order_number: reference }));
    }

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'support.feedback_requested',
      actor: 'system',
      entity: 'FulfillmentOrder',
      entity_id: fulfillment.id,
      reference,
      severity: 'info',
      details: { items: links.length, to: email },
    });

    return addSecurityHeaders(Response.json({ sent: true, order_number: reference, items: links.length, to: email }));
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: String(error?.message || error) }, { status: 500 }));
  }
}