# AfriTrade 2 — Base44-first hosting

**Canonical web origin:** https://afritrade-2.base44.app  
**Source of truth:** https://github.com/congocom1/AfriTrade (`main`)

## What runs where

- Base44 serves the built Vite/React web app in `dist/`, backend Deno functions under `base44/functions/`, configured entities and authentication, and supported workflows and storage.
- Flutter (`lib/`, `android/`, `ios/`, `web/`, `windows/`) remains native application source; mobile delivery requires Flutter toolchains and app distribution, not a Base44 server runtime. Its clients access the protected backend APIs.
- Card processing, mobile money, international shipping and suppliers remain **external providers** accessed through server-side integrations. No real provider credentials belong in `VITE_` or client bundles.
- Heavy persistent workers or jobs exceeding Base44 limits need separately approved infrastructure; do not assume Base44 functions are unlimited workers.

## Build, development and release

Base44 config now uses `npm ci` (locked dependencies), `npm run build` (Vite), `./dist` as the output directory, and `npm run dev` only as the platform's frontend serve command. For full-stack local development use **`npx base44 dev`**, which starts the Base44 backend; running Vite alone is not a full backend.

```bash
npm ci
npm run verify:launch
BASE_URL=https://afritrade-2.base44.app npm run release:remote
```

The remote probe is read-only and checks the public HTML shell, liveness function and committed category media. A pass **does not** establish payment, auth, data stores, wallet payout, workflow recovery, or throughput readiness. Run those with controlled staging identities and sandbox accounts before a production approval.

## Deployment controls

Only the canonical AfriTrade 2 deployment is a release target. `afritrade-1.base44.app` is excluded from standard deploy/release gates. Confirm the account's actual deployment mapping and permissions inside Base44 before initiating a publish. Never deploy unreviewed money-moving changes or migrate customer data in pursuit of making a health check green.

See [staging handoff](DEPLOYMENT_PARITY_AND_STAGING_HANDOFF.md) and [launch blockers](../audit/LAUNCH_READINESS_2026-10-22.md).
