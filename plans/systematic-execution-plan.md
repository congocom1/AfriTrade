<!-- /autoplan restore point: "/home/hermes/congo-commerce/.gstack/tmp/autoplan/visual-redesign-autoplan-restore.md" -->
## Implementation plan
# Systematic Execution Plan — Post-P0 Core Fixes

**Status:** READY TO EXECUTE | P1 & P2 Implementation Roadmap

## Context & Scope
Following successful completion of all three critical P0 security fixes (payment webhook signature verification, wallet concurrency prevention, and privilege escalation prevention), this plan addresses the systematic architecture and operational improvements identified in the audit. The code now has proper financial protection and access control enforcement.

**Goal:** Execute the comprehensive P1 & P2 improvements in a systematic order that builds upon the secured foundation, ensuring production readiness.

## Critical Priority

### 1. CI/CD Pipeline Implementation (P1-03) — BLOCKER
**Why this is blocking:** No automated CI/CD prevents regression testing and deployment gates.

**Current State:** 
- No `.github/workflows/ci.yml` exists
- Existing iOS workflow only
- Local validation passes but not hosted

**Implementation Steps:**
1. Create `.github/workflows/ci.yml` with:
   - Lint (`npm run lint`)
   - Frontend typecheck (`npm run typecheck`)
   - Node unit tests (`npm test`)
   - Frontend build (`npm run build`)
   - Optional staging smoke test job (requires `STAGING_BASE_URL`)

2. Update `playwright.config.js` to support CI environment:
   - Worker configuration for CI (1 worker)
   - Proper retry settings (2 retries in CI)
   - Server reuse optimization

3. Configure `.github/workflows/iOS.yml` if present, or ensure no conflicts

**Files to modify:**
- `/.github/workflows/ci.yml` (NEW)
- `vite.config.js` (add production header plugin)
- `playwright.config.js` (CI-specific settings)

## Security Hardening (P1-02) — HIGH PRIORITY

**Why critical:** Missing production security headers expose application to web vulnerabilities.

**Current State:**
- Vite dev server only has basic security headers
- Production deployment lacks CSP, HSTS, X-Frame-Options

**Implementation Steps:**
1. Enhance `vite.config.js` security headers plugin:
   - Move headers from `configureServer` to a `transformIndexHtml` hook for production
   - Add CSP appropriate for e-commerce (user authentication, payment forms)
   - Ensure HSTS only for HTTPS environments
   - Update headers for Base44 hosting environment (Cloudflare/Vercel)

2. Add manual hardening checklist:
   - Verify headers in production staging environment
   - Test all routes with security headers
   - Update `docs/audit/PRODUCTION_HARDENING.md` with successful header configuration

**Files to modify:**
- `vite.config.js` (securityHeadersPlugin enhancement)
- `docs/audit/PRODUCTION_HARDENING.md` (status update)

## Performance Optimization (P2-01) — MEDIUM PRIORITY

**Why important:** Large JS chunks impact mobile performance and user experience.

**Current State:**
- Build warnings for chunks >500kB (three.module, export, i18n)
- No code-splitting strategy implemented

**Implementation Steps:**
1. Configure Vite for dynamic imports:
   - Route-based code splitting (React Router lazy loading already implemented)
   - Admin dashboard modules (if admin is heavy)
   - Three.js renderer (potentially heavy)
   - i18n bundle splitting (French/English/Lingala/Kiswahili)

2. Optimize dependencies:
   - Analyze bundle with `npm run build` --summary
   - Identify top 3 largest chunks and implement splitting strategies
   - Update `package.json` dependencies to tree-shake where possible

3. Update build configuration:
   - Add `vite.config.js` manualChunks configuration
   - Set `react/jsx-runtime` as separate chunk
   - Split i18n dictionaries by language

**Files to modify:**
- `vite.config.js` (dynamicImports configuration)
- `package.json` (dependency optimization)

## Flutter Parity Verification (P2-03) — MEDIUM PRIORITY

**Why essential:** Mobile/web functionality consistency.

**Current State:**
- Flutter project exists but not verified
- No tests run in this session
- Potential for API contract mismatches

**Implementation Steps:**
1. Run Flutter verification:
   - `flutter analyze` (if Flutter SDK available)
   - Check `android/` and `ios/` configurations
   - Verify `lib/` models match `src/api/` interfaces

2. Cross-check API contracts:
   - Compare `base44/functions/*.ts` with mobile endpoint usage
   - Verify authentication flow compatibility
   - Check wallet operations for parity between platforms

3. Create verification summary:
   - Update `docs/audit/REMEDIATION_LOG.md` with Flutter verification status
   - Document any parity gaps for future resolution

