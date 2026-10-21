# Staging smoke repair — October 21, 2026

## Fixed

- The five public Playwright smoke tests no longer assume an HTML body and page title prove a successful deploy. Each now checks HTTP 200, React root, page shell, and a route-specific visible element. Base44's provider 503 document no longer counts as a passing storefront.
- Replaced `waitForLoadState('networkidle')` (which hangs on ongoing app polling) with document readiness and bounded element assertions.
- Refuses to run against `https://afritrade-1.base44.app` (production). Non-local staging URLs must be HTTPS.
- CI smoke step explicitly enables CI mode, retaining Chromium installation, staging variable gate, and no deployment or writes.

## Verified

- Five Chromium scenarios discoverable with `npx playwright test --list test/e2e/smoke.spec.js`.
- A smoke invocation with `BASE_URL=https://afritrade-1.base44.app` fails immediately with a safety error.
- `npm run lint`, `npm run typecheck`, `npm test` (318 passed), `npm run build`: pass.

## Remaining external gate

- The staging browser tests themselves were **not executed against a hosted staging environment**: no staging URL was available in this workspace, and no Chromium browser was installed. Set `STAGING_BASE_URL` in the GitHub repository's Actions variables to a **separate staging** domain that already serves a deployed build. Then open a pull request to trigger the `staging-smoke` job. The public production URL remains a separate 503 investigation, not a reason to silently run staging tests against production.
