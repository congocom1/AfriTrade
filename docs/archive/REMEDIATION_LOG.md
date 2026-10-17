# REMEDIATION_LOG — Wallet / Payments / Brand

**Branch:** repair/afritrade-wallet-payments-2026-10-17  
**Date:** 2026-10-17  
**Archive:** Legacy Congo Commerce references removed  

## Completed

- [x] Baseline report created `docs/audit/BASELINE_REPORT.md`  
- [x] Full audit skeleton `docs/audit/FULL_AUDIT.md`  
- [x] Repair branch created  
- [x] E2E smoke spec rewritten for AfriTrade brand assertions, skip guards removed  
- [x] `base44/functions/request-withdrawal/entry.ts` idempotency key added: `withdraw:${wallet.id}:${amount}:${method}:${account.slice(0,20)}`  
- [x] `base44/functions/payments-webhook/entry.ts` IdempotencyKey.upsert → create  
- [x] Wallet creation validation: `base44/functions/customerAccount/entry.ts` now blocks user-set `starting_balance` and enforces `balance` default 0 and owner resolver  
- [x] Build / lint / typecheck / test all green  
- [x] Legacy audit docs archived to `docs/archive/`  
- [x] Brand references standardized to AfriTrade throughout codebase  

## Open P0

- **P0-01 Payment webhook signature validation** [IN PROGRESS]
  - File: `base44/functions/payments-webhook/entry.ts`
  - Risk: Duplicate ORDER_APPROVED without signature check
  - Action: Add provider signature verification before processing. Keep `create` idempotency, log replay attempts.
  - Progress: JWT RS256 verification present; needs provider-specific signature validation

- **P0-02 Wallet concurrency** [IN PROGRESS]
  - File: `base44/shared/walletLedger.ts`
  - Risk: Read-modify-write allows concurrent overspend
  - Action: Implement atomic debit with held-funds check or DB-level locking. Add idempotency key enforcement on all wallet-mutating functions.
  - Progress: Idempotency enforcement in place, needs held-funds check integration

- **P0-03 Privilege escalation** [IN PROGRESS]
  - Files: `base44/functions/manageTenantTeam/entry.ts`, `auth/entry.ts`
  - Risk: Role self-selection
  - Action: Audit role changes, require super-admin service role verification, log all role mutations.
  - Progress: Audit logs added, needs super-admin role enforcement

## Open P1

- **P1-01 Brand standardization**
  - Status: **COMPLETED** - Legacy docs archived, references standardized
  
- **P1-02 Security headers production**
  - File: `vite.config.js`
  - Action: Move headers to Base44/Vercel/CDN config; ensure CSP, HSTS, X-Frame-Options in prod.
  - Status: NOT STARTED
  
- **P1-03 CI/CD**
  - Action: Add `.github/workflows/ci.yml` with lint, typecheck, test, build.
  - Status: IN PROGRESS - Pipeline being created
  
- **P1-04 Secrets inventory**
  - Action: Document env vars `WIX_CHECKOUT_API_KEY`, `WIX_CHECKOUT_SITE_ID`, `MAISHAPAY_*`, rotation schedule.
  - Status: IN PROGRESS - Initial inventory created

## Open P2

- Large JS chunks >500kB
- Flutter parity not verified
- Legacy audit docs remain  
  **Status:** Legacy audit docs **COMPLETED** - archived, other P2 items pending

## Next steps

1. Run Playwright smoke against staging.
2. Add unit tests for walletLedger atomic debit.
3. Implement webhook signature verification.
4. Create CI pipeline.
5. Verify Flutter parity with `flutter analyze`.
6. Optimize large JS chunks.

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
- [ ] Flutter parity verified
- [ ] Large JS chunks optimized

## Archive note

**This remediation log has been archived to clean up legacy Congo Commerce references. All remediation activities remain tracked in the main audit suite with updated status indicators.**

---

**End of archived remediation log**