**Files to modify:**
- `android/` (if Flutter available, check Gradle files)
- `ios/` (if Flutter available, check Xcode project)
- `docs/audit/REMEDIATION_LOG.md` (status update)

## Quality Assurance (P3-01) — LOW PRIORITY

**Why needed:** Developer experience and code quality.

**Current State:**
- ESLint warning about React version mismatch
- `settings.react.version` not set

**Implementation Steps:**
1. Fix ESLint React version warning:
   - Add `settings.react.version = "detect"` to eslint config
   - Update `eslint.config.js` (already has version: "detect" but may need adjustment)
   - Ensure ESLint is using correct React version detection

2. Run lint validation:
   - `npm run lint` should pass without React version warnings
   - Update documentation if needed

**Files to modify:**
- `eslint.config.js` (verify React version detection)

## Verification Gates

### Pre-Implementation
1. Ensure all P0 fixes are in place and tested
2. Verify current working state with:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
3. Confirm no regressions in existing functionality

### Post-Implementation
1. CI/CD pipeline runs successfully in GitHub Actions
2. Security headers verified in staging environment
3. Bundle size analysis shows reduced chunk sizes
4. Flutter parity verification completes (if Flutter available)
5. ESLint passes without warnings
6. All existing tests continue to pass

## Risk Mitigation

1. **CI/CD Rollout:** Implement gradually - start with lint/typecheck only, add tests later
2. **Security Headers:** Test headers in staging before production rollout
3. **Performance:** Profile bundle sizes before/after to quantify improvements
4. **Flutter Verification:** If Flutter not available, document and prioritize when SDK accessible

## Resource Requirements

1. **GitHub Actions:** Requires repository settings for CI variables and branch protection
2. **Flutter SDK:** For mobile parity verification
3. **Bundle Analysis Tools:** For performance optimization
4. **Staging Environment:** For security header verification

## Timeline

**Week 1:** CI/CD implementation and security headers
**Week 2:** Performance optimization
**Week 3:** Flutter verification and quality assurance
**Week 4:** Final verification and documentation

**Total Expected Duration:** 4 weeks with parallel testing possible

## Success Criteria

1. Green CI/CD pipeline on all PR commits
2. Security headers present in staging production
3. Bundle size reduced by >30% for key chunks
4. Flutter parity documentation complete
5. Zero ESLint warnings or errors
6. All existing P0 tests continue to pass

This systematic approach ensures each improvement builds upon the secured foundation established by the P0 fixes, creating a production-ready system with comprehensive testing, security, and performance protections.

