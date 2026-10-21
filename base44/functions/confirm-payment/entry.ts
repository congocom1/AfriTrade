// DEPRECATED — replaced by the payments-webhook idempotency guard and
// the automated payment verification flow. This function is kept for
// rollback only; new integrations should use the webhook path.
// Do not add new callers.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.49";
import { requireAdmin } from "../../shared/security.ts";
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from "../../shared/securityHeaders.ts";

// Rate limiting configuration for admin endpoints
const ADMIN_RATE_LIMIT_PER_HOUR = 100; // Higher limit for admin operations
const RATE_WINDOW_MS = 3600 * 1000;

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    // Rate limiting for admin endpoints
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[confirm-payment] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "confirm_payment",
        limit: ADMIN_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    if (req.method !== "POST") {
      return addSecurityHeaders(
        Response.json({ error: "Method not allowed" }, { status: 405 })
      );
    }

    const auth = await requireAdmin(base44);
    if (!auth.ok) {
      return addSecurityHeaders(auth.response);
    }

    const body = await req.json().catch(() => ({}));
    const orderNumber = String(body.order_number || "").trim();
    if (!orderNumber) {
      return addSecurityHeaders(
        Response.json({ error: "order_number est requis." }, { status: 400 })
      );
    }

    const orders = await db.entities.Order.filter({ order_number: orderNumber }).catch(() => []);
    const order = orders?.[0];
    if (!order) {
      return addSecurityHeaders(
        Response.json({ error: "Commande introuvable." }, { status: 404 })
      );
    }
    // An administrator's manual action is NOT proof of a card/provider payment.
    // Provider-backed payment state must be established by the signed webhook,
    // not by caller-supplied references to this legacy endpoint.
    if (String(order.payment_provider || order.payment_method || '').toLowerCase() !== 'cod') {
      return addSecurityHeaders(Response.json(
        { error: "Confirmation manuelle réservée au paiement à la livraison." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      ));
    }
    if (["CANCELLED", "REFUNDED", "FAILED"].includes(order.payment_status) || order.status === "CANCELLED") {
      return addSecurityHeaders(Response.json({ error: "Commande clôturée." }, { status: 409 }));
    }
    const already = order.payment_verified && order.payment_status === "PAID";
    const updated = already ? order : await db.entities.Order.update(order.id, {
      payment_status: "PAID",
      payment_verified: true,
      payment_reference: String(body.payment_reference || order.payment_reference || `MANUAL-${orderNumber}`),
      status: order.status === "PENDING" ? "CONFIRMED" : order.status,
    });
    const fulfillments = await db.entities.FulfillmentOrder.filter({ order_number: orderNumber }).catch(() => []);
    let advanced = 0;
    for (const f of fulfillments || []) {
      if (f?.status === "PENDING") {
        await db.entities.FulfillmentOrder.update(f.id, { status: "CONFIRMED" });
        advanced += 1;
        await db.functions.invoke("orderNotifications", {
          action: "fulfillment_status",
          fulfillment_id: f.id,
          status: "CONFIRMED",
          order_id: order.id,
        }).catch((err) => console.error("confirm-payment: fulfillment notification failed", err));
      }
      const shipments = await db.entities.Shipment.filter({ fulfillment_order_id: f.id }).catch(() => []);
      for (const shipment of shipments) {
        if (shipment.status === "PENDING") {
          await db.entities.Shipment.update(shipment.id, { status: "PREPARING" });
        }
      }
    }
    if (!already) {
      await db.entities.AuditLog.create({
        action: "payment.confirmed_manual",
        actor: "admin",
        entity: "Order",
        entity_id: order.id,
        reference: orderNumber,
        severity: "info",
        details: { fulfillments_advanced: advanced, reference: updated.payment_reference },
      });
    }
    return addSecurityHeaders(
      Response.json({ order: updated, fulfillments_advanced: advanced, already })
    );
  } catch (e) {
    console.error("confirm-payment: unhandled error", e);
    return addSecurityHeaders(
      Response.json({ error: "Confirmation impossible. Réessayez." }, { status: 500 })
    );
  }
}