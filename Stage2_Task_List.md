# Stage 2 — Task List

**Target branch:** review/stage2-architecture  
**Date:** 2026-10-17
**Author:** Claude Code

## 1. Executive summary

This document tracks all tasks for Stage 2 (Architecture) of the AfriTrade 16-stage implementation directive. Tasks are prioritized by risk and impact.

## 2. Task categorization

### 2.1 Critical (P0) - Immediate (0-7 days)

**2.1.1 Payment webhook signature validation**
- **Location:** `base44/functions/payments-webhook/entry.ts`
- **Status:** NOT IMPLEMENTED
- **Risk:** Duplicate ORDER_APPROVED events could grant wallet twice on race
- **Impact:** Financial loss, duplicate credits
- **Owner:** Payment team
- **Dependencies:** None
- **Acceptance criteria:**
  - Verify webhook signature per provider
  - Retain create-only idempotency pattern
  - Add metrics for duplicate replay attempts

**2.1.2 Wallet concurrency / double spend fix**
- **Location:** `base44/shared/walletLedger.ts`
- **Status:** NOT IMPLEMENTED
- **Risk:** Concurrent debits may overspend before rollback detects
- **Impact:** Unauthorized double spending
- **Owner:** Backend team
- **Dependencies:** Wallet protocol gates
- **Acceptance criteria:**
  - Implement atomic debit with held-funds check or DB-level locking
  - Add idempotency key enforcement on all wallet-mutating functions
  - Pass existing walletLedger tests

**2.1.3 Privilege escalation audit**
- **Location:** `base44/functions/manageTenantTeam`, `auth` flow
- **Status:** NOT IMPLEMENTED
- **Risk:** Role self-selection, unauthorized admin access
- **Impact:** Privilege escalation
- **Owner:** Security team
- **Dependencies:** None
- **Acceptance criteria:**
  - Audit role changes in manageTenantTeam
- **Requirement:** Enforce server-side role verification only
- **Acceptance criteria:** Role changes only via server-side checks, no client-side role assignment

### 2.2 High (P1) - Short term (8-30 days)

**2.2.1 Brand standardization**
- **Location:** Legacy documentation
- **Status:** PARTIALLY IMPLEMENTED
- **Risk:** Brand confusion, SEO impact
- **Impact:** User trust, search visibility
- **Owner:** Product team
- **Dependencies:** Legacy docs identification
- **Acceptance criteria:**
  - Archive all AfriTrade references to `docs/archive/`
  - Update domain and metadata to AfriTrade
  - Confirm domain `afritrade` in production config

**2.2.2 Security headers production**
- **Location:** `vite.config.js` and Base44/Vercel/CDN config
- **Status:** NOT IMPLEMENTED
- **Risk:** Missing CSP/HSTS/X-Frame-Options in production
- **Impact:** XSS, clickjacking, protocol downgrade attacks
- **Owner:** DevOps team
- **Dependencies:** Hosting configuration confirmed
- **Acceptance criteria:**
  - Confirm who controls headers on production HTML origin
  - Configure headers at serving layer: X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Strict-Transport-Security
  - Verify final HTTPS GET response headers on all endpoints
  - Exercise login, checkout, hosted payment return before marking gate complete

**2.2.3 CI/CD pipeline**
- **Location:** `.github/workflows/ci.yml`
- **Status:** NOT IMPLEMENTED
- **Risk:** Manual deploys, no automated regression gating
- **Impact:** Deployment failures, inconsistent quality
- **Owner:** DevOps team
- **Dependencies:** Repository CI setup
- **Acceptance criteria:**
  - Add `.github/workflows/ci.yml` with lint, typecheck, test, build
  - Configure manual staging smoke job with STAGING_BASE_URL
  - Store job results and artifacts for verification

**2.2.4 Secrets inventory**
- **Location:** `docs/audit/SECRETS_INVENTORY.md`
- **Status:** PARTIALLY IMPLEMENTED
- **Risk:** Credential leakage risk
- **Impact:** Unauthorized access, data breach
- **Owner:** Security team
- **Dependencies:** Payment provider integration details
- **Acceptance criteria:**
  - Document env vars `WIX_CHECKOUT_API_KEY`, `WIX_CHECKOUT_SITE_ID`, `MAISHAPAY_*`
  - Define rotation schedule for each secret
  - Assign accountable owners and last rotation dates

### 2.3 Medium (P2) - Mid term (31-90 days)

**2.3.1 Large JS chunks optimization**
- **Location:** Build output
- **Status:** IDENTIFIED
- **Risk:** Mobile performance degradation
- **Impact:** Poor mobile user experience
- **Owner:** Frontend team
- **Dependencies:** Bundle analysis
- **Acceptance criteria:**
  - Split three.module >500kB chunk
  - Lazy-load admin modules
  - Build warnings resolved for all chunks >500kB

