# REMEDIATION_LOG — Wallet / Payments / Brand

**Branch:** repair/afritrade-wallet-payments-2026-10-17  
**Date:** 2026-10-17

## Completed

- [x] Baseline report created `docs/audit/BASELINE_REPORT.md`
- [x] Full audit skeleton `docs/audit/FULL_AUDIT.md`
- [x] Repair branch created
- [x] E2E smoke spec rewritten for AfriTrade brand assertions, skip guards removed
- [x] `base44/functions/request-withdrawal/entry.ts` idempotency key added: `withdraw:${wallet.id}:${amount}:${method}:${account.slice(0,20)}`
- [x] `base44/functions/payments-webhook/entry.ts` IdempotencyKey.upsert → create
- [x] Wallet creation validation: `base44/functions/customerAccount/entry.ts` now blocks user-set `starting_balance` and enforces `balance` default 0 and owner resolver
- [x] Build / lint / typecheck / test all green

## Open P0

- **P0-01 Payment webhook signature validation** [IN PROGRESS]
  - File: `base44/functions/payments-webhook/entry.ts`
  - Risk: Duplicate ORDER_APPROVED without signature check
  - Action: Add provider signature verification before processing. Keep `create` idempotency, log replay attempts.
  - CLOSED 2026-10-20: RS256 JWT verification against
    `WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY` IS the provider authentication; missing key
    returns 500 and a bad signature returns 401 before any state is read. Removed
    the dead commented-out provider block and the "verification completed" log
    that claimed a check the code did not perform. Grant still validates amount,
    currency, status and `payment_provider`.

- **P0-02 Wallet concurrency** [IN PROGRESS]
  - File: `base44/shared/walletLedger.ts`
  - Risk: Read-modify-write allows concurrent overspend
  - Action: Implement atomic debit with held-funds check or DB-level locking. Add idempotency key enforcement on all wallet-mutating functions.
  - Update: Idempotency key now mandatory in postWalletEntry; debit path uses pending_usd hold-reservation; refund-payment calls now include idempotency keys. Concurrent replay safety and reservation correctness are NOT yet proven; required keys and sequential lookups do not establish atomic idempotency.
  - CLOSED 2026-10-20 (local): withdrawal idempotency no longer derives from
    amount/method/account, which suppressed a later legitimate identical
    withdrawal. It requires a caller-supplied `request_id` and a retry of the same
    id now returns the existing movement instead of a 409 that invited endless
    client retries. `test/request-withdrawal.test.js` exercises the real ledger and
    authorization against atomic in-memory storage (6 cases). Hosted CAS semantics
    remain a release gate.

- **P0-03 Privilege escalation** [IN PROGRESS]
  - Files: `base44/functions/manageTenantTeam/entry.ts`, `auth/entry.ts`
  - Risk: Role self-selection
  - Action: Audit role changes, require super-admin service role verification, log all role mutations.
  - Update: AuditLog entries added for bootstrap, invite, role change, permissions change, and member removal in manageTenantTeam.
  - Update 2026-10-20: sweep confirms every service-role function verifies the
    caller except the two that cannot have an end user (provider-signed
    `payments-webhook`, emailed-token `verifyDataRequest`). Remaining gap is
    operational (swallowed audit writes, admin RLS direct edits), not code.

## Also fixed 2026-10-20 — brand and correctness

- Mobile-money validation was DRC-only and rejected every Nigerian number, while
  the checkout's configured default country is Nigeria. One network table now
  covers both countries; CD/Nigeria local, trunked and international spellings
  all normalize to E.164, and wrong-length numbers are rejected instead of being
  sent to a gateway. `test/mobile-money.test.js` covers both countries.
- Storefront copy contradicted itself: hero/FAQ/store text promised DRC-only
  delivery and CFA/CDF pricing while the app config is pan-African, the CGV
  claimed Congolese law and Kinshasa courts, and pickup/directory labels leaked
  "RDC" into the UI. Aligned to the configured brand; legal-entity details
  remain a business decision.

## Open P1

- **P1-01 Brand standardization**
  - Legacy Congo Commerce docs/assets remain
  - Action: Archive legacy docs to `docs/archive/`, update DNS/metadata, confirm domain `afritrade` in production config.

- **P1-02 Security headers production**
  - File: `vite.config.js`
  - Action: Move headers to Base44/Vercel CDN config; ensure CSP, HSTS, X-Frame-Options in prod.

- **P1-03 CI/CD**
  - Action: Add `.github/workflows/ci.yml` with lint, typecheck, test, build.

- **P1-04 Secrets inventory**
  - Action: Document env vars `WIX_CHECKOUT_API_KEY`, `WIX_CHECKOUT_SITE_ID`, `MAISHAPAY_*`, rotation schedule.

## Open P2

- Large JS chunks >500kB
- Flutter parity not verified
- Legacy audit docs noise

## Next steps

1. Run Playwright smoke against staging.
2. Add unit tests for walletLedger atomic debit.
3. Implement webhook signature verification.
4. Create CI pipeline.
5. Archive legacy Congo Commerce docs.

## Production Readiness Gates

Latest local implementation: replaced tentative debit reservations with guarded
wallet revision/balance updates and durable receipts; added preparing ledger
projection recovery, payload conflict checks, keyed pending releases, and server
admin payout decisions. Updated ledger readers to exclude preparing candidates.
The former two TODO cases now pass as mandatory tests. Current local unit suite:
182 passing, zero TODO. Wallet ledger has a separate TypeScript check in Web CI.
See WALLET_PROTOCOL.md for deployment prerequisites and remaining workflow-level
risks. This supersedes the earlier TODO count below, not the production gates.

Follow-up wallet regression verification (2026-10-17): corrected double-counting
of the debit in the post-reservation funds check, rejected non-finite amounts
and blank keys, and removed fail-open handling of idempotency lookup errors.
The new walletLedger tests have six passing cases and two executable TODO cases
that currently fail their safety assertions: concurrent identical credits create
two movements, and retry after a failed ledger insert debits twice. These remain
P0 release blockers. The full suite reports 167 pass / 2 TODO, not full safety.

GitHub inspection: no repository variables configured; only the iOS workflow is
published. The new Web CI workflow remains local. No approved staging origin is
available, so STAGING_BASE_URL was not invented and no staging run was dispatched.
Production header ownership remains unconfirmed; no production changes made.

2026-10-17 follow-up: Web CI workflow added (lint, frontend typecheck, unit tests,
build; optional manual staging smoke). Hosted execution is still unverified.
Production header rollout checklist and preliminary secrets inventory added in
PRODUCTION_HARDENING.md and SECRETS_INVENTORY.md. No deployment settings changed.
Legacy root reports are historical; physical archival deferred pending link review.
Local validation: lint/typecheck/build passed, 161 unit tests passed. Frontend
typecheck does not cover backend functions. These results do not close P0 gates.

- [ ] P0 defects remediated and tested
- [ ] E2E smoke passes on staging
- [ ] Security headers verified in production
- [ ] Secrets inventory documented
- [ ] CI/CD pipeline green
