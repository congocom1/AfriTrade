# Contribution Guide — AfriTrade

Thank you for contributing to AfriTrade. Please read this guide before opening a pull request.

## How to contribute

1. **Pick an issue** — open one if none exists for the work you want to do.
2. **Create a branch** from `main`, named `feat/<short-description>` or `fix/<short-description>`.
3. **Make a single logical change per commit.** Bisect-friendly commits are preferred: each commit should be reviewable and revertible on its own.
4. **Run the checks** — see [Verification](#verification) below.
5. **Open a pull request** against `main`. Link the issue it resolves.
6. **Address review feedback** — re-run checks after every change.

## Commit style

Use bisect commits: one logical change per commit, with a clear subject line. End commit messages with:

```
Co-Authored-By: Claude Code <noreply@anthropic.com>
```

Example:

```
feat: add CI pipeline with lint, typecheck, test, build

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

## Verification

Before pushing, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four must pass. For Flutter changes:

```bash
flutter analyze
flutter test
```

## Security

- Never commit credentials, tokens, or API keys. Store local values in `.env.local` (gitignored).
- Backend secrets live in the Base44 secret store, not in the frontend.
- The legacy `refund-payment` endpoint returns HTTP 503; do not attempt to re-enable refunds until `docs/audit/WALLET_PROTOCOL.md` gates are satisfied.

## Docs

User-facing feature changes should include a docs update in `docs/`. Developer-facing changes should update this portal or the relevant `docs/` page.

## Review

PRs are reviewed by at least one maintainer. CI must be green before merge. Branch protection requires the Web CI `frontend-checks` job to pass.
