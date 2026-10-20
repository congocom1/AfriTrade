# Portal frontend/backend readiness

This is a code and contract review, not a completed visual or production audit.

| Surface | Changes |
| --- | --- |
| Admin dashboard | Strict reads, retry state, numeric totals, correct dispute link |
| Command center | Managed refresh, error recovery, localized refresh time |
| Backoffice | Validate the overview response before rendering |
| Seller dashboard | Account-scoped loading, explicit failures, accessible loading state |
| Seller portal | Wallet lookup by seller ID, scoped queries, retry behavior |
| Creator dashboard | Real retry, selected creator's data, publish error state |
| Courier console | Fleet-scoped requests, request failures, numeric wallet values, one page title |
| Supplier portal | Correct healthy counter, pending mutations, errors instead of infinite loading |
| Logistics hub | Strict grouped reads, mutation errors, shared loading/retry state |
| Finance portal | Failed requests no longer become empty finance totals |
| Tenant console | Separate access/data queries, tenant and permission cache keys, visible save failures |
| Developer portal | Correct SDK response handling and backend action contract; labeled key controls; pending/error states |
| Warehouse | Keyboard-accessible tabs and loading/error handling in its queues |
| China warehouse | Correct function response parsing, selected inventory query, stock validation and mutation recovery |

Shared infrastructure:

- Queries separate account, role, tenant and selected workspace keys.
- Required failed reads surface errors rather than successful empty/zero summaries.
- Loading and retry messages have English/French translations and screen-reader roles.
- Empty role navigation is omitted; dashboard spacing and KPI wrapping are shared.
- A routed rendering error can recover within the page while retaining application navigation.
- Inspection lists now use receipt records/IDs, matching the inspection backend.

Backend changes:

- `manage-api-keys` supports SDK `list`, `create` and `revoke` actions under its existing admin/rate-limit checks. REST routes remain available.
- API-key listing/revocation failures return errors instead of successful empty data or false revocation success.
- Invalid key expiration dates return 400.
- Warehouse stock additions reject nonpositive/fractional quantities and invalid/negative costs before persistence.

Verification:

- Lint, frontend type checking and production build passed.
- Full suite: 236 tests passed, including API-key authorization, SDK/REST contracts, secret handling, persistence failures and warehouse validation.
- Translation and contract tests passed again after the last edits.
- Vite continues to report large bundle chunks.

Pending verification and material limits:

- Backend changes are committed source changes; they have not been deployed or exercised against hosted Base44.
- No browser tool is available. Desktop/mobile screenshots, keyboard flows, dialogs, dark mode and live console errors remain unverified.
- Backend tests use dependency stubs; hosted credentials, RLS, rate-limit infrastructure and schema compatibility still need staging checks.
- Existing dashboard reads use capped recent lists. They are not full-history financial aggregation endpoints.
- Existing multi-step inventory writes still need staging failure/concurrency checks. This change does not provide cross-entity transactions.
- The repository's existing wallet/refund release block remains applicable.

Visual QA final result: blocked.
