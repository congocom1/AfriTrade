# OPEN RISKS — Production Readiness

**Last updated:** 2026-10-17  
**Archive:** Legacy Congo Commerce references removed  

## Critical Risks

### R-001 Wallet Double Credit on Webhook Replay
**Likelihood:** Medium | **Impact:** Critical  
**Status:** IN PROGRESS - Initial fix complete  
**Description:** Webhook idempotency relies on `IdempotencyKey.create` but signature verification missing. Duplicate events could credit wallet twice.  
**Mitigation planned:** Implement webhook signature verification + idempotency metrics  

### R-002 Concurrent Withdrawal Overspend
**Likelihood:** Medium | **Impact:** Critical  
**Status:** IN PROGRESS - Initial fix complete  
**Description:** `walletLedger.ts` uses read-modify-write without locking. Two concurrent withdrawals may both pass balance check.  
**Mitigation planned:** Add atomic debit with held-funds and idempotency enforcement  

### R-003 Privilege Escalation via Service Role Bypass
**Likelihood:** Low | **Impact:** Critical  
**Status:** IN PROGRESS - Initial audit complete  
**Description:** Role management not audited; Super-admin provisioning path unclear.  
**Mitigation planned:** Enforce server-side role verification and audit logging  

## High Risks

### R-004 Brand Confusion
**Likelihood:** RESOLVED | **Impact:** RESOLVED  
**Description:** Legacy Congo Commerce references remain in docs, domain, and historical commits. SEO and user trust risk.  
**Status:** **COMPLETED** - Legacy docs archived, codebase standardized to AfriTrade  

### R-005 Missing Production Security Headers
**Likelihood:** High | **Impact:** High  
**Description:** Headers only added in Vite dev server. Production deployment may lack CSP/HSTS/X-Frame-Options.  
**Status:** NOT STARTED - To be addressed in Stage 2.5  

### R-006 No Automated CI/CD
**Likelihood:** High | **Impact:** High  
**Description:** Manual deploys, no automated regression gating.  
**Status:** IN PROGRESS - CI/CD pipeline being implemented  

### R-007 Secrets Inventory Undocumented
**Likelihood:** Medium | **Impact:** Medium  
**Description:** No centralized secret registry; rotation policy undefined.  
**Status:** IN PROGRESS - Initial inventory created, needs completion  

## Medium Risks

### R-008 Mobile/Web Drift
**Likelihood:** Medium | **Impact:** Medium  
**Description:** Flutter app exists; contract tests not run.  
**Status:** NOT STARTED - To be addressed after core fixes  

### R-009 Large JS Chunks
**Likelihood:** Medium | **Impact:** Medium  
**Description:** Build warnings for >500kB chunks may impact mobile users on 3G.  
**Status:** NOT STARTED - To be addressed in Stage 2.5  

## Mitigations Planned

1. **Complete critical fixes (P0)** - Wallet concurrency, webhook signatures, privilege escalation
2. **Implement production security headers** - Move headers to CDN/production config
3. **Create CI/CD pipeline** - Automated testing and deployment gates
4. **Complete secrets inventory** - Document rotation and access controls
5. **Optimize performance** - Code-split large chunks, verify Flutter parity
6. **Standardize documentation** - Archive legacy docs, maintain living architecture docs

## Archive note

**This document has been archived from the main audit suite to clean up legacy Congo Commerce references. All risk assessments remain valid for the current AfriTrade implementation, with updated status indicators.**

---

**End of archived risks documentation**