import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for manage-api-keys
const MANAGE_API_KEYS_RATE_LIMIT_PER_HOUR = 30; // Allow 30 requests per hour (more restrictive for admin API operations)
const RATE_WINDOW_MS = 3600 * 1000;

/**
 * API KEY MANAGEMENT — base44/functions/manage-api-keys/entry.ts
 *
 * CRUD pour les clés API publiques : création, révocation, interrogation
 * de taux, prévisualisation du hash. Le corps de la clé réelle n'est jamais
 * lu en clair côté serveur — seul son hash SHA-256 est stocké. Une clé
 * crée rapporte sa valeur une seule fois dans la réponse.
 */

const HASH_LENGTH = 64; // SHA-256 hex

/**
 * Cryptographically strong body for a bearer credential.
 *
 * Math.random is a non-cryptographic PRNG: its xorshift128+ state is
 * recoverable from a handful of outputs, so two `Math.random()` fragments give
 * a key an attacker can predict. 32 CSPRNG bytes = 256 bits of entropy.
 */
function randomSecretBody(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 hex of the secret — the only form ever persisted. */
async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);

    // Rate limiting for manage-api-keys - check before auth
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[manage-api-keys] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "manage_api_keys",
        limit: MANAGE_API_KEYS_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const auth = await requireAdmin(base44);
    if (!auth.ok) return addSecurityHeaders(auth.response);
    const db = base44.asServiceRole;
    const method = req.method;
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "manage_api_keys",
        limit: MANAGE_API_KEYS_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    if (method === 'POST' && url.pathname === '/api-keys') {
      return createKey(db, body);
    }
    if (method === 'GET' && url.pathname === '/api-keys') {
      return listKeys(db, body.tenant_id);
    }
    if (method === 'GET' && url.pathname.startsWith('/api-keys/')) {
      const id = url.pathname.split('/').pop();
      return getKey(db, id);
    }
    if (method === 'DELETE' && url.pathname.startsWith('/api-keys/')) {
      const id = url.pathname.split('/').pop();
      return revokeKey(db, id, body.reason);
    }
    if (method === 'POST' && url.pathname === '/api-keys/rotate') {
      return rotateKey(db, body);
    }

    return addSecurityHeaders(Response.json({ error: `méthode non gérée : ${method} ${url.pathname}` }, { status: 405 }));
  } catch (err) {
    return addSecurityHeaders(Response.json({ error: String(err?.message || err).slice(0, 500), fatal: true }, { status: 500 }));
  }
}

// ── Create ───────────────────────────────────────────────────────────────────

async function createKey(db: any, body: any) {
  const name = String(body.name || '').trim();
  if (!name) return addSecurityHeaders(Response.json({ error: 'name est requis' }, { status: 400 }));
  const tenantId = String(body.tenant_id || '').trim();
  if (!tenantId) return addSecurityHeaders(Response.json({ error: 'tenant_id est requis' }, { status: 400 }));
  const scopes = Array.isArray(body.scopes) ? body.scopes.filter(Boolean) : [];
  const rateLimitRph = Math.max(0, Number(body.rate_limit_rph) || 300);
  const rateLimitRpm = Math.max(0, Number(body.rate_limit_rpm) || 60);
  const expiresAt = body.expires_at ? new Date(body.expires_at).toISOString() : '';
  const description = String(body.description || '').slice(0, 1000);

  const tenant = await db.entities.Tenant.get(tenantId).catch(() => null);
  if (!tenant) return addSecurityHeaders(Response.json({ error: `Tenant introuvable : ${tenantId}` }, { status: 404 }));

  const prefix = `cg_${Date.now().toString(36).toUpperCase()}_`;
  const secret = `${prefix}${randomSecretBody()}`;
  const keyHash = await hashSecret(secret);
  const created = await db.entities.ApiKey.create({
    tenant_id: tenantId,
    tenant_name: tenant.name || '',
    owner_email: tenant.owner_email || body.owner_email || '',
    name,
    key_prefix: prefix,
    key_hash: keyHash,
    scopes,
    rate_limit_rph: rateLimitRph,
    rate_limit_rpm: rateLimitRpm,
    active: true,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
    description,
  });

  return addSecurityHeaders(Response.json({
    id: created.id,
    name,
    tenant_id: tenantId,
    key_prefix: prefix,
    key_hash: keyHash.slice(0, 16) + '…',
    scopes,
    rate_limit_rph: rateLimitRph,
    rate_limit_rpm: rateLimitRpm,
    active: true,
    created_at: created.created_at,
    expires_at: expiresAt,
    description,
    // La clé réelle n'est retournée qu'une fois, maintenant.
    api_key: secret,
    warning: 'Enregistrez api_key immédiatement — elle ne sera jamais retournée à nouveau.',
  }, { status: 201 }));
}

