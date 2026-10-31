import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { sameIdentity } from '../../shared/fulfillmentAccess.js';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for sellerProfile
const SELLER_PROFILE_RATE_LIMIT_PER_HOUR = 60; // Allow 60 requests per hour per user
const RATE_WINDOW_MS = 3600 * 1000;

const error = (message, status = 400) => Response.json({ error: message }, { status });
const editable = { name: 120, city: 100, phone: 40, description: 2000, logo_url: 500, banner_url: 500, delivery_info: 1000 };
// Branding fields are rendered on public storefront pages, so only http(s) URLs may be stored:
// a javascript:/data: URI here would become stored script execution or a redirect on the storefront.
const URL_FIELDS = new Set(['logo_url', 'banner_url']);
const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return addSecurityHeaders(error('Méthode non autorisée', 405));
    const base44 = createClientFromRequest(req);

    // Rate limiting for sellerProfile
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[sellerProfile] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "seller_profile",
        limit: SELLER_PROFILE_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const user = await base44.auth.me().catch(() => null);
    if (!user?.id || !user?.email) return addSecurityHeaders(error('Authentification requise', 401));
    const body = await req.json().catch(() => ({}));
    if (!['profile', 'productCount', 'follow'].includes(body.action)) return addSecurityHeaders(error('Action invalide'));
    const db = base44.asServiceRole;

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "seller_profile",
        limit: SELLER_PROFILE_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const seller = await db.entities.Seller.get(String(body.seller_id || '')).catch(() => null);
    if (!seller) return addSecurityHeaders(error('Boutique introuvable', 404));
    if (body.action === 'follow') {
      if (seller.status !== 'active') return addSecurityHeaders(error('Boutique indisponible', 403));
      const existing = (await db.entities.Follow.filter({ target_type: 'seller', target_id: seller.id, session_id: user.id }))[0];
      if (body.follow === true && !existing) await db.entities.Follow.create({ target_type: 'seller', target_id: seller.id, target_name: seller.name, session_id: user.id });
      else if (body.follow === false && existing) await db.entities.Follow.delete(existing.id);
      else if (typeof body.follow !== 'boolean') return addSecurityHeaders(error('Action invalide'));
      const followers = await db.entities.Follow.filter({ target_type: 'seller', target_id: seller.id }, '-created_date', 500);
      const updated = await db.entities.Seller.update(seller.id, { followers_count: followers.length });
      return addSecurityHeaders(Response.json({ seller: updated }));
    }
    if (user.role !== 'admin' && (!sameIdentity(seller.email, user.email) || seller.status === 'suspended')) return addSecurityHeaders(error('Accès interdit', 403));
    if (body.action === 'productCount') {
      const products = await db.entities.Product.filter({ seller_id: seller.id }, '-created_date', 500);
      const updated = await db.entities.Seller.update(seller.id, { products_count: products.length });
      return addSecurityHeaders(Response.json({ seller: updated }));
    }
    const form = body.profile;
    if (!form || typeof form !== 'object' || Array.isArray(form) || Object.keys(form).some((key) => !(key in editable))) return addSecurityHeaders(error('Champs non autorisés'));
    const patch = {};
    for (const [key, value] of Object.entries(form)) {
      if (typeof value !== 'string' || value.length > editable[key]) return addSecurityHeaders(error('Valeur invalide'));
      const trimmed = value.trim();
      // An empty value clears the field; anything else must be a real http(s) link.
      if (URL_FIELDS.has(key) && trimmed && !isHttpUrl(trimmed)) return addSecurityHeaders(error('Lien invalide'));
      patch[key] = trimmed;
    }
    if (Object.hasOwn(patch, 'name') && !patch.name) return addSecurityHeaders(error('Nom de la boutique requis'));
    const updated = await db.entities.Seller.update(seller.id, patch);
    await db.entities.AuditLog.create({ action: 'seller.profile_updated', actor: user.email, entity: 'Seller', entity_id: seller.id, details: { fields: Object.keys(patch) } });
    return addSecurityHeaders(Response.json({ seller: updated }));
  } catch (e) {
    console.error('sellerProfile failed', e);
    return addSecurityHeaders(error('Enregistrement impossible', 500));
  }
}