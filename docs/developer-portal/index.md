# AfriTrade Developer Docs Portal

AfriTrade is a pan-African B2B & B2C marketplace — Shopify × Alibaba for Africa — with a React/Vite frontend and a separate Flutter mobile project.

## What's here

| Audience | Document | Purpose |
|----------|----------|---------|
| New developers | [Quickstart](quickstart.md) | Get running in < 5 minutes (TTHW target) |
| All contributors | [Contribution guide](CONTRIBUTING.md) | How to propose, review, and merge changes |
| Operators | [Upgrade & migration guide](UPGRADE_MIGRATION.md) | Dependency and asset migration procedures |
| Error handling | [Agent-ready-v1 error contract](errors/AGENT_READY_V1_ERROR_CONTRACT.md) | Standard error shape every error path must follow |
| DX metrics | [DX metrics](dx/DX_METRICS.md) | TTHW, error rates, DX scorecard history |

## Repository layout

```
src/            React/Vite frontend application
src/api/        Base44 SDK client
base44/         Base44 configuration and backend assets
test/           JavaScript unit + Playwright E2E tests
android/, ios/, lib/, windows/   Flutter mobile project
docs/           Documentation (this portal)
scripts/        Build and maintenance scripts
public/images/  Product images (PNG sources + WebP variants under webp/)
```

## Commands

| Command | Purpose |
|---------|---------|
| `base44 dev` | Start Vite + Base44 backend (recommended local dev) |
| `npm run dev` | Vite frontend only (hosted backend) |
| `npm run lint` | ESLint |
| `npm run typecheck` | tsc static checking |
| `npm test` | Node unit tests |
| `npm run build` | Vite production build |
| `npm run test:e2e` | Playwright E2E tests |
| `flutter analyze` | Flutter static analysis |
| `flutter test` | Flutter tests |
| `node scripts/optimize-images.js` | Convert PNGs to responsive WebP variants |

## Release gates

- Wallet release is **blocked**: the legacy `refund-payment` endpoint returns HTTP 503 until the gates in `docs/audit/WALLET_PROTOCOL.md` are satisfied.
- Web CI runs lint, typecheck, unit tests and build on push/PR to `main` without deploying.
- Optional staging smoke job requires the `STAGING_BASE_URL` repository variable.

## Asking for help

Open an issue for bugs, DX friction, or unclear documentation. Tag the area (`ci`, `docs`, `flutter`, `security`, `wallet`) so the right reviewer sees it.
