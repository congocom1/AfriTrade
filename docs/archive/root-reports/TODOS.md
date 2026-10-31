# TODOS

## Ship

### Ship bisectable commits for visual-redesign release
**What:** Created separate commits for package.json, package-lock.json, and CHANGELOG.md following bisectable commit principles

**Why:** Each commit should be independently understandable and revertable per gstack commit style guidelines

**Context:** Steps 12 and 13 completed version bump to 0.0.1.0 and CHANGELOG.md creation. Committed as 4819602 (CHANGELOG.md) and edc1bf3 (package.json + package-lock.json). TODOS.md itself remains uncommitted.

**Effort:** S
**Priority:** P0
**Depends on:** None

**Completed:** v0.0.1.0 (2026-10-18)

### Complete verification gate (Step 16)
**What:** Run build, change route check, doc freshness, frozen candidate verification, and generate verification report

**Why:** Required gate before pushing branch and opening PR to ensure the release candidate is solid

**Context:** Version bump and CHANGELOG done. Need to verify build passes, docs are fresh, and no regressions introduced.

**Effort:** M
**Priority:** P0
**Depends on:** Ship bisectable commits for visual-redesign release

### Push branch and open PR (Steps 17-19)
**What:** Push visual-redesign branch to origin, open/update PR against main with proper description and review summary

**Why:** Complete the ship workflow and enable merge

**Context:** After verification gate passes, push the branch and create PR with review findings, gate edits, and adversarial review synthesis in the body.

**Effort:** S
**Priority:** P0
**Depends on:** Complete verification gate (Step 16)

## Review

### Run Pre-Landing Review (Step 9)
**What:** Execute the full pre-landing review pipeline including checklist, specialists, exploratory QA, and Fix-First

**Why:** Required review gate before merge — ensures code quality, security, and correctness

**Context:** No Step 9 or Step 11 review records found yet. Must complete core checklist, dispatch specialists (Testing, Maintainability, Security, Performance, Design, etc.), run exploratory QA, and apply Fix-First before proceeding.

**Effort:** L
**Priority:** P0
**Depends on:** None

### Run Adversarial Review (Step 11)
**What:** Execute Claude adversarial subagent pass and Codex outside reviews (adversarial + structured if diff ≥ 200 lines)

**Why:** Always-on adversarial review to catch security holes, race conditions, and production failure modes

**Context:** Runs after Step 9. Native Claude adversarial always runs; Codex runs if available (codex_reviews enabled, CLI installed, authenticated). Findings synthesize with Step 9 results.

**Effort:** M
**Priority:** P0
**Depends on:** Run Pre-Landing Review (Step 9)

### Bind reviews (Step 11.5)
**What:** Record review decisions and bind them to the release

**Why:** Required before release preparation — captures review outcomes for audit trail

**Context:** Blocked pending Step 9 and Step 11 review records. Will execute after both reviews complete.

**Effort:** S
**Priority:** P0
**Depends on:** Run Adversarial Review (Step 11)

## QA

### Run Exploratory QA as part of Step 9
**What:** Execute smoke probes (5 min/12 probes) and required plan checks against the visual-redesign changes

**Why:** Required QA gate within Pre-Landing Review — validates actual runtime behavior

**Context:** Part of Step 9.2.1. Must load QA methods, run smoke and plan checks, verify freshness, and return verified defects to Fix-First.

**Effort:** M
**Priority:** P0
**Depends on:** Run Pre-Landing Review (Step 9)

## Documentation

### Documentation audit (Step 14.5)
**What:** Dispatch /document-release subagent to audit docs freshness and completeness for the release

**Why:** Ensures documentation matches the shipped changes before PR creation

**Context:** Runs after TODOS.md update (Step 14) and before verification gate (Step 16). Subagent checks CHANGELOG accuracy, version references, and doc coverage.

**Effort:** M
**Priority:** P1
**Depends on:** Update TODOS.md (this step)

## Infrastructure

### Persist ship metrics (Step 20)
**What:** Record ship workflow metrics for plan-tune and DX tracking

**Why:** Enables DX measurement and workflow improvement over time

**Context:** Runs after PR is opened/updated. Captures cycle time, review findings, test results, and other metrics.

**Effort:** S
**Priority:** P2
**Depends on:** Push branch and open PR (Steps 17-19)

### Trigger plan-tune nudge (Step 21)
**What:** Emit plan-tune signal for continuous workflow improvement

**Why:** Closes the feedback loop on ship workflow effectiveness

**Context:** Final step of /ship workflow. Uses persisted metrics to suggest process improvements.

**Effort:** S
**Priority:** P3
**Depends on:** Persist ship metrics (Step 20)

## Completed

### Version bump to 0.0.1.0 (Step 12)
**What:** Selected collision-free version 0.0.1 using gstack-next-version and synchronized package.json and package-lock.json via gstack-version-bump write

**Why:** Establish release version for the visual-redesign branch

**Context:** Created .gstack/version-path pointing to package.json as version source. Bumped from 0.0.0 to 0.0.1 (3-digit npm translation of 0.0.1.0).

**Effort:** S
**Priority:** P0
**Depends on:** None

**Completed:** v0.0.1.0 (2026-10-18)

### CHANGELOG.md creation (Step 13)
**What:** Authored comprehensive CHANGELOG entry for [0.0.1.0] - 2026-10-18 with Added, Changed, Fixed sections

**Why:** Document user-visible changes for the release per ship workflow and CHANGELOG style guide

**Context:** Entry includes AfriTrade brand identity, design system docs, visual QA, asset optimization, DX improvements, error contract, developer docs, and fixes for Vite port conflict, secrets findings, and missing translations.

**Effort:** S
**Priority:** P0
**Depends on:** Version bump to 0.0.1.0 (Step 12)

**Completed:** v0.0.1.0 (2026-10-18)

### Pregate clearance for iOS/macOS tests
**What:** Cleared requires-remote obligation for ios.yml/build-ios lane via pregate clearance

**Why:** Unblocked test lane that was pending remote macOS execution

**Context:** Pregate run showed 16 tests passed locally with 1 requires-remote obligation. Clearance recorded at 2026-10-18T17:57:50.406Z.

**Effort:** S
**Priority:** P0
**Depends on:** None

**Completed:** v0.0.1.0 (2026-10-18)

### DX review implementation (Phase 2.5)
**What:** Completed all DX review checklist items including .env.example, quickstart, CI workflow, ESLint fix, agent-ready error contract, developer docs, upgrade guide, DX metrics, image optimization, wallet protocol investigation, and review logging

**Why:** Improve developer experience score from baseline

**Context:** Overall DX Score improved to 4.5/10. All 11 checklist items completed. Flutter parity verified with 32/32 tests passing.

**Effort:** L
**Priority:** P1
**Depends on:** None

**Completed:** v0.0.1.0 (2026-10-18)