**2.3.2 Legacy audit docs archive**
- **Location:** `docs/audit/*.md`
- **Status:** READY TO EXECUTE
- **Risk:** Documentation noise
- **Impact:** Onboarding difficulty
- **Owner:** Documentation team
- **Dependencies:** Archive directory creation
- **Acceptance criteria:**
  - Archive all AUDIT_*.md files to `docs/archive/`
  - Update references in codebase
  - Remove from root-level inclusion

**2.3.3 Flutter parity verification**
- **Location:** Flutter project in `/lib/`
- **Status:** NOT VERIFIED
- **Risk:** Mobile/web feature drift
- **Impact:** Inconsistent user experience
- **Owner:** Mobile team
- **Dependencies:** Flutter SDK availability
- **Acceptance criteria:**
  - Run `flutter analyze` on project
  - Execute `flutter test` if test suite exists
  - Compare functionality with web implementation

**2.3.4 ESLint React version warning**
- **Location:** `eslint.config.js`
- **Status:** IDENTIFIED
- **Risk:** Configuration noise
- **Impact:** False positive warnings
- **Owner:** Frontend team
- **Dependencies:** ESLint configuration
- **Acceptance criteria:**
  - Add `settings.react.version` to eslint config
  - Lint warning resolved

### 2.4 Low (P3) - Long term (90+ days)

**2.4.1 Complete documentation**
- **Location:** Architecture documentation
- **Status:** PARTIALLY DOCUMENTED
- **Risk:** Knowledge loss
- **Impact:** Development friction
- **Owner:** Technical writer
- **Dependencies:** Task completion
- **Acceptance criteria:**
  - Maintain `Stage2_Architecture_Plan.md` as living document
  - Update `Stage2_Architecture_Validation.md` weekly
  - Document architectural decisions in team wiki

## 3. Task dependency analysis

### 3.1 Critical task dependencies

**Critical tasks have minimal dependencies:**
- All P0 tasks can proceed immediately
- No other Stage 2 tasks block P0 execution
- P0 tasks should be completed before P1 tasks

### 3.2 Task ordering

**3.2.1 Sequential dependencies:**
1. P0 tasks must complete before P1 tasks
2. Brand standardization (P1-01) should follow after critical security fixes
3. CI/CD pipeline (P1-03) can run in parallel with security headers

**3.2.2 Parallelizable tasks:**
- P0-01 and P0-02 can run concurrently
- P1-01 and P1-02 can run in parallel
- P2 tasks can run independently

### 3.3 Resource allocation

**3.3.1 Team allocation:**
- **Security team:** P0-03, P1-02, P1-04, P2-03
- **Backend team:** P0-02
- **Frontend team:** P2-01, P2-04, P3-01
- **DevOps team:** P1-03, P1-02
- **Product team:** P1-01
- **Mobile team:** P2-03

**3.3.2 Infrastructure requirements:**
- Staging environment for smoke tests
- CI/CD runner for automated tests
- Secret management for credential inventory

## 4. Task execution plan

### 4.1 Immediate (Next 7 days)

**Day 1-2: Critical security fixes**
1. Add webhook signature verification to payments-webhook
2. Implement wallet concurrency fix with idempotency
3. Audit privilege escalation paths

**Day 3-4: Documentation and setup**
1. Create `docs/archive/` directory
2. Archive legacy audit docs
3. Update team on progress

### 4.2 Short term (Next 30 days)

**Day 5-10: Operational fixes**
1. Create CI/CD pipeline
2. Configure staging environment
3. Document secrets inventory

**Day 11-20: Performance and brand**
1. Optimize JS chunks
2. Complete brand standardization
3. Verify Flutter parity

**Day 21-30: Technical debt**
1. Fix ESLint warning
2. Update architecture documentation
3. Validate task completion

### 4.3 Mid term (Next 90 days)

**Task monitoring:**
- Weekly progress reviews
- Risk assessment updates
- Resource reallocation if needed

## 5. Task completion criteria

### 5.1 Critical tasks acceptance

**For each P0 task:**
- Code changes implemented and merged
- Unit tests passing (182/182)
- Integration tests passing
- Security review completed

### 5.2 High tasks acceptance

**For each P1 task:**
- Requirements documented
- Implementation completed
- Testing completed
- Documentation updated

### 5.3 Medium tasks acceptance

**For each P2 task:**
- Issue opened (if applicable)
- Implementation started
- Progress tracked
- Dependencies resolved

## 6. Risk mitigation

### 6.1 Critical risk mitigation

**6.1.1 Financial risk (wallet double spend)**
- **Mitigation:** Implement held-funds check before debit
- **Backup:** Rollback mechanisms for failed transactions
- **Monitoring:** Balance reconciliation against receipts

**6.1.2 Security risk (webhook replay)**
- **Mitigation:** Provider signature verification
- **Backup:** Idempotency key enforcement
- **Monitoring:** Duplicate attempt logging

### 6.2 High risk mitigation

**6.2.1 Deployment risk (no CI/CD)**
- **Mitigation:** Manual deployment checklist
- **Backup:** Staged deployment with rollback plan
- **Monitoring:** Staging smoke test results

**6.2.2 Security risk (missing headers)**
- **Mitigation:** Header configuration documentation
- **Backup:** Manual header setup if automated fails
- **Monitoring:** Production header verification

