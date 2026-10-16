// base44/functions/auth/entry.ts
//
// REST auth compatibility layer for the Congo Commerce Flutter (iOS/Android) app.
//
// The Flutter AuthService/ApiClient calls REST endpoints under
//   https://congocommerce.base44.app/api/auth/login, /auth/refresh, /auth/me, ...
// expecting payloads shaped like { access_token, refresh_token, expires_in, user }.
//
// Base44's native auth is SDK-based (@base44/sauth.loginViaEmailPassword etc.)
// and lives under /apps/{appId}/auth/* returning { access_token, user } with no
// refresh_token / expires_in. This function bridges the gap: it proxies the
// Flutter app's REST calls onto Base44's auth system and reshapes responses so
// the mobile client can authenticate, refresh, and read the current user.
//
// Every route:
//   - is wrapped with addSecurityHeaders + rate limiting (same pattern as all
//     other Base44 functions in this repo)
//   - parses the action from the request URL path (e.g. /auth/login -> "login")
//   - returns JSON in the shape the Flutter client expects
//
// Routes exposed (all relative to the function's mounted path):
//   POST   /auth/login         { email, password, remember_me? }
//   POST   /auth/refresh       { refresh_token }
//   GET    /auth/me            (Bearer token)
//   POST   /auth/register      { email, password, firstName?, lastName?, phone? }
//   POST   /auth/forgot-password { email }
//   POST   /auth/reset-password { token, password, passwordConfirm }
//   POST   /auth/verify-email  { token }
//   POST   /auth/resend-verification { email? }
//   POST   /auth/logout        (Bearer token, best-effort)
//
// Tokens: Base44 issues a single access token (no separate refresh token). We
// return the same string as both access_token and refresh_token so the Flutter
// client's refresh loop can simply re-validate. expires_in defaults to 3600s.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from "../../shared/securityHeaders.ts";

const RATE_LIMIT_PER_HOUR = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_EXPIRES_IN = 3600; // seconds

const fail = (message: string, status = 400) =>
  addSecurityHeaders(new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } }));

const json = (data: unknown, status = 200) =>
  addSecurityHeaders(new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }));

// Extract the action from a path like /auth/login or /auth/refresh
function actionFromPath(url: URL): string | null {
  const match = url.pathname.match(/\/auth\/(login|refresh|me|register|forgot-password|reset-password|verify-email|resend-verification|logout)(\/)?$/);
  return match ? match[1] : null;
}

