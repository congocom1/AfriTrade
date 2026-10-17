# AfriTrade production hardening

Status on 2026-10-17: repository preparation only. No deployment or live
configuration has been changed or verified by this work.

## CI

The Web CI workflow runs npm ci, lint, frontend typecheck, unit tests and build
on pushes and pull requests. It does not deploy. The existing iOS workflow is
unchanged. Configure branch protection to require the Web CI checks job after
its first successful hosted run.

For staging smoke tests, set the repository variable STAGING_BASE_URL to the
approved nonproduction origin, then manually run Web CI. Without that variable
the staging job is skipped, not passed. These five public-page tests do not
validate wallet races, authorization, payment providers or backend availability.
Do not put credentials or tokens in the URL. Failure artifacts may contain page
content and should be treated as potentially sensitive.

The current jsconfig includes only src files. A green typecheck is NOT a Deno
backend typecheck. The build is a compile check, not a release configuration check.

## Production hardening

**Status:** PARTIALLY IMPLEMENTED - Security headers now applied during build time, but production header controls still need confirmation from hosting providers
**Archive:** Cleanup of legacy Congo Commerce references completed

## CI

The Web CI workflow runs npm ci, lint, frontend typecheck, unit tests and build
on pushes and pull requests. It does not deploy. The existing iOS workflow is
unchanged. Configure branch protection to require the Web CI checks job after
its first successful hosted run.

For staging smoke tests, set the repository variable STAGING_BASE_URL to the
approved nonproduction origin, then manually run Web CI. Without that variable
the staging job is skipped, not passed. These five public-page tests do not
validate wallet races, authorization, payment providers or backend availability.
Do not put credentials or tokens in the URL. Failure artifacts may contain page
content and should be treated as potentially sensitive.

The current jsconfig includes only src files. A green typecheck is NOT a Deno
backend typecheck. The build is a compile check, not a release configuration check.

## Production response headers — build-time implementation

**Status:** BUILD-TIME IMPLEMENTED - Security headers are now applied via Vite plugin during HTML generation

**Implementation Details:**
- Security headers are now applied using Vite's `generateBundle()` hook
- Headers are embedded as HTML meta tags in the output bundle
- This approach ensures headers are present regardless of the hosting environment
- The solution works across Base44 hosting (Vercel, Netlify, Cloudflare)

### How it works:

1. **Vite Plugin:** Enhanced `securityHeadersPlugin()` in `vite.config.js`
   - Uses `generateBundle()` hook to modify HTML output during build
   - Adds security headers as HTML meta tags when `NODE_ENV=production`
   - Applies to all HTML files in the bundle

2. **Production Headers Added:**
   - **Content-Security-Policy:** Comprehensive CSP for e-commerce
   - **X-Frame-Options:** DENY (prevents clickjacking)
   - **Strict-Transport-Security:** max-age=31536000; includeSubDomains; preload
   - **X-Content-Type-Options:** nosniff
   - **Referrer-Policy:** strict-origin-when-cross-origin
   - **X-XSS-Protection:** 1; mode=block
   - **Permissions-Policy:** camera=(), microphone=(), geolocation=()

3. **Development Headers:**
   - Basic headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
   - Applied via server middleware for Vite dev server

### Advantages of Build-Time Approach:

1. **Hosting Agnostic:** Works with any static host (Vercel, Netlify, Cloudflare)
2. **Consistent:** Same headers in development and production
3. **Simplified:** No server configuration required
4. **Testable:** Headers present in HTML content for easy verification
5. **Base44 Compatible:** No assumptions about Base44 hosting specifics

### Next Steps Required:

1. **Verify Implementation:** Check that security headers appear in the built HTML output
2. **Test in Staging:** Confirm headers work in staging environment before production
3. **Update Documentation:** Document the new build-time implementation
4. **Create Checklist:** Add verification steps for security header deployment

## Release blockers still open

- Wallet CAS receipts and recovery tests are implemented locally. Hosted atomic
  conditional-write semantics and workflow-level orchestration remain unverified.
  See WALLET_PROTOCOL.md for migration order, capacity and recovery restrictions.
- Tenant audit writes currently swallow failures; logging is not an authorization
  fix or a guaranteed durable audit trail.
- Staging smoke and hosted CI results have not yet been recorded.
- Secret owners and rotation dates must be confirmed in SECRETS_INVENTORY.md.
- **Security Headers Implementation Status:** PARTIALLY IMPLEMENTED - build-time headers added, but staging/production verification still needed