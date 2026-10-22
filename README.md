# AfriTrade

**Commerce, supplier operations and logistics for the Democratic Republic of the Congo.**

**Canonical deployment:** https://afritrade-2.base44.app · **GitHub:** https://github.com/congocom1/AfriTrade

AfriTrade is a multi-workspace marketplace and logistics application. This monorepo contains a React/Vite web app, Base44 backend functions and schemas, and a Flutter mobile application. It is an actively developed product; a passing build is **not** evidence that every payment, shipping, or compliance flow is ready for production.

## Project layout

| Directory | Responsibility |
| --- | --- |
| `src/` | React web application, customer and operator workspaces, design system |
| `base44/` | Backend functions, entities, workflows, agents, permissions and configuration |
| `lib/`, `android/`, `ios/`, `web/`, `windows/` | Flutter application and platform projects |
| `test/` | Node regression tests, Playwright E2E and security coverage |
| `public/`, `assets/` | Web and Flutter media; tracked source assets only |
| `scripts/` | Maintenance, security and release verification utilities |
| `docs/` | Architecture, developer guides, audits, design and operational runbooks |
| `.github/` | GitHub Actions, issue templates, PR review checklist and code ownership |

Read [the documentation index](docs/README.md) to find more detailed material.

## Quick start — web and backend

**Prerequisites:** Node.js 22 or 24, npm and authenticated Base44 CLI access to the AfriTrade application.

```bash
npm ci
npx base44 login
npx base44 link
npx base44 dev
```

`base44 dev` is the supported local full-stack workflow. `npm run dev` runs Vite only and **does not** start the Base44 backend. Keep secrets in local untracked environment files or the Base44 secret store; `.env.example` is a placeholder template only.

## Quality gates

```bash
npm run verify:launch  # lint, types, assets, dependency policy, unit tests, build
```

For browser tests, first install the browsers and use an isolated local or staging environment:

```bash
npx playwright install --with-deps chromium webkit
BASE_URL=https://YOUR-STAGING-URL npx playwright test \
  test/e2e/smoke.spec.js test/e2e/route-guards.spec.js \
  test/e2e/public-responsive.spec.js --project=chromium
```

For Flutter, use its separately installed SDK and run `flutter pub get --enforce-lockfile`, `flutter analyze` and `flutter test`. The GitHub workflows also run Flutter checks. See [CI details](docs/guides/CONTRIBUTING.md).

## Deployment and release status

Deployment is a separate, approval-gated operation. Do **not** merge a green build directly into a commercial launch: provider payments, refunds, payouts, webhook signatures, authenticated roles and operational workflows require staged verification. The wallet/refund release remains restricted under the [wallet protocol](docs/audit/WALLET_PROTOCOL.md).

**Current source of truth:** [Launch readiness and outstanding blockers (October 22, 2026)](docs/audit/LAUNCH_READINESS_2026-10-22.md). Older claims that a release was “100% complete” have been archived as historical reports, not treated as approvals.

Read-only release probe after publishing an approved staging revision:

```bash
BASE_URL=https://YOUR-STAGING-URL npm run release:remote
```

See the [workflow recovery runbook](docs/operations/WORKFLOW_RECOVERY_429_503.md) and [security reporting policy](SECURITY.md) before operational changes.

## Contributing

All changes should be developed on a short-lived `feat/`, `fix/`, `chore/`, `docs/` or `test/` branch and proposed to `main` in a pull request. Keep commits focused, use the PR template, and record verification results. **Never force-push or rewrite shared history.**

Start with [CONTRIBUTING.md](CONTRIBUTING.md) for repository practices and use the Base44 CLI documentation for backend development. See [CHANGELOG.md](CHANGELOG.md) for curated changes.
