# OPEN RISKS — Production Readiness

**Last updated:** 2026-10-17

## Critical Risks

### R-001 Wallet Double Credit on Webhook Replay
**Likelihood:** Medium | **Impact:** Critical
Webhook idempotency relies on `IdempotencyKey.create` but signature verification missing. Duplicate events could credit wallet twice.
**Status:** IN PROGRESS - Initial fix complete, signature verification needed

### R-002 Concurrent Withdrawal Overspend
**Likelihood:** Medium | **Impact:** Critical
`walletLedger.ts` uses read-modify-write without locking. Two concurrent withdrawals may both pass balance check.
**Status:** IN PROGRESS - Initial fix complete, held-funds check needed

### R-003 Privilege Escalation via Service Role Bypass
**Likelihood:** Low | **Impact:** Critical
Many functions use `asServiceRole` without explicit caller verification. Role changes need audit.
**Status:** IN PROGRESS - Initial audit complete, enforcement needed

## High Risks

### R-004 Brand Confusion
Legacy Congo Commerce references remain in docs, domain, and historical commits. SEO and user trust risk.

### R-005 Missing Production Security Headers
Headers only added in Vite dev server. Production deployment may lack CSP/HSTS/X-Frame-Options.

### R-006 No Automated CI/CD
Manual deploys, no automated regression gating.

### R-007 Secrets Inventory Undocumented
No centralized secret registry; rotation policy undefined.

## Medium Risks

### R-008 Mobile/Web Drift
Flutter app exists; contract tests not run.

### R-009 Large JS Chunks
Build warnings for >500kB chunks may impact mobile users on 3G.

## Mitigations Planned

- Implement webhook signature verification + idempotency metrics
- Add atomic debit with held-funds and idempotency enforcement
- Enforce server-side role verification and audit logging
- Standardize brand to AfriTrade, archive legacy docs
- Move security headers to CDN/production config
- Add CI pipeline with lint/typecheck/test/build
- Document secret inventory and rotation
