// DEPRECATED — replaced by the automated dispute/refund flow in
// dispute-center and the webhook-based payment completion path.
// Existing admin returns/dispute callers still use this endpoint.
// Fail closed until order-level refund orchestration and clawback are repaired.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.49";
import { requireAdmin } from "../../shared/security.ts";
import { postWalletEntry, releasePending } from "../../shared/walletLedger.ts";
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from "../../shared/securityHeaders.ts";

// Rate limiting configuration for admin endpoints
const ADMIN_RATE_LIMIT_PER_HOUR = 100; // Higher limit for admin operations
const RATE_WINDOW_MS = 3600 * 1000;
const REFUNDS_ENABLED = false;

function round2(n: unknown): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function err(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function resolveRefundWalletIdentity(db: any, order: any) {
  const createdById = String(order.created_by_id || "").trim();
  let owner = null;
  if (createdById) {
    try {
      owner = await db.entities.User.get(createdById);
    } catch {
      owner = null;
    }
  }

  if (owner?.id) {
    return {
      ownerId: String(owner.id),
      createdById: String(owner.id),
      ownerEmail: String(owner.email || ""),
    };
  }

  return {
    ownerId: `refund-order:${order.id}`,
    createdById: "",
    ownerEmail: "",
  };
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    if (req.method !== "POST") {
      return addSecurityHeaders(
        Response.json({ error: "Method not allowed" }, { status: 405 })
      );
    }

    const auth = await requireAdmin(base44);
    if (!auth.ok) {
      return addSecurityHeaders(auth.response);
    }

    // Authenticate before counter reads, and fail closed on storage failure.
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[refund-payment] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "refund_payment",
        limit: ADMIN_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
        failClosed: true,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    if (!REFUNDS_ENABLED) {
      return addSecurityHeaders(Response.json({
        error: "Remboursements temporairement indisponibles — aucune opération financière effectuée.",
        code: "refunds_disabled",
      }, { status: 503 }));
    }

    const body = await req.json().catch(() => ({}));

    const orderNumber = String(body.order_number || "").trim();
    const amount = round2(body.amount);
    if (!orderNumber) {
      return addSecurityHeaders(
        Response.json({ error: "order_number est requis." }, { status: 400 })
      );
    }
    if (!(amount > 0)) {
      return addSecurityHeaders(
        Response.json({ error: "Montant invalide." }, { status: 400 })
      );
    }

    const orders = await db.entities.Order.filter({ order_number: orderNumber }).catch(() => []);
    const order = orders?.[0];
    if (!order) {
      return addSecurityHeaders(
        Response.json({ error: "Commande introuvable." }, { status: 404 })
      );
    }
    if (order.payment_status === "REFUNDED") {
      return addSecurityHeaders(
        Response.json({ error: "Commande déjà remboursée." }, { status: 409 })
      );
    }
    if (!order.payment_verified || !["PAID", "PARTIALLY_REFUNDED"].includes(order.payment_status)) {
      return addSecurityHeaders(
        Response.json({ error: "Le paiement doit être confirmé avant tout remboursement." }, { status: 409 })
      );
    }

    // Cap at the unrefunded remainder (partial refunds allowed).
    const prior = await db.entities.WalletTransaction
      .filter({ order_number: orderNumber, type: "REFUND", direction: "credit", status: { $in: ["posted", "pending"] } });
    const refundedSoFar = round2((prior || []).reduce((s: number, t: any) => s + (Number(t.amount_usd) || 0), 0));
    const remainder = round2((Number(order.total_usd) || 0) - refundedSoFar);
    if (round2(amount - remainder) > 0.005) {
      return addSecurityHeaders(
        Response.json({ error: `Montant supérieur au reliquat remboursable (${remainder} USD).` }, { status: 409 })
      );
    }

    // Bind refunds to a verified account id, never to client-authored name or session data.
    const walletIdentity = await resolveRefundWalletIdentity(db, order);
    const existingWallets = await db.entities.Wallet
      .filter({ owner_type: "customer", owner_id: walletIdentity.ownerId })
      .catch(() => []);
    let wallet: any = existingWallets?.[0] || null;
    if (!wallet) {
      wallet = await db.entities.Wallet.create({
        tenant_id: order.tenant_id || "",
        tenant_owner_email: order.tenant_owner_email || "",
        owner_type: "customer",
        owner_name: order.customer_name || "Client",
        owner_email: walletIdentity.ownerEmail,
        owner_id: walletIdentity.ownerId,
        created_by_id: walletIdentity.createdById,
        session_id: "",
        balance_usd: 0,
      });
    }

    const reference = String(body.return_number || body.dispute_id || orderNumber);
    const idempotencyKey = `refund:${order.id}:${reference}:${amount}`;
    const posted = await postWalletEntry(db, wallet, {
      type: "REFUND",
      direction: "credit",
      amount,
      owner_type: "customer",
      owner_name: wallet.owner_name,
      owner_email: wallet.owner_email || "",
      description: `Remboursement ${orderNumber}${body.reason ? ` — ${String(body.reason).slice(0, 120)}` : ""}`,
      reference,
      order_id: order.id,
      order_number: orderNumber,
      status: "posted",
      idempotencyKey,
    });
    if (!posted.ok) {
      return addSecurityHeaders(
        Response.json({ error: "Remboursement impossible — réessayez." }, { status: 409 })
      );
    }
    const tx = posted.transaction;

    // Two refunds racing on the same order both passed the remainder check
    // above. The ledger is the truth: if our credit tipped the order past its
    // total, undo it rather than leave the buyer over-refunded.
    const ledger = await db.entities.WalletTransaction
      .filter({ order_number: orderNumber, type: "REFUND", direction: "credit", status: { $in: ["posted", "pending"] } });
    const refundedTotal = round2((ledger || []).reduce((s: number, t: any) => s + (Number(t.amount_usd) || 0), 0));
    if (refundedTotal > round2(Number(order.total_usd) || 0) + 0.005) {
      const reversalIdem = `refund-reversal:${order.id}:${orderNumber}:${amount}`;
      const reversal = await postWalletEntry(db, posted.wallet, {
        type: "ADJUSTMENT",
        direction: "debit",
        amount,
        owner_type: "customer",
        owner_name: wallet.owner_name,
        owner_email: wallet.owner_email || "",
        description: `Annulation — remboursement concurrent sur ${orderNumber}`,
        reference: `reversal:${orderNumber}`,
        order_id: order.id,
        order_number: orderNumber,
        idempotencyKey: reversalIdem,
      });
      if (!reversal.ok) {
        console.error("refund-payment: reversal failed", orderNumber, reversal.reason);
      }
      await db.entities.WalletTransaction.update(tx.id, { status: "reversed" });
      return addSecurityHeaders(
        Response.json({ error: "Un remboursement concurrent a déjà été enregistré sur cette commande." }, { status: 409 })
      );
    }

    // Claw back unreleased shares: a refunded order must never still pay out.
    let reversed = 0;
    const fulfillments = await db.entities.FulfillmentOrder.filter({ order_number: orderNumber }).catch(() => []);
    for (const f of fulfillments || []) {
      if (f?.payout_released) continue;
      const pending = await db.entities.WalletTransaction
        .filter({ reference: f.fulfillment_number, status: "pending" })
        .catch(() => []);
      for (const p of pending || []) {
        const w = await db.entities.Wallet.get(p.wallet_id);
        if (!w) throw new Error('wallet_missing');
        await releasePending(db, w, Number(p.amount_usd || 0), `release:${p.id}`);
        await db.entities.WalletTransaction.update(p.id, { status: "reversed" });
        reversed += 1;
      }
      await db.entities.FulfillmentOrder.update(f.id, { payout_released: true });
    }

    const fullyRefunded = round2(refundedSoFar + amount) >= round2(Number(order.total_usd) || 0) - 0.005;
    const updatedOrder = await db.entities.Order.update(order.id, {
      payment_status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
    });

    const providerRefund = order.payment_provider === "card" ? "manual_required" : "n/a_ledger_only";
    await db.entities.Notification.create({
      tenant_id: order.tenant_id || "",
      tenant_owner_email: order.tenant_owner_email || "",
      title: `Remboursement de ${amount} USD`,
      message: `Votre commande ${orderNumber} a été remboursée. Le montant est crédité sur votre portefeuille.`,
      type: "payment",
      audience: "customer",
      order_number: orderNumber,
    });
    await db.entities.AuditLog.create({
      action: "payment.refunded",
      actor: "admin",
      entity: "Order",
      entity_id: order.id,
      reference: orderNumber,
      severity: "info",
      details: { amount_usd: amount, refunded_total_usd: round2(refundedSoFar + amount), shares_reversed: reversed, provider_refund: providerRefund, reason: String(body.reason || "") },
    });

    return addSecurityHeaders(
      Response.json({ order: updatedOrder, transaction: tx, shares_reversed: reversed, provider_refund: providerRefund })
    );
  } catch (e) {
    console.error("refund-payment: unhandled error", e);
    return addSecurityHeaders(
      Response.json({ error: "Remboursement impossible. Réessayez." }, { status: 500 })
    );
  }
}