function shapeAuthResponse(base44Result: { access_token?: string; user?: unknown }) {
  const token = base44Result.access_token ?? "";
  return {
    access_token: token,
    refresh_token: token, // Base44 issues one token; reuse it as the refresh token
    expires_in: DEFAULT_EXPIRES_IN,
    user: base44Result.user ?? null,
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Content-Length": "0" } });
    }

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const url = new URL(req.url);
    const action = actionFromPath(url);

    if (!action) {
      return fail("Unknown auth endpoint", 404);
    }

    // Rate limiting (client IP based, shared bucket for unidentified callers)
    const clientKey = getClientKey(req) || "unidentified";
    const limited = await checkRateLimit(db, clientKey, {
      keyPrefix: `auth_${action}`,
      limit: RATE_LIMIT_PER_HOUR,
      windowMs: RATE_WINDOW_MS,
    });
    if (!limited.ok) return rateLimitErrorResponse(limited);

    // Helper: require a bearer token for authenticated routes
    const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

    switch (action) {
      // ─────────────────────────────────────────────────────────────────
      // LOGIN — POST { email, password, remember_me? }
      // ─────────────────────────────────────────────────────────────────
      case "login": {
        if (req.method !== "POST") return fail("Method not allowed", 405);
        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const email = String(body.email ?? "").trim();
        const password = String(body.password ?? "");
        if (!email || !password) return fail("Email and password are required", 400);

        const appId = base44.getConfig().appId;
        const serverUrl = base44.getConfig().serverUrl ?? "https://congocommerce.base44.app";
        const loginRes = await fetch(`${serverUrl}/apps/${appId}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!loginRes.ok) {
          const errBody = await loginRes.json().catch(() => ({}));
          return fail(errBody?.error ?? errBody?.message ?? "Login failed", loginRes.status);
        }

        const loginData = (await loginRes.json()) as { access_token?: string; user?: unknown };
        return json(shapeAuthResponse(loginData));
      }

      // ─────────────────────────────────────────────────────────────────
      // REFRESH — POST { refresh_token }
      // Base44 has no separate refresh token; we re-validate the presented
      // token via /auth/me and return it again with a new expiry.
      // ─────────────────────────────────────────────────────────────────
      case "refresh": {
        if (req.method !== "POST") return fail("Method not allowed", 405);
        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const refreshToken = String(body.refresh_token ?? "").trim();
        if (!refreshToken) return fail("Refresh token is required", 400);

        const testClient = createClientFromRequest(req);
        testClient.setToken(refreshToken);
        try {
          const user = await testClient.auth.me();
          return json({
            access_token: refreshToken,
            refresh_token: refreshToken,
            expires_in: DEFAULT_EXPIRES_IN,
            user,
          });
        } catch {
          return fail("Refresh token invalid or expired", 401);
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // ME — GET (Bearer token)
      // ─────────────────────────────────────────────────────────────────
      case "me": {
        if (req.method !== "GET") return fail("Method not allowed", 405);
        if (!bearer) return fail("Authorization required", 401);
        base44.setToken(bearer);
        try {
          const user = await base44.auth.me();
          return json(user);
        } catch {
          return fail("Session invalid or expired", 401);
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // REGISTER — POST { email, password, firstName?, lastName?, phone? }
      // ─────────────────────────────────────────────────────────────────
      case "register": {
        if (req.method !== "POST") return fail("Method not allowed", 405);
        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const email = String(body.email ?? "").trim();
        const password = String(body.password ?? "");
        if (!email || !password) return fail("Email and password are required", 400);

        const appId = base44.getConfig().appId;
        const serverUrl = base44.getConfig().serverUrl ?? "https://congocommerce.base44.app";
        const regRes = await fetch(`${serverUrl}/apps/${appId}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            first_name: body.firstName ?? null,
            last_name: body.lastName ?? null,
            phone: body.phone ?? null,
          }),
        });

        if (!regRes.ok) {
          const errBody = await regRes.json().catch(() => ({}));
          return fail(errBody?.error ?? errBody?.message ?? "Registration failed", regRes.status);
        }

        const regData = await regRes.json();
        if (regData.access_token) {
          return json(shapeAuthResponse(regData));
        }
        return json({ message: "Account created. Please sign in." });
      }

      // ─────────────────────────────────────────────────────────────────
      // FORGOT-PASSWORD — POST { email }
      // ─────────────────────────────────────────────────────────────────
      case "forgot-password": {
        if (req.method !== "POST") return fail("Method not allowed", 405);
        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const email = String(body.email ?? "").trim();
        if (!email) return fail("Email is required", 400);

        const appId = base44.getConfig().appId;
        const serverUrl = base44.getConfig().serverUrl ?? "https://congocommerce.base44.app";
        await fetch(`${serverUrl}/apps/${appId}/auth/reset-password-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        // Always return success to avoid email enumeration
        return json({ message: "If an account exists, a reset link was sent." });
      }

      // ─────────────────────────────────────────────────────────────────
      // RESET-PASSWORD — POST { token, password, passwordConfirm }
      // ─────────────────────────────────────────────────────────────────
      case "reset-password": {
        if (req.method !== "POST") return fail("Method not allowed", 405);
        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const resetToken = String(body.token ?? "").trim();
        const newPassword = String(body.password ?? "");
        const confirm = String(body.passwordConfirm ?? "");
        if (!resetToken || !newPassword) return fail("Token and password are required", 400);
        if (newPassword !== confirm) return fail("Passwords do not match", 400);

        const appId = base44.getConfig().appId;
        const serverUrl = base44.getConfig().serverUrl ?? "https://congocommerce.base44.app";
        const res = await fetch(`${serverUrl}/apps/${appId}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          return fail(errBody?.error ?? errBody?.message ?? "Password reset failed", res.status);
        }
        return json({ message: "Password reset successfully." });
      }

      // ─────────────────────────────────────────────────────────────────
      // VERIFY-EMAIL — POST { token }
      // Base44 uses OTP (verify-otp) rather than a verify-email token. We map
      // this to verify-otp where the token is treated as the OTP code.
      // ─────────────────────────────────────────────────────────────────
      case "verify-email": {
        if (req.method !== "POST") return fail("Method not allowed", 405);
        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const token = String(body.token ?? "").trim();
        if (!token) return fail("Token is required", 400);

        const email = String(body.email ?? "").trim();
        if (!email) return fail("Email and token are required", 400);

        const appId = base44.getConfig().appId;
        const serverUrl = base44.getConfig().serverUrl ?? "https://congocommerce.base44.app";
        const res = await fetch(`${serverUrl}/apps/${appId}/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp_code: token }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          return fail(errBody?.error ?? errBody?.message ?? "Email verification failed", res.status);
        }
        return json({ message: "Email verified successfully." });
      }

      // ─────────────────────────────────────────────────────────────────
      // RESEND-VERIFICATION — POST { email? }
      // ─────────────────────────────────────────────────────────────────
      case "resend-verification": {
        if (req.method !== "POST") return fail("Method not allowed", 405);
        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const email = String(body.email ?? "").trim();
        if (!email) return fail("Email is required", 400);

        const appId = base44.getConfig().appId;
        const serverUrl = base44.getConfig().serverUrl ?? "https://congocommerce.base44.app";
        await fetch(`${serverUrl}/apps/${appId}/auth/resend-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        return json({ message: "If an account exists, a verification code was sent." });
      }

      // ─────────────────────────────────────────────────────────────────
      // LOGOUT — POST (Bearer token, best-effort)
      // ─────────────────────────────────────────────────────────────────
      case "logout": {
        if (req.method !== "POST") return fail("Method not allowed", 405);
        // Base44 tokens are stateless JWTs; logout is client-side (clear storage).
        return json({ message: "Signed out." });
      }

      default:
        return fail("Unknown auth endpoint", 404);
    }
  } catch (error) {
    console.error("[auth] unhandled error", error);
    return fail("Authentication service error", 500);
  }
}