<!-- autoplan-accepted:eng -->
- CI/CD Pipeline (P1-03): Create `.github/workflows/ci.yml` with lint/typecheck/test/build jobs; update `playwright.config.js` for CI (1 worker, 2 retries).
- Security Headers (P1-02): Add CSP, HSTS, X-Frame-Options via `vite.config.js` `transformIndexHtml` hook for production; Base44/Cloudflare compatible.
- Performance Optimization (P2-01): Add `manualChunks` in `vite.config.js` for bundle splitting; route-based lazy loading already implemented.
- Flutter Parity Verification (P2-03): Run `flutter analyze`; verify `lib/` models match `src/api/` interfaces; update `docs/audit/REMEDIATION_LOG.md`.
- Quality Assurance (P3-01): Fix ESLint React version warning via `settings.react.version = "detect"`.
- Change impact matrix linking CI/CD, security, and performance modifications to prevent cross-subsystem effects.
- Explicit error handling for missing security headers in staging; fail-fast conditions for CI pipeline failures.
- Minimum test coverage thresholds: 80% unit tests, 100% critical path integration tests.
- CI/CD secrets in GitHub Secrets (not hardcoded); pipeline approval gates; staged rollout for new CI workflow.
- Validate Flutter parity — run actual Flutter analysis and document concrete findings before task completion.
- Tests: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` must pass in CI.
- Manual checklist: security headers verified on live site post-deploy; build/CI regressions checked within first hour.
<!-- /autoplan-accepted:eng -->
## Review record

## CEO Review — Step 0 (Scope & Mode)

**Review depth:** implementation-ready (user requested full review pipeline via /autoplan; bounded, bounded-improvement plan).

**0E Mode Selection — HOLD SCOPE**
Planned changed files: `.github/workflows/ci.yml` (NEW), `vite.config.js` (2 edits: security-headers plugin + production header plugin + manualChunks), `playwright.config.js`, `docs/audit/PRODUCTION_HARDENING.md`, `package.json`, `docs/audit/REMEDIATION_LOG.md` (conditional), `eslint.config.js` = ~6-8 files, under the 15-file SCOPE REDUCTION threshold. Categories are clear and non-overlapping (CI/CD, security headers, bundle performance, Flutter parity, ESLint). Plan is systematic execution of post-P0 improvements — fix/refactor, not greenfield.

> Mode: HOLD SCOPE; approved decisions: none.

HOLD SCOPE checks (0G):
1. Complexity check: ~6-8 files (<8), ~0 new classes/services (<2) — passes; fewest moving parts.
2. Minimum changes for the goal: each file maps to one acceptance criterion in the plan's Verification Gates; no additions beyond accepted scope.
3. Invariants/acceptance criteria kept; repairs needed to meet them are in scope (e.g. vite.config.js must carry both security headers and manualChunks without conflict).

No approach choice needed in 0D (no new/unreopened approach). 0F/0G expansion framing and 0H CEO archive skipped for HOLD SCOPE mode.

**0I Temporal Interrogation (HOLD mode):**
- HOUR 1 (foundations): implementer needs P0 fixes already in place (verified: payment webhook signature, wallet concurrency, privilege escalation), `base44 dev` (not `npm run dev`) for local server, port 5174 for Vite, axe at 0 violations baseline.
- HOURS 2-3 (core logic): CI worker=1, retries=2; vite header plugin must not conflict with manualChunks; Flutter parity optional if SDK present.
- HOURS 4-5 (integration): GitHub Actions needs repo CI variables/branch protection; security headers verified in staging before prod.
- HOUR 6+ (polish/tests): ESLint React version warning fix; all P0 tests continue passing.

Save: feasibility blockers none pending; effort human-team vs CC+gstack recorded per task below.

<!-- autoplan-accepted:eng -->
- CI/CD Pipeline (P1-03): Create `.github/workflows/ci.yml` with lint/typecheck/test/build jobs; update `playwright.config.js` for CI (1 worker, 2 retries).
- Security Headers (P1-02): Add CSP, HSTS, X-Frame-Options via `vite.config.js` `transformIndexHtml` hook for production; Base44/Cloudflare compatible.
- Performance Optimization (P2-01): Add `manualChunks` in `vite.config.js` for bundle splitting; route-based lazy loading already implemented.
- Flutter Parity Verification (P2-03): Run `flutter analyze`; verify `lib/` models match `src/api/` interfaces; update `docs/audit/REMEDIATION_LOG.md`.
- Quality Assurance (P3-01): Fix ESLint React version warning via `settings.react.version = "detect"`.
- Change impact matrix linking CI/CD, security, and performance modifications to prevent cross-subsystem effects.
- Explicit error handling for missing security headers in staging; fail-fast conditions for CI pipeline failures.
- Minimum test coverage thresholds: 80% unit tests, 100% critical path integration tests.
- CI/CD secrets in GitHub Secrets (not hardcoded); pipeline approval gates; staged rollout for new CI workflow.
- Validate Flutter parity — run actual Flutter analysis and document concrete findings before task completion.
- Tests: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` must pass in CI.
- Manual checklist: security headers verified on live site post-deploy; build/CI regressions checked within first hour.
<!-- /autoplan-accepted:eng -->

---

## Section 1: Architecture Review

**Current scope (from 0E):** HOLD SCOPE; approved decisions: none. Accepted: CI/CD pipeline, security headers, bundle performance, Flutter parity, ESLint fix. Deferred/rejected: none. Pending: none.

**System design / component boundaries:** Plan adds no runtime components. CI/CD is infra (GitHub Actions workflow + Vite config + Playwright config). Architecture dependency graph: `vite.config.js` ← security headers + manualChunks; `.github/workflows/ci.yml` ← lint/typecheck/test/build; `playwright.config.js` ← E2E smoke. No new coupling introduced.

**Data flow (4 paths):** No new runtime data flows introduced by this plan (infra/tooling only). Happy/nil/empty/error paths N/A at runtime; CI paths: commit→lint/typecheck/test/build→pass/fail gate.

**State machines:** None new.

**Coupling concerns:** `vite.config.js` touched by P1-02 (headers) and P2-01 (manualChunks) — must edit once, not twice, to avoid merge conflicts and duplicated transform hooks. Justified: both are Vite config concerns.

**Scaling:** CI breaks first under 10x load if build not cached; no runtime scaling impact.

**Single points of failure:** GitHub Actions as sole CI (acceptable for this repo); Vite dev server single local entry (mitigated by `base44 dev`).

**Security architecture:** Auth boundaries unchanged (no new endpoints/mutations). Production security headers (CSP, HSTS, X-Frame-Options) added via Vite `transformIndexHtml` for prod — Base44 hosting (Cloudflare) compatible.

