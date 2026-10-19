# Full-stack repair — 2026-10-18

## Confirmed and repaired

- Mobile `/api/products` returned HTML from SPA hosting. Mobile now addresses the
  app-scoped `rest` function with `path`, and the `auth` function with `action`.
- Product repository now decodes named JSON envelopes for catalog, detail,
  categories, reviews and related products.
- Public REST catalog uses SDK `filter()` with published status. Detail/related/
  review routes reject unpublished products; wholesale and reviews are filtered.
  Database failures no longer trigger an unfiltered catalog fallback.
- Auth upstream URLs include `/api`, password confirmation accepts the mobile
  field, profile calls carry the stored bearer token, and API retries are bounded.
- Warehouse test fixtures use string IDs. Conversion validates all lines before
  inventory writes, rejecting invalid quantities/prices, missing products,
  duplicate lines and tenant mismatches.
- Nullable mobile search filters can be cleared without erasing other filters.
- Web CI uses supported Node versions and an explicitly configured staging URL.
  Local Playwright uses Base44 development; remote tests do not start a local server.
- React owns hydrated page titles instead of retaining hosting's old brand titles.

## Verification

Node suite, lint and frontend typecheck pass. Flutter analysis and 36 tests pass.
Base44 build succeeds. Hosted catalog function returns HTTP 200 JSON; an anonymous
profile request returns HTTP 401 JSON. Real-account login/checkout were not exercised.
The earlier iOS commit f1e837e passed both simulator and unsigned device builds in
GitHub Actions run 39186494547; that result does not validate later Dart changes.

## Remaining release limits

This is not blanket full-stack or financial release certification. Wallet/refund
release gates in README and WALLET_PROTOCOL remain open. Warehouse writes are still
multiple operations without a transaction: concurrent conversions or partial write
failures need a durable idempotency/CAS design before claiming exactly-once behavior.
No production inventory conversion was performed during testing. Apple signing,
physical-device testing and TestFlight upload remain separate release steps.
Hosting's server-rendered SEO metadata may retain the old name until platform
metadata is updated; the React fix controls browser titles after hydration.