### 6.3 Medium risk mitigation

**6.3.1 Performance risk (large chunks)**
- **Mitigation:** Code splitting and lazy loading
- **Backup:** Progressive enhancement approach
- **Monitoring:** Build performance metrics

**6.3.2 Documentation risk (legacy docs)**
- **Mitigation:** Archive process with reference updates
- **Backup:** Maintain both old and new documentation
- **Monitoring:** Reference validation scripts

## 7. Task tracking metrics

### 7.1 Completion metrics

**7.1.1 Task completion rate:**
```
Tasks completed: 0 / 19
Tasks in progress: 0 / 19
Tasks pending: 19 / 19
```

**7.1.2 Risk reduction:**
```
P0 risks addressed: 0 / 3
P1 risks addressed: 0 / 4
P2 risks addressed: 0 / 4
```

### 7.2 Quality metrics

**7.2.1 Code quality:**
- Lint passing: ✅
- Typecheck passing: ✅
- Build passing: ✅
- Test coverage: Variable

**7.2.2 Documentation:**
- Architecture docs: ✅
- Task list: ✅
- Implementation notes: ⏳

## 8. Task status visualization

### 8.1 Kanban view

| Task | Status | Owner | Priority |
|------|--------|-------|----------|
| P0-01 Webhook signature | 🚫 Not started | Payment team | Critical |
| P0-02 Wallet concurrency | 🚫 Not started | Backend team | Critical |
| P0-03 Privilege escalation | 🚫 Not started | Security team | Critical |
| P1-01 Brand standardization | 🔄 Ready to start | Product team | High |
| P1-02 Security headers | 🚫 Not started | DevOps team | High |
| P1-03 CI/CD pipeline | 🚫 Not started | DevOps team | High |
| P1-04 Secrets inventory | 🔄 Ready to start | Security team | High |
| P2-01 Large JS chunks | 🚫 Not started | Frontend team | Medium |
| P2-02 Legacy docs archive | 🔄 Ready to start | Documentation team | Medium |
| P2-03 Flutter parity | 🚫 Not started | Mobile team | Medium |
| P2-04 ESLint warning | 🚫 Not started | Frontend team | Medium |
| P3-01 Architecture docs | ✅ Complete | Technical writer | Low |

### 8.2 Timeline visualization

**Week 1 (2026-10-17 to 2026-10-23):** Critical P0 fixes
**Week 2-3 (2026-10-24 to 2026-11-07):** High P1 fixes  
**Week 4-6 (2026-11-08 to 2026-11-28):** Medium P2 fixes
**Week 7+ (2026-11-29+):** Low P3 tasks and maintenance

## 9. Task dependencies graph

### 9.1 Critical path

**P0 Critical Path:**
1. P0-01 (Webhook signature) - 2 days
2. P0-02 (Wallet concurrency) - 4 days  
3. P0-03 (Privilege escalation) - 1 day
4. **Total: 7 days critical work**

### 9.2 Branch strategy

**Current branch:** `review/stage2-architecture`

**Plan:**
- Create feature branches for each task group
- Merge after testing
- Keep main branch stable for production
- Feature branch naming: `feature/stage2-p0-[task]`

## 10. Task communication plan

### 10.1 Stakeholder updates

**Daily:**
- Progress summary to team leads
- Risk assessment updates
- Priority changes if needed

**Weekly:**
- Detailed task completion report
- Resource utilization review
- Timeline adjustment requests

**Milestone:**
- Critical task completion
- P0 risk reduction report
- Budget and resource review

### 10.2 Team communication

**Slack channels:**
- `#stage2-tasks` - Task tracking
- `#critical-fixes` - P0 emergency updates
- `#architecture` - Architecture discussions

**Meeting schedule:**
- Daily standup: 10:00 AM local time
- Weekly review: Friday 4:00 PM local time
- Emergency meetings: As needed for P0 issues

## 11. Task completion checklist

### 11.1 Before starting

- [ ] Read and understand all task requirements
- [ ] Check existing implementation
- [ ] Identify dependencies and blockers
- [ ] Reserve resources if needed

### 11.2 During execution

- [ ] Document decisions and rationale
- [ ] Update task status in real-time
- [ ] Run tests after changes
- [ ] Review peer changes

### 11.3 After completion

- [ ] Merge to feature branch
- [ ] Update task status to completed
- [ ] Document lessons learned
- [ ] Schedule next review

## 12. Task escalation process

### 12.1 Escalation triggers

- Task blocked for >3 days
- Critical task not progressing
- Resource conflict
- Unexpected technical issue

### 12.2 Escalation path

1. **Team lead** - First level escalation
2. **Technical leadership** - Second level
3. **Project management** - Third level
4. **Executive sponsor** - Fourth level

### 12.3 Communication

- Document escalation reason
- Provide estimated resolution time
- Update all stakeholders
- Record decision and outcome

---

**End of Stage 2 Task List**

**Next action:** Start with P0-01 (Payment webhook signature validation) as it poses immediate financial risk.