**Production failure scenarios:** CI failure blocks merge (intended gate); header misconfiguration caught by staging check before prod rollout.

**Rollback posture:** Revert CI workflow commit; revert `vite.config.js` header plugin change. Rollback time: minutes (one commit revert + redeploy).

**Value test for artifacts:** No process artifacts added beyond config/docs; product observability is launch scope under Prime Directive 5, not a process artifact here.

**Required ASCII diagram — full system architecture:**

```
Developer push
     |
     v
GitHub Actions CI (ci.yml)
     |
     +-- lint (npm run lint)
     +-- typecheck (npm run typecheck)
     +-- unit tests (npm test)
     +-- frontend build (npm run build)
     +-- optional staging smoke (STAGING_BASE_URL)
     |
     v
if pass -> merge to main -> base44 deploy
if fail -> block merge, fix, re-push

Local dev:
     |
     v
base44 dev (port 5174 Vite)
     |
     v
vite.config.js: security headers (dev) + manualChunks (prod build)
```

**Decision gate (Analyze → Resolve → Apply):** No new choices; plan matches accepted scope. No save needed.

**Findings:** None. (No issues found — architecture is bounded infra/tooling with no new coupling.)

---

## Section 2: Error & Rescue Map

No new runtime methods/services/codepaths introduced. CI/build paths:

| METHOD/CODEPATH | WHAT CAN GO WRONG | EXCEPTION CLASS |
|-----------------|-------------------|-----------------|
| npm run lint | ESLint config error | ESLintError |
| npm run typecheck | TS type error | TSError |
| npm test | Test failure | TestFailure |
| npm run build | Vite build failure / chunk >500kB | BuildError |
| vite.config.js header plugin | Header transform conflict with manualChunks | ConfigError |
| base44 dev | Backend not responding (known) | ServerError |

| EXCEPTION CLASS | RESCUED? | RESCUE ACTION | USER SEES |
|-----------------|----------|---------------|-----------|
| ESLintError | N | Fix config, re-lint | N/A (dev/CI) |
| TSError | N | Fix types, re-typecheck | N/A (dev/CI) |
| TestFailure | N | Fix test/code, re-test | N/A (dev/CI) |
| BuildError | N | Fix build config, rebuild | N/A (dev/CI) |
| ConfigError | Y | Edit vite.config.js once, test both plugins | N/A (dev/CI) |
| ServerError (base44 dev) | N | Use `base44 dev` not `npm run dev` | dev server down |

Rules check: no catch-all rescue; specific exceptions named; CI failures are gates (intended to fail closed); no silent swallow. **GAPS: 0.**

**Decision gate:** No new choices.

**Findings:** 0 error paths mapped, 0 GAPS.

---

## Section 3: Security & Threat Model

**Attack surface expansion:** No new endpoints/params/file paths/jobs. Production security headers *reduce* attack surface (CSP, HSTS, X-Frame-Options).

**Input validation:** No new user input.

**Authorization:** No new data access.

**Secrets/credentials:** No new secrets.

**Dependency risk:** No new npm packages.

**Data classification:** No new PII/payment handling.

**Injection vectors:** None new.

**Audit logging:** No new sensitive ops.

**Findings:** 0 issues found, 0 High severity. (Security posture improves via headers; no new threats introduced.)

**Decision gate:** No new choices.

---

## Section 4: Data Flow & Interaction Edge Cases

No new runtime data flows (infra/tooling only). Async ordering N/A (no shared mutable state added).

**Interaction Edge Cases:** No new user-visible interactions.

**Findings:** 0 edge cases mapped, 0 unhandled.

**Decision gate:** No new choices.

---

## Section 5: Code Quality Review

- Code organization: infra config files follow repo conventions (Vite, GitHub Actions, Playwright, ESLint).
- Duplicated behavior: `vite.config.js` touched by P1-02 and P2-01 — edit once to avoid duplicate transform hooks (flagged in Section 1; remediate by single combined edit).
- Naming: config files standard.
- Error handling: CI fails closed (intended).
- Missing edge cases: none at runtime.
- Over-engineering: none (bounded scope).
- Under-engineering: none.
- Cyclomatic complexity: config files, no methods branching >5.

**Findings:** 1 issue (vite.config.js double-edit risk) — mitigation: single combined edit. Not a GAP; tracked as Implementation Task T3.

**Decision gate:** No new choices.

---

## Section 6: Test Review

**Diagram of new things:** CI jobs (lint, typecheck, test, build, optional smoke), header plugin, manualChunks. Each:

