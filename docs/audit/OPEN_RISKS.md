# OPEN RISKS — Production Readiness

**Last updated:** 2026-10-20

## Critical Risks

### R-001 Wallet Double Credit on Webhook Replay
**Likelihood:** Medium | **Impact:** Critical
**Status:** CLOSED (local)
Provider authentication is the RS256 JWT verification against
`WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY`; a missing key fails closed with 500 and an
invalid signature is rejected with 401, both before any purchase or wallet state
is read. The misleading "provider signature verification completed" log and its
dead commented-out block were removed so the code no longer claims a check it
does not perform. Idempotency is a checkout-keyed `IdempotencyKey` record plus the
`paid` short-circuit, and the grant validates amount, currency, status and
`payment_provider` before marking the order paid. Hosted replayed-delivery
behaviour is still unverified.

### R-002 Concurrent Withdrawal Overspend
**Likelihood:** Medium | **Impact:** Critical
**Status:** CLOSED (local)
Overspend is prevented by the conditional `Wallet.updateMany` predicate in
`walletLedger.ts`, which re-reads and re-checks the available balance on every
attempt and refuses the movement when the predicate no longer matches. The
withdrawal endpoint no longer keys idempotency on amount/method/account (which
swallowed a later legitimate identical withdrawal); it requires a caller-supplied
`request_id`, and a retry of the same id now returns the existing movement
instead of a 409 that would make the client retry a withdrawal that already
exists. Covered by `test/request-withdrawal.test.js` against the real ledger.
Hosted `updateMany` atomicity remains a release gate (WALLET_PROTOCOL.md).

### R-003 Privilege Escalation via Service Role Bypass
**Likelihood:** Low | **Impact:** Critical
**Status:** OPEN (reduced)
Every service-role function now verifies the caller except the two that must not
have an end user: `payments-webhook` (provider-signed, no session) and
`verifyDataRequest` (single-use emailed token is the credential). `manageTenantTeam`
rejects non-admin roles and logs unauthorized attempts; role, permission, invite
and removal changes are audited. Remaining work is not code: audit writes still
swallow failures, which is not a durable trail, and admin RLS still permits
direct entity edits that bypass these functions.

## High Risks

### R-005 Missing Production Security Headers
**Status:** OPEN (external decision required)
`scripts/security-headers-plugin.js` sets real response headers in local dev and
preview, and injects supported CSP/referrer metadata into the built HTML. Neither
configures production hosting. Configuring CSP (including `frame-ancestors`),
HSTS and the rest must be done by the host's supported mechanism once the hosting
owner is confirmed — see PRODUCTION_HARDENING.md.

### R-007 Secrets Inventory Undocumented
**Status:** OPEN (external decision required)
`docs/audit/SECRETS_INVENTORY.md` lists every variable read by the backend and the
frontend. Owner, rotation dates and valid values still require the credential
owner; they cannot be derived from the repository.

### R-004 Brand Confusion
**Status:** CLOSED (local)
Storefront copy no longer tells two stories: the DRC-only and CFA legal text was
removed from the dictionaries and CGV, the hero/FAQ/store copy matches the
pan-African configuration in `src/lib/config.js`, and the mobile-money validator
now accepts the Nigerian numbers the checkout's default country uses instead of
rejecting everything outside the DRC. Decisions that need a human remain
external: the registered legal entity, RCCM/NIF/VAT numbers, the production
domain, and the root-level historical reports (left in place as historical
evidence rather than silently deleted).

### R-006 No Automated CI/CD
**Status:** PARTIAL
`.github/workflows/ci.yml` runs lint, frontend typecheck, tests and build on
pushes and pull requests without deploying, plus an optional staging smoke job.
Hosted execution and branch protection are still unverified, and a green
typecheck does not cover the Deno backend.

## Medium Risks

### R-008 Mobile/Web Drift
**Status:** OPEN
The Flutter app exists but its contract tests are not run against the web build.

### R-009 Large JS Chunks
**Status:** OPEN
Build still warns about chunks over 500 kB (three.module, i18n, index) on 3G.
