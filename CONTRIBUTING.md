# Contributing to AfriTrade

AfriTrade contains business-critical payment, wallet, privacy, supplier and shipping code. Favor small, reviewable changes with traceable proof.

## Working agreement

1. Open or link a GitHub issue with the motivation, affected workspace, risk and acceptance criteria.
2. Start from an up-to-date `main` and create a short-lived branch using `feat/`, `fix/`, `chore/`, `docs/`, `test/`, `security/` or `release/` and a descriptive kebab-case suffix.
3. Keep a single concern per pull request; never combine asset imports, infrastructure and production payment changes without a documented dependency.
4. Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(scope):`, `fix(scope):`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, or `security:`. Do not add a fictional or automatic co-author attribution. Include actual co-authors only when appropriate.
5. Use the PR template. Describe functional, responsive, accessibility, security and localization impact, include screenshots for meaningful UI changes and rollback notes for nontrivial backend changes.
6. Request code-owner or maintainer review. Keep `main` deployable and avoid history rewriting, `push --force`, unreviewed financial workflow changes, or committing real customer data.
7. Delete **your own merged feature branch** after verifying the merge; archive stale branches only with owner confirmation. Do not remove another developer's branch without consent.

## Local commands

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c fix/descriptive-issue
npm ci
npm run verify:launch
```

For the full app use `npx base44 dev` (not standalone Vite). See [README.md](README.md).

If your change affects workflows, auth, checkout, wallet, GDPR, shipping or external API calls, add dedicated regression tests for errors, missing data, retries, idempotency, tenant boundaries and failure conditions. Run Playwright only on local or dedicated staging targets, and never run destructive or financial tests on live customer accounts.

Flutter edits additionally require `flutter analyze` and `flutter test` with the project lockfile. For CSS/assets, run responsive, localization and accessibility checks.

## Pull requests and merging

- Submit PRs to `main`; require passing GitHub Actions checks and a human review before merging. The exact branch protection and required status checks must be configured by repository admins in GitHub Settings; this document does not claim they are already enabled.
- Prefer squash merge for routine features/fixes to keep history readable; use merge commits for long-lived coordinated work when justified. Never squash/delete unrelated work.
- Use revert commits for already-shared changes rather than rewriting `main`.
- Never commit `.env.local`, device authentication, API keys, private customer exports, `.base44/`, generated Playwright traces or compiled outputs.

## Ownership / emergency changes

Check [SECURITY.md](SECURITY.md) for private vulnerability reporting. For emergency hotfixes, record the incident, target commit, staged verification, authorized approval, rollback and postmortem. For launch decisions, follow [the current release gates](docs/audit/LAUNCH_READINESS_2026-10-22.md); archived “done” reports are not release authorizations.
