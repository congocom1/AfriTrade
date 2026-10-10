import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

const METHODS = ['mpesa', 'airtel', 'orange', 'bank'];
const fail = (error: string, status: number) => Response.json({ error }, { status });

// Rate limiting configuration for sellerPayout
const SELLER_PAYOUT_RATE_LIMIT_PER_HOUR = 30; // Allow 30 requests per hour per user
const RATE_WINDOW_MS = 3600 * 1000;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Rate limiting for sellerPayout
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[sellerPayout] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "seller_payout",
        limit: SELLER_PAYOUT_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return addSecurityHeaders(fail('Connexion requise.', 401));
    const seller = await base44.asServiceRole.entities.Seller.get(String(body.seller_id || '')).catch(() => null);
    if (!seller) return addSecurityHeaders(fail('Boutique introuvable.', 404));
    const email = String(user.email).toLowerCase();
    if (user.role !== 'admin' && ![seller.email, seller.tenant_owner_email].some((x) => String(x || '').toLowerCase() === email)) {
      return addSecurityHeaders(fail('Accès refusé.', 403));
    }
    const db = base44.asServiceRole;

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "seller_payout",
        limit: SELLER_PAYOUT_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const body = await req.json().catch(() => ({}));
    const existing = (await db.entities.SellerPayout.filter({ seller_id: seller.id }))[0];
    if (body.action === 'get') {
      return addSecurityHeaders(Response.json({ details: existing || null }));
    }
    if (body.action !== 'save') return addSecurityHeaders(fail('Action invalide.', 400));
    const method = String(body.payout_method || '');
    const holder = String(body.payout_holder || '').trim().slice(0, 120);
    const account = String(body.payout_account || '').trim().slice(0, 120);
    const bank = String(body.payout_bank_name || '').trim().slice(0, 120);
    if (!METHODS.includes(method) || !holder || !account || (method === 'bank' && !bank)) return addSecurityHeaders(fail('Coordonnées de versement invalides.', 400));
    const details = { seller_id: seller.id, owner_email: seller.email || seller.tenant_owner_email, payout_method: method, payout_holder: holder, payout_account: account, payout_bank_name: method === 'bank' ? bank : '', payout_updated_at: new Date().toISOString() };
    const saved = existing ? await db.entities.SellerPayout.update(existing.id, details) : await db.entities.SellerPayout.create(details);
    await db.entities.AuditLog.create({ action: 'seller.payout_details_updated', actor: user.email, entity: 'SellerPayout', entity_id: saved.id, reference: seller.id, severity: 'info', details: { method } });
    return addSecurityHeaders(Response.json({ details: saved }));
  } catch (error) {
    console.error('sellerPayout:', error);
    return addSecurityHeaders(fail('Coordonnées indisponibles. Réessayez.', 500));
  }
}