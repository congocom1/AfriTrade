// DEPRECATED — withdrawal requests are now handled through the
// automated payout pipeline (payout-request function). Kept for
// rollback only; do not add new callers.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.49";
import { requireAdmin } from "../../shared/security.ts";
import { postWalletEntry } from "../../shared/walletLedger.ts";
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from "../../shared/securityHeaders.ts";

// Rate limiting configuration for request-withdrawal
const REQUEST_WITHDRAWAL_RATE_LIMIT_PER_HOUR = 10; // Allow 10 requests per hour (more restrictive for financial operations)
const RATE_WINDOW_MS = 3600 * 1000;

/**
 * request-withdrawal — base44/functions/request-withdrawal/entry.ts
 *
 * Authenticated wallet withdrawal. The caller must own the wallet (owner email
 * matches the signed-in user, or the user is the seller of record). The server
 * enforces: allowlisted method, positive amount, and amount covered by the
 * AVAILABLE balance (balance minus pending — pending money hasn't been
 * released and can never be withdrawn).
 */

const METHODS = ["mpesa", "airtel", "orange", "bank"];

function round2(n: unknown): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function err(message: string, status = 400) {
  return addSecurityHeaders(Response.json({ error: message }, { status }));
}

export default async function (req: Request) {
  try {
    if (req.method !== "POST") return err("Method not allowed", 405);
    const base44 = createClientFromRequest(req);

    // Rate limiting for request-withdrawal - check before auth
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[request-withdrawal] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "request_withdrawal",
        failClosed: true,
        limit: REQUEST_WITHDRAWAL_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return err("Connectez-vous pour demander un retrait.", 401);
    const db = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "request_withdrawal",
        failClosed: true,
        limit: REQUEST_WITHDRAWAL_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const method = String(body.method || "").toLowerCase();
    if (!METHODS.includes(method)) return err("Moyen de retrait invalide.");
    const amount = round2(body.amount);
    if (!(amount > 0)) return err("Montant invalide.");

    const wallet = await db.entities.Wallet.get(String(body.wallet_id || "")).catch(() => null);
    if (!wallet) return err("Portefeuille introuvable.", 404);

    // Ownership: direct owner email, or the seller record behind the wallet.
    let owned = String(wallet.owner_email || "").toLowerCase() === String(user.email).toLowerCase();
    if (!owned && wallet.owner_type === "seller" && wallet.owner_id) {
      const seller = await db.entities.Seller.get(wallet.owner_id).catch(() => null);
      owned = !!seller && String(seller.email || "").toLowerCase() === String(user.email).toLowerCase();
    }
    if (!owned) return err("Ce portefeuille ne vous appartient pas.", 403);

    const available = round2((wallet.balance_usd || 0) - (wallet.pending_usd || 0));
    if (round2(amount - available) > 0.005) {
      return err(`Solde disponible insuffisant — disponible : ${available} USD.`, 409);
    }

    // Caller-supplied request id. Keying on amount/method/account silently swallowed a
    // second legitimate identical withdrawal as a replay (WALLET_PROTOCOL.md). The client
    // retries with the SAME id, so a retry still dedupes while a new request is new money.
    const requestId = String(body.request_id || "").trim();
    if (requestId.length < 8 || requestId.length > 200) {
      return err("Identifiant de demande manquant ou invalide.", 400);
    }
    const idempotencyKey = `withdraw:${wallet.id}:${requestId}`;
    const posted = await postWalletEntry(db, wallet, {
      type: "PAYOUT",
      direction: "debit",
      amount,
      description: `Retrait vers ${method} — ${String(body.account || "")}`.slice(0, 200),
      reference: idempotencyKey,
      idempotencyKey,
      status: "pending",
    });
    // The balance was read a moment ago; a concurrent debit may have taken it
    // since, in which case the ledger refuses the movement.
    if (!posted.ok) {
      // `duplicate` is the ledger reporting THIS request id already applied —
      // the retry succeeded in effect, so return the wallet instead of an error
      // that would make the client retry a withdrawal that already exists.
      if (posted.reason === 'duplicate') {
        const current = await db.entities.Wallet.get(wallet.id);
        const existing = posted.transaction?.id
          ? await db.entities.WalletTransaction.get(posted.transaction.id).catch(() => null)
          : null;
        return addSecurityHeaders(Response.json({ wallet: current ?? wallet, transaction: existing }));
      }
      if (posted.reason !== 'insufficient_funds') return err(`Retrait non appliqué : ${posted.reason}`, 409);
      return err(`Solde disponible insuffisant — disponible : ${posted.available ?? available} USD.`, 409);
    }
    const updated = posted.wallet;
    const tx = posted.transaction;
    await db.entities.AuditLog.create({
      action: "wallet.withdrawal_requested",
      actor: user.email,
      entity: "Wallet",
      entity_id: wallet.id,
      reference: wallet.owner_name,
      severity: "info",
      details: { amount_usd: amount, method },
    });
    return addSecurityHeaders(Response.json({ wallet: updated, transaction: tx }));
  } catch (e) {
    console.error("request-withdrawal: unhandled error", e);
    return err("Retrait impossible pour le moment. Réessayez.", 500);
  }
}