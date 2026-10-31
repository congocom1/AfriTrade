# AfriTrade — Git and GitHub workflow

## Branch model

- `main`: integration branch; keep buildable and review before publishing. A commit on main is **not** a production deployment.
- `feat/<issue>-<topic>`: new capability.
- `fix/<issue>-<topic>`: bug fix, ideally with regression test.
- `security/<issue>-<topic>`: sensitive protection / authorization fix.
- `chore/<topic>`, `docs/<topic>`, `test/<topic>`, `ci/<topic>`: maintenance, documentation, testing and automation.
- `release/<date-or-version>`: optional short-lived validation branch only when coordination calls for it; do not accumulate indefinite release branches.

Avoid personal branches named `main`, long-running diverging development without coordination, and direct force pushes. Existing historical commits are preserved; use Conventional Commits **from this point forward** rather than attempting a destructive history rewrite.

## Safe everyday commands

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feat/123-reasonable-name
# edit, test and commit
git add <specific-files>
git diff --cached --check
git commit -m 'feat(scope): describe the change'
git push -u origin feat/123-reasonable-name
```

Open a GitHub pull request into `main`. Include the checklist from `.github/pull_request_template.md`, link the issue, and attach tests and an approved rollout note. Use `npm run verify:launch` before asking for review. Flutter changes additionally require Flutter CI.

## Merge guidelines

- Prefer **squash and merge** for a small reviewed PR; review should retain the issue and reason.
- Merge commits are acceptable for coordinated work where individual commits should remain visible.
- Do not rewrite `main` or use `git push --force` to resolve a non-fast-forward error. Fetch, inspect upstream commits, and reconcile on a temporary branch or cherry-pick only the intended work.
- Set GitHub rulesets or branch protection through **Settings → Rules → Rulesets** (or Branch protection, if available): required pull request review, required current CI checks, no force pushes, no branch deletions, and admin bypass policy. These are **recommended settings, not claimed to be enabled**.
- Do not automatically merge CI-green financial, wallet, checkout, customer data export or operations changes without domain sign-off.

## Branch inventory recorded October 22, 2026

At time of inspection, the following remote branches were already merged into `origin/main` and may be eligible for deletion after confirming no active developer depends on them:

- `fix/audit-build-config-20261015`
- `fix/production-audit-2026-10-16`
- `fix/vite-config-esm`
- `repair/afritrade-wallet-payments-2026-10-17`
- `review/stage2-architecture`
- `visual-redesign`

Two branches were **not** merged and must be reviewed before any cleanup:

- `chore/add-wrangler-deploy-script`
- `fix/base44-serverurl-vite-src`

To refresh classification without deleting anything:

```bash
git fetch --prune origin
git branch -r --merged origin/main
git branch -r --no-merged origin/main
```

**Nothing in this reorganization deleted or rebased remote branches.** The list is a snapshot and may change. Do not delete unmerged branches until you have reviewed the diff, confirmed work ownership, and secured approval.

## Commit/release traceability

- Use a clear subject (`fix(checkout): handle quote network failure`), avoid generic `final` or `External agent changes` for new commits.
- Write rollback or migration notes for schema, money and provider changes.
- Release sign-off must reference a pinned commit SHA, staged browser/API validation, verified payment/provider outcomes, an authorized approver and rollback path.
- The source of truth for launch-blocking risks is [launch readiness](../audit/LAUNCH_READINESS_2026-10-22.md).