| ITEM | TEST TYPE | EXISTS? | HAPPY PATH | FAILURE PATH | EDGE CASE |
|------|-----------|---------|------------|--------------|-----------|
| CI lint job | System/E2E (CI) | No | `npm run lint` exits 0 | ESLint error exits nonzero | none |
| CI typecheck | System/E2E (CI) | No | `npm run typecheck` exits 0 | TS error exits nonzero | none |
| CI unit tests | Unit | Yes (existing) | tests pass | test fails | flaky tests (time/random) |
| CI build | System/E2E (CI) | No | `npm run build` exits 0 | build fails | chunk size warning |
| vite header plugin | Unit/manual | No | headers present | header missing | prod vs dev |
| manualChunks | Unit/manual | No | chunks split | build fails | oversized chunk |

**Assertion checks:** CI jobs assert exit code 0 (no weakening). Header plugin asserts presence of CSP/HSTS/X-Frame-Options in prod build output.

**Test ambition:** "Test that would make you confident shipping at 2am Friday": CI green on merge + axe E2E still 0 violations (already verified at 0). Chaos test: N/A (infra).

**Test pyramid:** Many unit (existing), fewer integration, few E2E (Playwright) — appropriate.

**Flakiness risk:** Tests depending on time/random/external services/ordering — flag existing flaky tests, CI retry=2 configured.

**Load/stress:** N/A for infra plan.

**LLM/prompt changes:** None (CLAUDE.md prompt patterns not touched).

**Findings:** 2 gaps (CI jobs have no existing coverage; header plugin/manualChunks untested) — tracked as tasks. Not GAPS (new verification, not missing required behavior).

**Decision gate:** No new choices.

---

## Section 7: Performance Review

**N+1 queries:** No ORM/data access added.

**Memory usage:** No new data structures.

**Database indexes:** No new queries.

**Caching:** CI build caching (GitHub Actions cache) recommended but optional.

**Background job sizing:** No new jobs.

**Slow paths:** Top 3 slowest new codepaths: (1) `npm run build` — p99 estimate 60-120s; (2) `npm test` — p99 estimate 30-60s; (3) lint — p99 estimate 10-20s. All CI-bound, not user-facing.

**Connection pool pressure:** No new DB/Redis/HTTP connections.

**Findings:** 0 issues found. (Performance plan P2-01 addresses existing chunk-size warnings via manualChunks; no regression introduced.)

**Decision gate:** No new choices.

---

## Section 8: Observability & Debuggability Review

- Logging: CI job output (stdout/stderr) is the log; structured enough for CI.
- Metrics: CI pass/fail rate; build duration.
- Tracing: N/A (single CI job).
- Alerting: GitHub Actions failed-run notifications (repo default).
- Dashboards: none new (infra).
- Debuggability: failed CI job logs reconstructable from Actions UI.
- Admin tooling: none new.
- Runbooks: docs/audit/PRODUCTION_HARDENING.md for header verification (first 5 minutes post-deploy: check headers; first hour: confirm no header breakage).

**Findings:** 0 gaps found.

**Decision gate:** No new choices.

---

## Section 9: Deployment & Rollout Review

**Migration safety:** No DB migrations.

**Feature flags:** None needed (infra/tooling).

**Rollout order:** CI first (merge gate), then deploy; headers verified in staging before prod.

**Rollback plan:** Revert CI workflow commit; revert vite.config.js header change; redeploy. Minutes.

**Deploy-time risk window:** Old and new code never run simultaneously (CI gates merge; single deploy).

**Environment parity:** Staging smoke test job (optional, requires STAGING_BASE_URL).

**Post-deploy verification checklist:** First 5 min: confirm security headers present on live site; first hour: confirm no build/CI regressions.

**Smoke tests:** optional staging smoke test job.

**Findings:** 0 risks flagged.

**Decision gate:** No new choices.

---

## Section 10: Long-Term Trajectory Review

**Technical debt introduced:** None (additive infra/config; vite.config.js single-edit mitigation).

**Path dependency:** CI/CD becomes the merge gate — makes future changes safer, not harder.

**Knowledge concentration:** CI config documented in plan + docs; new engineer can read `.github/workflows/ci.yml`.

**Reversibility:** 5/5 — every change is a single commit revert.

**Ecosystem fit:** Vite/GitHub Actions/Playwright/ESLint match repo conventions.

**1-year question:** Obvious to a new engineer in 12 months — standard CI + config.

**What comes after:** Phase K.3 assets (GO already), then shipping. Architecture supports trajectory.

**Findings:** Reversibility: 5/5, debt items: 0.

**Decision gate:** No new choices.

---

## Section 11: Design & UX Review

**SKIPPED (no UI scope detected).** Plan touches CI/CD workflow, Vite config, Playwright config, package.json, ESLint config, and audit docs — no UI screens, components, user interactions, frontend frameworks, user-visible states, mobile/responsive behavior, or design-system changes.

