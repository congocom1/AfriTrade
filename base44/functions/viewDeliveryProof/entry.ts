import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for viewDeliveryProof
const VIEW_DELIVERY_PROOF_RATE_LIMIT_PER_HOUR = 60; // Allow 60 requests per hour
const RATE_WINDOW_MS = 3600 * 1000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    // Rate limiting for viewDeliveryProof - check before auth
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[viewDeliveryProof] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "view_delivery_proof",
        limit: VIEW_DELIVERY_PROOF_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    if (!user) return addSecurityHeaders(Response.json({ error: 'Authentification requise' }, { status: 401 }));
    const { kind, id } = await req.json().catch(() => ({}));
    if (!['dispute', 'shipment'].includes(kind) || typeof id !== 'string' || !id || id.length > 100) {
      return addSecurityHeaders(Response.json({ error: 'Preuve invalide' }, { status: 400 }));
    }
    const record = kind === 'dispute'
      ? await base44.asServiceRole.entities.Dispute.get(id).catch(() => null)
      : await base44.asServiceRole.entities.Shipment.get(id).catch(() => null);
    if (!record?.proof_of_delivery) return addSecurityHeaders(Response.json({ error: 'Preuve introuvable' }, { status: 404 }));
    if (user.role !== 'admin') {
      if (kind === 'dispute') return addSecurityHeaders(Response.json({ error: 'Accès refusé' }, { status: 403 }));
      const couriers = await base44.asServiceRole.entities.Courier.filter({ email: user.email });
      // The courier carrying the parcel is the one whose record id the shipment
      // stores. Matching the display name instead let a courier whose name
      // collided with another's open that courier's proof-of-delivery photo,
      // which shows the recipient and their address.
      const allowed = couriers.some((c) => c.active !== false && c.id === record.courier_id);
      if (!allowed) return addSecurityHeaders(Response.json({ error: 'Accès refusé' }, { status: 403 }));
    }

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      base44.asServiceRole,
      clientKey || "unidentified",
      {
        keyPrefix: "view_delivery_proof",
        limit: VIEW_DELIVERY_PROOF_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: record.proof_of_delivery, expires_in: 300 });
    return addSecurityHeaders(Response.json({ signed_url }));
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: String(error?.message || error) }, { status: 500 }));
  }
}