// ── List ─────────────────────────────────────────────────────────────────────

async function listKeys(db: any, tenantId?: string) {
  const filter = tenantId ? { tenant_id: tenantId } : {};
  const keys = await db.entities.ApiKey.filter(filter, 'created_at', 200).catch(() => []);
  return addSecurityHeaders(Response.json({
    keys: keys.map((k: any) => ({
      id: k.id,
      name: k.name,
      tenant_id: k.tenant_id,
      key_prefix: k.key_prefix,
      scopes: k.scopes || [],
      rate_limit_rph: k.rate_limit_rph,
      rate_limit_rpm: k.rate_limit_rpm,
      active: k.active,
      last_used_at: k.last_used_at,
      created_at: k.created_at,
      expires_at: k.expires_at,
      description: k.description,
    })),
    count: keys.length,
  }));
}

// ── Get ──────────────────────────────────────────────────────────────────────

async function getKey(db: any, id: string) {
  const key = await db.entities.ApiKey.get(id).catch(() => null);
  if (!key) return addSecurityHeaders(Response.json({ error: 'Clé introuvable' }, { status: 404 }));
  return addSecurityHeaders(Response.json({
    id: key.id,
    name: key.name,
    tenant_id: key.tenant_id,
    key_prefix: key.key_prefix,
    key_hash: key.key_hash.slice(0, 16) + '…',
    scopes: key.scopes || [],
    rate_limit_rph: key.rate_limit_rph,
    rate_limit_rpm: key.rate_limit_rpm,
    active: key.active,
    last_used_at: key.last_used_at,
    created_at: key.created_at,
    expires_at: key.expires_at,
    description: key.description,
  }));
}

// ── Revoke ───────────────────────────────────────────────────────────────────

async function revokeKey(db: any, id: string, reason?: string) {
  const key = await db.entities.ApiKey.get(id).catch(() => null);
  if (!key) return addSecurityHeaders(Response.json({ error: 'Clé introuvable' }, { status: 404 }));
  const updated = await db.entities.ApiKey.update(id, {
    active: false,
    description: `Révoked${reason ? ` — ${String(reason).slice(0, 200)}` : ''}`,
  }).catch(() => null);
  return addSecurityHeaders(Response.json({ id, revoked: true, active: false, description: updated?.description }));
}

// ── Rotate ───────────────────────────────────────────────────────────────────

async function rotateKey(db: any, body: any) {
  const id = String(body.id || '').trim();
  if (!id) return addSecurityHeaders(Response.json({ error: 'id est requis' }, { status: 400 }));
  const key = await db.entities.ApiKey.get(id).catch(() => null);
  if (!key) return addSecurityHeaders(Response.json({ error: 'Clé introuvable' }, { status: 404 }));
  if (!key.active) return addSecurityHeaders(Response.json({ error: 'Clé déjà révoquée — révotre d\'abord avant rotation' }, { status: 400 }));

  const prefix = `cg_${Date.now().toString(36).toUpperCase()}_`;
  const secret = `${prefix}${randomSecretBody()}`;
  const keyHash = await hashSecret(secret);

  const updated = await db.entities.ApiKey.update(id, {
    key_prefix: prefix,
    key_hash: keyHash,
    active: true,
    last_used_at: '',
  }).catch(() => null);

  // Ancien hash conservé pour la vérification en cours (transition)
  await db.entities.ApiKey.update(id, {
    description: `Rotated — ancien hash ${key.key_hash.slice(0, 8)}…`,
  }).catch(() => null);

  return addSecurityHeaders(Response.json({
    id,
    rotated: true,
    new_key: secret,
    new_prefix: prefix,
    new_hash_preview: keyHash.slice(0, 16) + '…',
    warning: 'Enregistrez new_key immédiatement.',
  }, { status: 200 }));
}