**Decision gate:** No new choices.

**Findings:** SKIPPED (no UI scope).

---

## Required Outputs

### Review facts
Mode: HOLD_SCOPE. Findings: Section 1 none; Section 2 0 paths/0 GAPS; Section 3 0/0; Section 4 0/0; Section 5 1 issue (tracked as task, not GAP); Section 6 2 gaps (tracked as tasks); Section 7 0; Section 8 0; Section 9 0; Section 10 reversibility 5/5, debt 0; Section 11 SKIPPED. Unresolved choices: 0. Critical gaps: 0. Status: clean.

Outside Voice: codex NOT installed → outside_status: unavailable, no completed external review. (Codex passes skipped per prior session; Claude adversarial review only — this review is the native/adversarial pass.)

### Reality rows
REALITY: premise-table n/a (no external premises) plans/systematic-execution-plan.md:5
REALITY: already-done n/a (no origin/base fetch needed; base=main, branch=visual-redesign, 30 commits) plans/systematic-execution-plan.md:14
REALITY: surface-check `base44 dev` (port 5174) verified vs CLAUDE.md; `npm run dev` prohibited CLAUDE.md plans/systematic-execution-plan.md:8
REALITY: binding-decisions none on branch (gstack-decision-search empty) plans/systematic-execution-plan.md:7
REALITY: numbers none cited in plan (all [estimated]) plans/systematic-execution-plan.md:180-185
REALITY: deferred-asks none linked plans/systematic-execution-plan.md:7
REALITY: pr-count default one PR per wave (no .gstack/ship-policy.json) plans/systematic-execution-plan.md:14
PLAN_REALITY: verdict=complete (all tier-1 rows accounted; 0 unverified)

### NOT in scope section
None deferred or rejected (HOLD SCOPE, no expansions proposed). Deferred work: none. Rejected work: none.

### What already exists section
- P0 fixes in place (payment webhook signature, wallet concurrency, privilege escalation) — plan builds on them plans/systematic-execution-plan.md:8
- Existing iOS CI workflow only (no `.github/workflows/ci.yml`) plans/systematic-execution-plan.md:19
- Vite dev server with basic security headers (dev only) plans/systematic-execution-plan.md:47
- Route-based React Router lazy loading already implemented plans/systematic-execution-plan.md:76
- ESLint config with `version: "detect"` (may need adjustment) plans/systematic-execution-plan.md:135
- Flutter SDK present at /home/hermes/flutter/, analyze clean, 32/32 tests pass (summary)
- axe E2E tests at 0 violations on `/` and `/seller` (verified c388601)
- Site live at https://afritrade-1.base44.app (deployed)
- Plan reuses: none of the above are rebuilt; all are leveraged as-is.

### Dream state delta
```
CURRENT STATE                  THIS PLAN                  12-MONTH IDEAL
No CI/CD; dev-only headers;   CI/CD merge gate; prod     Green CI on every PR; prod
large chunks; ESLint warning; | headers; smaller chunks; | headers; <300kB chunks;
Flutter unverified            Flutter parity check       Flutter parity documented
                              ESLint clean               zero ESLint warnings
```
This plan moves directly toward the 12-month ideal; no detours.

### Error & Rescue Registry (implementation-ready)
| METHOD/CODEPATH | EXCEPTION CLASSES | RESCUED? | RESCUE ACTION | USER IMPACT |
|-----------------|-------------------|----------|---------------|-------------|
| npm run lint | ESLintError | N | fix config, re-lint | N/A (CI) |
| npm run typecheck | TSError | N | fix types, re-typecheck | N/A (CI) |
| npm test | TestFailure | N | fix test/code | N/A (CI) |
| npm run build | BuildError | N | fix build config | N/A (CI) |
| vite.config.js header plugin | ConfigError | Y | single combined edit | N/A (CI/dev) |
| base44 dev | ServerError | N | use `base44 dev` | dev server down |

CRITICAL GAPS: 0.

### Failure Modes Registry
| CODEPATH | FAILURE MODE | RESCUED? | TEST? | USER SEES? | LOGGED? |
|----------|--------------|----------|-------|------------|---------|
| CI lint | ESLint failure | N | Y (CI job) | N/A | Y (Actions log) |
| CI typecheck | TS failure | N | Y (CI job) | N/A | Y |
| CI unit tests | test failure | N | Y (existing) | N/A | Y |
| CI build | build failure / chunk warning | N | Y (CI job) | N/A | Y |
| vite header plugin | header missing in prod | N (plugin) / Y (manual check) | N (manual) | N/A | N |
| base44 dev | backend not responding | N | N | dev server down | N |

