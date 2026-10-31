# AfriTrade deployment parity and authenticated staging handoff

**Canonical repository/deployment clarification (confirmed by project owner):** `https://afritrade-2.base44.app` is the AfriTrade deployment associated with the canonical GitHub repository `congocom1/AfriTrade`. `afritrade-1.base44.app` is not a required release target.

**Observed October 22, 2026** (read-only inspection)

| Endpoint | afritrade-2.base44.app | afritrade-1.base44.app |
| --- | --- | --- |
| HTML shell `/` | HTTP 200 | HTTP 200 |
| Liveness `/functions/health` | HTTP 200 | HTTP 200 |
| `/assets/marketplace/categories/electronics.svg` | HTTP 200 | HTTP 404 |
| `/assets/marketplace/categories/home-appliances.svg` | HTTP 200 | HTTP 404 |

The connected Base44 account exposes app ID `6ad35f967cfc0088309e830b`. The project owner has identified **AfriTrade 2** as the canonical deployment linked to GitHub. Keep AfriTrade 1 outside the release gate; do not alter it or assume that both domains should be synchronized. The repository remote is `https://github.com/congocom1/AfriTrade.git`.

## Safe read-only validation

```bash
npm run verify:launch
BASE_URL=https://afritrade-2.base44.app npm run release:remote

BASE_URL=https://afritrade-2.base44.app npx playwright test \
  test/e2e/smoke.spec.js test/e2e/route-guards.spec.js \
  test/e2e/public-responsive.spec.js test/e2e/deployment-parity.spec.js \
  --project=chromium
```

A nonzero exit code blocks release validation of AfriTrade 2. The endpoint probe does not write production data or establish backend payment readiness.

## Required staging identities / approval

1. Obtain *isolated staging* test identities for buyer, seller, supplier, courier, employee and administrator with synthetic catalog/order fixtures. Never copy production cookies/tokens into CI.
2. Verify positive authorization and cross-tenant denials for every workspace, including API access and ownership changes. Existing browser route tests cover anonymous redirects only.
3. With the payment provider's authorized sandbox, test a signed-in checkout, order amount reconciliation, webhook signature verification and replay, cancellation/refund disablement, wallet and payout ledger invariants. Do not use real money or live provider endpoints.
4. Exercise 429/503 injection for GDPR report, unpaid reminder, shipment updates, dunning and `processWorkflowQueue`. Confirm timeouts, safe retry review holds, operator alerting, and lack of duplicate emails/payments.
5. Confirm atomic/edge rate-limit enforcement under staging concurrency (current database counter is not proven atomic), then run Flutter CI and sign off on the release candidate.
6. Only after this sign-off, use the authorized Base44 deployment control to publish the **pinned and approved** revision to AfriTrade 2, re-check that URL, and document rollback.

**Status:** Public AfriTrade-2 browser checks pass; authenticated end-to-end financial tests, controlled workflow recovery and deployment authorization are not yet proven. Do not mark full launch ready.
