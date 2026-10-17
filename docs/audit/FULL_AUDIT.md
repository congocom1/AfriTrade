# FULL CODEBASE AUDIT — Priority Findings

**Date:** 2026-10-17
**Branch:** repair/afritrade-wallet-payments-2026-10-17
**Commit:** 9662ce1

## Scope
Read-only inventory completed. Partial code inspection performed. Findings classified per directive.

## P0 — Critical

### P0-01 Payment webhook idempotency regression risk
**Status:** IN PROGRESS - Initial fix complete, signature verification needed
**Evidence:** base44/functions/payments-webhook/entry.ts historically used `IdempotencyKey.upsert`. Changed to `create` to avoid SDK misuse.
**Impact:** Duplicate ORDER_APPROVED events could grant wallet twice on race.
**Verification:** Manual review shows `create` with `.catch(()=>{})` after top-of-handler duplicate check. No signature validation visible.
**Proposed correction:** Verify webhook signature per provider, retain create-only pattern, add metrics for duplicate replays.
**Progress:** Partial fix implemented - needs signature verification completion

### P0-02 Wallet concurrency / double spend
**Status:** IN PROGRESS - Initial fix complete, held-funds check needed
**Evidence:** `base44/shared/walletLedger.ts` uses read-modify-write with post-update negative balance rollback. No row-level locking.
**Impact:** Concurrent debits may overspend before rollback detects.
**Proposed correction:** Add idempotency key enforcement on all wallet-mutating entries and consider server-side held-funds check before debit.
**Progress:** Partial fix implemented - needs idempotency enforcement

### P0-03 Privilege escalation via role self-selection
**Status:** IN PROGRESS - Initial audit complete, enforcement needed
**Evidence:** Role management not audited; Super-admin provisioning path unclear.
**Impact:** Unauthorized admin access.
**Proposed correction:** Audit `base44/functions/manageTenantTeam`, `auth` flow, enforce server-side role checks only.
**Progress:** Audit logs added in manageTenantTeam, needs full enforcement

## P1 — High

### P1-01 Brand naming inconsistency
**Evidence:** Legacy docs reference Congo Commerce, live URL congocommerce.base44.app, README now AfriTrade. E2E tests updated for AfriTrade.
**Impact:** Confusion for users, SEO, support.
**Proposed correction:** Standardize on AfriTrade across domain, DNS, metadata, and archive legacy docs.

### P1-02 Security headers limited to dev server
**Evidence:** `vite.config.js` securityHeadersPlugin only applied to Vite dev server, not production hosting.
**Impact:** Production missing HSTS/CSP/X-Frame-Options.
**Proposed correction:** Move headers to Base44/Vercel/CDN config.

### P1-03 No CI/CD pipeline
**Evidence:** No `.github/workflows` for tests except iOS build.
**Impact:** Manual deploys, no automated gates.
**Proposed correction:** Add CI with lint, typecheck, test, build.

### P1-04 Secrets management undocumented
**Evidence:** Functions read `Deno.env.get` for WIX, MAISHAPAY keys. No rotation policy documented.
**Impact:** Credential leakage risk.
**Proposed correction:** Document secret inventory, enforce least privilege, rotation schedule.

## P2 — Medium

### P2-01 Large JS chunks
**Evidence:** Build warns chunks >500kB: three.module, export, i18n.
**Impact:** Mobile performance.
**Proposed correction:** Code-split Three.js, lazy-load admin modules.

### P2-02 Legacy audit documents remain
**Evidence:** Multiple AUDIT_*.md files referencing Congo Commerce.
**Impact:** Noise.
**Proposed correction:** Archive to `docs/archive/`.

### P2-03 Flutter parity not verified
**Evidence:** Flutter project exists but no tests run in this session.
**Impact:** Mobile/web drift.
**Proposed correction:** Run `flutter analyze` and contract tests.

## P3 — Low

### P3-01 ESLint React version warning
**Evidence:** `npm run lint` warning.
**Impact:** Noise.
**Proposed correction:** Add `settings.react.version` to eslint config.

---

## Verification methods used

- `git log`, `git status`
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- `base44/config.jsonc`, `package.json`, `vite.config.js` review
- Code search for secrets, idempotency, wallet logic

## Next actions

- Complete Phase One deep file inspection for auth, tenant isolation, payment flows.
- Run Playwright smoke suite against staging.
- Create remediation log and production-readiness checklist.
