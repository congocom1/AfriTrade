# Quickstart — AfriTrade frontend

**Target time-to-hello-world (TTHW): < 5 minutes**

This is a copy-paste quickstart for the AfriTrade React/Vite frontend. It assumes you have Node.js and npm installed and access to a Base44 application.

## 1. Clone and link (1 min)

```bash
git clone https://github.com/<org>/congo-commerce.git
cd congo-commerce
git checkout visual-redesign
npm ci
base44 login
base44 link
```

## 2. Local environment (1 min)

Copy the example env file and fill in public values only. Never commit secrets.

```bash
cp .env.example .env.local
# edit .env.local if your Base44 app id or base URL differs
```

## 3. Start the dev server (1 min)

```bash
# Starts BOTH the Vite frontend and the Base44 backend
base44 dev
```

Open `http://localhost:5174` (Vite dev server on port 5174). If you only need the frontend against the hosted backend:

```bash
npm run dev
```

## 4. Verify (1 min)

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four should exit cleanly. The build outputs to `dist/`.

## 5. Flutter mobile (optional, +5 min)

Requires the Flutter SDK at `/home/hermes/flutter/`:

```bash
flutter analyze
flutter test
```

## What you should see

The AfriTrade marketplace landing page with seller dashboard routes at `/seller` and `/seller/products`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "backend is not responding" | Use `base44 dev`, not `npm run dev` — the Base44 backend must be running. |
| ESLint React version warning | Already fixed in `eslint.config.js` (`settings.react.version = "detect"`). |
| Build chunk > 500kB warnings | Expected; see `docs/audit/PRODUCTION_HARDENING.md` and `vite.config.js` `manualChunks`. |
| `refund-payment` returns 503 | Expected; the legacy refund endpoint is guarded until `docs/audit/WALLET_PROTOCOL.md` gates are satisfied. |

**TTHW target: < 5 minutes.** If any step takes longer, file a DX issue.