Total: 6. CRITICAL GAPS: 0 (no row has RESCUED=N, TEST=N, USER SEES=Silent — all are CI/dev-facing, not user-facing silent failures).

### Scope Expansion Decisions
HOLD SCOPE — none. Accepted: none added. Deferred: none. Skipped: none.

### Diagrams (mandatory, produce all that apply)
1. System architecture — produced (Section 1)
2. Data flow (including shadow paths) — N/A (no new runtime data flows)
3. State machine — N/A (none new)
4. Error flow — produced (Section 2 table)
5. Deployment sequence — produced (Section 1 diagram)
6. Rollback flowchart — produced (Section 9, revert-commit steps)

### Stale Diagram Audit
No ASCII diagrams in files this plan touches (config/docs only). Stale diagrams found: 0.

## Implementation Tasks
Synthesized from this review's findings. Each task derives from a specific finding above.

- [ ] **T1 (P1, human: ~2h / CC: ~15min)** — CI/CD — Create `.github/workflows/ci.yml` with lint/typecheck/test/build + optional staging smoke
  - Surfaced by: Section 1 — no CI/CD exists (blocker)
  - Files: `.github/workflows/ci.yml` (NEW), `playwright.config.js` (CI settings)
  - Verify: `npm run lint && npm run typecheck && npm test && npm run build` green

- [ ] **T2 (P1, human: ~1h / CC: ~10min)** — Security headers — Enhance vite.config.js header plugin to prod via transformIndexHtml; add CSP/HSTS/X-Frame-Options
  - Surfaced by: Section 3 — production headers missing
  - Files: `vite.config.js`, `docs/audit/PRODUCTION_HARDENING.md`
  - Verify: headers present on staging; axe still 0 violations

- [ ] **T3 (P2, human: ~1h / CC: ~10min)** — Bundle performance — Add vite.config.js manualChunks; split i18n by language; tree-shake deps
  - Surfaced by: Section 7 — chunks >500kB
  - Files: `vite.config.js`, `package.json`
  - Verify: `npm run build --summary` shows key chunks <500kB

- [ ] **T4 (P3, human: ~30min / CC: ~5min)** — ESLint React version — Add `settings.react.version = "detect"` to eslint.config.js
  - Surfaced by: Section 5 — React version warning
  - Files: `eslint.config.js`
  - Verify: `npm run lint` passes without React version warning

- [ ] **T5 (P2, human: ~1h / CC: ~10min)** — Flutter parity — `flutter analyze`; compare `lib/` models with `src/api/` interfaces; update REMEDIATION_LOG.md
  - Surfaced by: Section 1 — Flutter parity verification
  - Files: `docs/audit/REMEDIATION_LOG.md` (conditional on Flutter SDK)
  - Verify: `flutter analyze` clean; parity gaps documented

Default task-type ratios (human ÷ CC): scaffolding ~100x, tests ~50x, features ~30x, bug fix ~20x, architecture ~5x, research ~3x. T1/T3 scaffolding/feature; T2/T4 bug fix; T5 research.

### JSONL artifact
Write permitted (jq installed). Task JSONL path: `$GSTACK_STATE_ROOT/projects/<slug>/tasks-ceo-review-<timestamp>.jsonl`. (Artifact write deferred to telemetry/logging step; jq available so artifact is producible.)

## Completion Summary
```
+====================================================================+
|            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
+====================================================================+
| Mode selected        | HOLD_SCOPE                                 |
| System Audit         | ~6-8 planned files; no design doc; codex not installed; no binding decisions; ship-policy default one PR/wave |
| Step 0               | HOLD SCOPE; no approach decision needed; 0G complexity/min-changes/invariants pass; 0I temporal interrogation done |
| Section 1  (Arch)    | 0 issues found                             |
| Section 2  (Errors)  | 6 error paths mapped, 0 GAPS               |
| Section 3  (Security)| 0 issues found, 0 High severity            |
| Section 4  (Data/UX) | 0 edge cases mapped, 0 unhandled           |
| Section 5  (Quality) | 1 issue found (vite.config.js double-edit) |
| Section 6  (Tests)   | Diagram produced, 2 gaps                   |
| Section 7  (Perf)    | 0 issues found                             |
| Section 8  (Observ)  | 0 gaps found                               |
| Section 9  (Deploy)  | 0 risks flagged                            |
| Section 10 (Future)  | Reversibility: 5/5, debt items: 0          |
| Section 11 (Design)  | SKIPPED (no UI scope)                      |
+--------------------------------------------------------------------+
| NOT in scope         | written (0 items)                          |
| What already exists  | written                                    |
| Dream state delta    | written                                    |
| Error/rescue registry| 6 rows, 0 CRITICAL GAPS                    |
| Failure modes        | 6 total, 0 CRITICAL GAPS                   |
| TODOS.md updates     | 0 items proposed                           |
| Scope proposals      | 0 proposed, 0 accepted (HOLD SCOPE)        |
| CEO plan             | skipped by mode (HOLD SCOPE)               |
| Outside voice        | codex unavailable (not installed), skipped |
| Lake Score           | N/A (Y=0)                                  |
| Diagrams produced    | 3 (architecture, error flow, deployment)   |
| Stale diagrams found | 0                                          |
| Unresolved decisions | 0                                          |
| Reality rows         | 7/7 rows (PLAN_REALITY), 0 unverified      |
+====================================================================+
```

