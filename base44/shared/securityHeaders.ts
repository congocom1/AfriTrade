/**
 * Security Headers Middleware for Base44 Functions
 *
 * Provides standardized security headers for all function responses.
 * Implements the five critical headers recommended by security audits:
 * - Content-Security-Policy
 * - X-Frame-Options
 * - Strict-Transport-Security
 * - X-Content-Type-Options
 * - Referrer-Policy
 */

export interface SecurityHeadersOptions {
  /** Custom CSP policy - if not provided, uses a sensible default */
  csp?: string;
  /** Whether to include HSTS header (should be true for production HTTPS) */
  hsts?: boolean;
  /** HSTS max-age in seconds (default: 1 year) */
  hstsMaxAge?: number;
  /** Whether to include subdomains in HSTS */
  hstsIncludeSubdomains?: boolean;
  /** Whether to preload HSTS */
  hstsPreload?: boolean;
  /** X-Frame-Options value (default: 'DENY') */
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  /** Referrer-Policy value (default: 'strict-origin-when-cross-origin') */
  referrerPolicy?: string;
}

/**
 * Default Content-Security-Policy for Base44 functions.
 * Restrictive but allows necessary resources for a typical e-commerce app.
 */
export const DEFAULT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://*.base44.app https://api.base44.com wss://*.base44.app",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/**
 * Creates security headers for a response.
 * Can be used as a wrapper around any Response object.
 */
export function addSecurityHeaders(
  response: Response,
  options: SecurityHeadersOptions = {}
): Response {
  const {
    csp = DEFAULT_CSP,
    hsts = true,
    hstsMaxAge = 31536000, // 1 year
    hstsIncludeSubdomains = true,
    hstsPreload = true,
    frameOptions = 'DENY',
    referrerPolicy = 'strict-origin-when-cross-origin',
  } = options;

  const headers = new Headers(response.headers);

  // Content-Security-Policy
  headers.set('Content-Security-Policy', csp);

  // X-Frame-Options - prevents clickjacking
  headers.set('X-Frame-Options', frameOptions);

  // Strict-Transport-Security - enforces HTTPS
  if (hsts) {
    let hstsValue = `max-age=${hstsMaxAge}`;
    if (hstsIncludeSubdomains) hstsValue += '; includeSubDomains';
    if (hstsPreload) hstsValue += '; preload';
    headers.set('Strict-Transport-Security', hstsValue);
  }

  // X-Content-Type-Options - prevents MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy - controls referrer information
  headers.set('Referrer-Policy', referrerPolicy);

  // Additional security headers
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Creates a new Response with security headers applied.
 * Convenience function for creating responses with security headers in one call.
 */
export function secureResponse(
  body: BodyInit | null,
  init?: ResponseInit,
  options?: SecurityHeadersOptions
): Response {
  const response = new Response(body, init);
  return addSecurityHeaders(response, options);
}

/**
 * Creates a JSON response with security headers applied.
 * Most commonly used pattern for API functions.
 */
export function secureJsonResponse(
  data: unknown,
  init?: ResponseInit,
  options?: SecurityHeadersOptions
): Response {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  const response = new Response(JSON.stringify(data), {
    ...init,
    headers,
  });

  return addSecurityHeaders(response, options);
}

/**
 * Creates an error response with security headers applied.
 */
export function secureErrorResponse(
  message: string,
  status: number = 400,
  options?: SecurityHeadersOptions
): Response {
  return secureJsonResponse(
    { error: message, status: 'error' },
    { status },
    options
  );
}

/**
 * Rate limiting helper with security headers
 */
export interface RateLimitConfig {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  unidentifiedLimit?: number;
  /** For sensitive operations, deny when counter storage is unavailable. */
  failClosed?: boolean;
}

export interface RateLimitResult {
  ok: boolean;
  used: number;
  limit: number;
  unavailable?: boolean;
}

export async function checkRateLimit(
  db: any,
  clientKey: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // If db is not available (e.g., pre-auth check), skip rate limiting gracefully
  if (!db) {
    return { ok: true, used: 0, limit: config.limit };
  }

  const key_prefix = `${config.keyPrefix}:${clientKey}`;
  const window_start = new Date(
    Math.floor(Date.now() / config.windowMs) * config.windowMs,
  ).toISOString();

  try {
    const rows = await db.entities.ApiRateLimit.filter({ key_prefix, window_start });
    const row = rows?.[0] ?? null;
    const used = Number(row?.request_count ?? 0);
    if (!Number.isFinite(used) || used < 0) throw new Error('Invalid rate limit count');
    if (used >= config.limit) {
      return { ok: false, used, limit: config.limit };
    }

    const next = used + 1;
    const payload = {
      request_count: next,
      last_reset_at: new Date().toISOString(),
    };
    if (row) {
      await db.entities.ApiRateLimit.update(row.id, payload);
    } else {
      await db.entities.ApiRateLimit.create({ key_prefix, window_start, ...payload });
    }
    return { ok: true, used: next, limit: config.limit };
  } catch (error) {
    // A missing counter table or failed write MUST NOT authorize financial
    // and paid API operations. Other (legacy) paths retain their previous
    // availability behavior until their infrastructure can be validated.
    console.error('Rate limit storage unavailable', { keyPrefix: config.keyPrefix, failure: error instanceof Error ? error.name : 'unknown' });
    if (config.failClosed) {
      return { ok: false, used: 0, limit: config.limit, unavailable: true };
    }
    return { ok: true, used: 0, limit: config.limit };
  }
}

/**
 * Extracts client IP for rate limiting using Cloudflare headers
 */
export function getClientKey(request: Request): string {
  const raw = String(request.headers.get("cf-connecting-ip") || "").trim();
  if (!raw || raw.includes(",")) return "";
  return raw;
}

/**
 * Standard rate limit error response with security headers
 */
export function rateLimitErrorResponse(
  result: RateLimitResult,
  message: string = "Trop de requêtes. Réessayez plus tard.",
  options?: SecurityHeadersOptions
): Response {
  if (result.unavailable) {
    return secureJsonResponse(
      { error: "Service temporairement indisponible.", status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "120" } },
      options
    );
  }
  return secureJsonResponse(
    { error: message, status: "rate_limited", limit: result.limit },
    { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "3600" } },
    options
  );
}