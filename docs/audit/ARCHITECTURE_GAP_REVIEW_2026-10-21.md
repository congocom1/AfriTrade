# AfriTrade architecture and missing component review — 2026-10-21

## Confirmed architecture
React/Vite SPA, Base44 server functions and entities, shared portal components, multi-tenant access model, Flutter companion application. Follow `Stage2_Architecture_Plan.md`, `docs/audit/WALLET_PROTOCOL.md`, and `docs/PORTAL_READINESS.md` before changing the implementation. Do not mix the archived Base44 singleton wallet implementation into the active receipt-based wallet protocol.

## Confirmed local checks
- Full lint, TS/JS typecheck, and production build: passed.
- Automated Node suite: 258/258 passed.
- Shared component import-resolution and portal gap review were recorded in `docs/PORTAL_READINESS.md`; this does not establish end-to-end completeness.
- Playwright E2E remains unverified: Base44 CLI sandbox device login timed out on earlier runs; no fresh authenticated browser results are claimed here.

## Completed now
- `src/lib/suppliers.js`: configured-but-unimplemented supplier adapters no longer silently fabricate production supplier products, pricing, inventory, order confirmations or tracking. They fail explicitly until real server-side providers exist. Explicit mock adapters remain available for demonstrations.

## Work that requires platform/business owner action
- Supplier API contracts, provider approval, production integration credentials and server-side secrets. Do not put API keys in VITE_ environment variables: these are bundled into the browser.
- Financial release gate: hosted RLS, ledger atomicity, payment webhook signature and replay, payouts and reconciliation tests, per `docs/audit/WALLET_PROTOCOL.md`.
- Production host confirmation and setup of response CSP, HSTS, and security headers.
- Registered business/legal identity, privacy terms, tax identifiers, production domain, merchant/payment accounts and settlement rules.
- Staging environment auth and valid test accounts by role to complete browser E2E and hosted permissions checks.
- Flutter/web compatibility and real device verification.

## Engineering backlog (not certified complete)
- Replace supplier stubs with provider-specific authenticated Base44 functions, then contract tests and sandbox/live certification.
- Runtime/visual/accessibility QA on each admin, seller, buyer, supplier, warehouse, logistics, courier and tenant portal.
- Bundle splitting/performance work for oversized index, PDF and three.js bundles.
- Hosted integration verification and branch protection/CI verification.

## Release decision
Local tests passing is not production acceptance. Do not publish or enable live payments until required external gates and hosted tests pass.
