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

## Production response headers — blocked on confirmed hosting controls

The Vite configureServer hook in the current configuration does not establish
production response headers. Do not copy an assumed Vercel/Netlify configuration
into this Base44 repository and call it deployed.

1. Confirm who controls headers on the production HTML origin and custom domains.
2. Configure headers at that serving layer, covering SPA routes and error responses:
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - X-Frame-Options: DENY (confirm embedding is not required)
   - Strict-Transport-Security: max-age=31536000, only after HTTPS is verified.
     Do not add includeSubDomains or preload until all affected domains are ready.
3. Inventory required script, API, image, font and payment origins. Trial a
   Content-Security-Policy-Report-Only policy on staging before enforcement.
   Include object-src 'none', base-uri 'self' and frame-ancestors 'none' in the
   proposed policy; finish its source allowlists from observed application needs.
   Do not deploy the API response policy script-src 'none' to the frontend.
4. Verify final HTTPS GET response headers on home, deep links, redirects, error
   responses and API endpoints. Record origin, timestamp, status and headers.
5. Exercise login, checkout, hosted payment return and mobile clients before
   marking the production header gate complete. Keep an approved rollback plan.

## Release blockers still open

- Wallet CAS receipts and recovery tests are implemented locally. Hosted atomic
  conditional-write semantics and workflow-level orchestration remain unverified.
  See WALLET_PROTOCOL.md for migration order, capacity and recovery restrictions.
- Tenant audit writes currently swallow failures; logging is not an authorization
  fix or a guaranteed durable audit trail.
- Staging smoke and hosted CI results have not yet been recorded.
- Secret owners and rotation dates must be confirmed in SECRETS_INVENTORY.md.