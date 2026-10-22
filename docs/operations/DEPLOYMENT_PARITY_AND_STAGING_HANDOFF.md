# AfriTrade deployment parity and authenticated staging handoff

**Observed October 22, 2026** (read-only inspection)

| Endpoint | afritrade-2.base44.app | afritrade-1.base44.app |
| --- | --- | --- |
| HTML shell `/` | HTTP 200 | HTTP 200 |
| Liveness `/functions/health` | HTTP 200 | HTTP 200 |
| `/assets/marketplace/categories/electronics.svg` | HTTP 200 | HTTP 404 |
| `/assets/marketplace/categories/home-appliances.svg` | HTTP 200 | HTTP 404 |

The currently connected Base44 account exposes a single AfriTrade app ID `6ad35f967cfc0088309e830b`. **Neither published URL has been conclusively mapped to a deployable application/revision.** Do not overwrite `afritrade-1` merely because `afritrade-2` contains additional assets. Confirm the owner, environment, data separation, and approved revision through the Base44 application dashboard first.

## Safe read-only validation

```bash
npm run verify:launch
BASE_URL=https://afritrade-2.base44.app \
SECONDARY_BASE_URL=https://afritrade-1.base44.app \
npm run release:remote

BASE_URL=https://afritrade-2.base44.app npx playwright test \
  test/e2e/smoke.spec.js test/e2e/route-guards.spec.js \
  test/e2e/public-responsive.spec.js test/e2e/deployment-parity.spec.js \
  --project=chromium
```

A nonzero exit code blocks parity. The endpoint probe does not write production data or establish backend payment readiness.

## Required staging identities / approval

1. Obtain *isolated staging* test identities for buyer, seller, supplier, courier, employee and administrator with synthetic catalog/order fixtures. Never copy production cookies/tokens into CI.
2. Verify positive authorization and cross-tenant denials for every workspace, including API access and ownership changes. Existing browser route tests cover anonymous redirects only.
3. With the payment provider's authorized sandbox, test a signed-in checkout, order amount reconciliation, webhook signature verification and replay, cancellation/refund disablement, wallet and payout ledger invariants. Do not use real money or live provider endpoints.
4. Exercise 429/503 injection for GDPR report, unpaid reminder, shipment updates, dunning and `processWorkflowQueue`. Confirm timeouts, safe retry review holds, operator alerting, and lack of duplicate emails/payments.
5. Confirm atomic/edge rate-limit enforcement under staging concurrency (current database counter is not proven atomic), then run Flutter CI and sign off on the release candidate.
6. Only after this sign-off, use the authorized Base44 deployment control to publish the **pinned and approved** revision, re-check both URLs, and document rollback.

**Status:** Public AfriTrade-2 browser checks pass; cross-site parity, authenticated end-to-end financial tests, controlled workflow recovery and deployment authorization are not yet proven. Do not mark full launch ready.