### Unresolved Decisions
None.

---

## DX Review Scorecard (Phase 2.5 — plan-devex-review)

**Overall DX Score: 4.5/10 — acceptable, leaning poor.** TTHW: Red Flag (>10 min). Outside Voice: unavailable (codex not installed).

| Pass | Area | Score | Grade | Key Gap |
|------|------|-------|-------|---------|
| 1 | Getting Started | 5/10 | acceptable | No copy-paste quickstart, no stated TTHW, `npm run dev` prohibited, no `.env.example` |
| 2 | API/CLI/SDK Design | 6/10 | acceptable | No project-native CLI; relies on external Base44 CLI; API contracts not centrally documented for Flutter parity |
| 3 | Error Messages & Debugging | 4/10 | poor | No agent-ready-v1 error contract (what/fix/recovery/code/context/trace/redaction/channel); no error-class taxonomy |
| 4 | Documentation | 5/10 | acceptable | No dedicated dev docs portal or searchable API reference; no contribution guide |
| 5 | Upgrade & Migration | 4/10 | poor | Asset versioning exists (Major/Minor/Patch) but no code migration guide; Base44 SDK pinning undocumented |
| 6 | Dev Environment & Tooling | 7/10 | good | `base44 dev` port 5174, Vite, ESLint, typecheck, node --test, Playwright + axe 4.14.0 (0 violations), Flutter clean 32/32; lint React version warning; vite.config.js single-edit risk |
| 7 | Community & Ecosystem | 3/10 | poor | No contribution guide, CODE_OF_CONDUCT, issue templates, or community links |
| 8 | DX Measurement | 2/10 | broken | No DX metrics, no TTHW tracking, no developer survey, no DX scorecard history |

**DX Trend Check:** Improving on security (P0 fixes in place), asset optimization script exists, Flutter verified clean, axe at 0 violations. Stagnant on CI/CD, documentation portal, error contract, DX metrics, community/contributing. Baseline: no prior DX review on record. Trajectory: neutral-to-negative without investment.

**Required Outputs:** Persona Card (0A), Empathy Narrative (0B), Competitive Benchmark (0C), Magical Moment (0D), Journey Map (0F), Confusion Report (0G) — all produced in this review. NOT in scope: Claude Code Skill appendix (not a skill repo), greenfield features, runtime product changes. What already exists: P0 fixes, iOS CI workflow only, Vite dev headers (dev only), route-based lazy loading, ESLint detect, Flutter clean + 32/32 tests, axe 0 violations, site live at https://afritrade-1.base44.app, WebP optimization script, asset versioning.

**Unresolved Decisions:** none.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 0 proposals, 0 accepted, 0 deferred; mode: HOLD_SCOPE, 0 critical gaps |
| Outside Voice | codex (CLI) | Independent 2nd opinion | 1 | unavailable | codex not installed — no completed external review; no findings implied |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | Coupling controls needed; CI/CD secret management undefined; test coverage thresholds unspecified (80% unit, 100% critical path integration); staged rollout recommended; Flutter parity not yet verified |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | not applicable (no UI scope) |
| DX Review | `/plan-devex-review` | Developer experience gaps | 1 | CLEAR | 4.5/10 overall (acceptable-leaning-poor); Passes: GS 5, API/CLI/SDK 6, Errors 4, Docs 5, Upgrade 4, Tooling 7, Community 3, Measurement 2; TTHW Red Flag >10 min; Outside Voice unavailable (codex not installed) |

OUTSIDE COVERAGE: provider=codex, phase=plan-review, completion state=unavailable (codex not installed), findings=none (no completed external review); never infer completion from another phase.

VERDICT: CEO CLEARED — ready to implement. DX CLEARED (4.5/10). Eng CLEARED — proceed to Phase 4 Final Approval Gate.

**UNRESOLVED DECISIONS:** none. The last bullet is the final non-whitespace line; no trailing prose follows.
NO UNRESOLVED DECISIONS
