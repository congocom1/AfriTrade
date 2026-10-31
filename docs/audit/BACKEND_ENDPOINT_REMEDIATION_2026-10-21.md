# AfriTrade backend entry-point remediation — 2026-10-21

Source review covered 50 Base44 function entry points at the start of this change.
This checkpoint contains code changes only. No live deployment or backend migration is implied.

## Repairs

- `sendDataRequestVerification`: requires an authenticated admin before fetching or updating private DataRequest rows. Unauthorized requests no longer mark a request's email state as skipped. Only POST supported.
- `processWorkflowQueue`: unauthorized requests return 401/403 without privileged audit writes or triggering any workflows.
- `rest`: public supplier listing no longer returns internal supplier code, integration adapter, or pricing markup. Public suppliers remain discoverable.
- `confirm-payment`: manual administrator confirmation is limited to active cash-on-delivery orders; card and other provider payments must be confirmed via their validated provider channel. Rejected transactions cause no fulfillment updates.
- `shippingLabel`: validates status enum and lifecycle transitions, disallows reopening terminal labels, makes repeat prints idempotent, and preflights bulk updates to prevent partial updates for an invalid batch.
- `verifyDataRequest`: GET-only; bounds token length; applies a **real database-backed** quota before a private verification token lookup, including invalid tokens; makes verification responses uncached with no-referrer policy.
- `securityHeaders.checkRateLimit`: supports opt-in `failClosed` for sensitive paths; rate-store errors now return 503 instead of silently granting protected work. Enabled on `place-order`, authenticated card quota, `commerceAi`, `request-withdrawal`, mobile auth proxy, public catalog REST, and data request verification. Legacy endpoints keep availability-first behavior pending hosted verification.
- New runtime regression tests for unauthorized writes, manual card payment confirmation, shipping-label transitions and batch printing, public supplier data, rate-store failures, and verification-token throttling.

## Release gates and remaining risk

- Base44's actual functions must be deployed separately from frontend assets. Update `sendDataRequestVerification`, `processWorkflowQueue`, `rest`, `confirm-payment`, `shippingLabel`, `verifyDataRequest`, `place-order`, `commerceAi`, `request-withdrawal`, and `auth` together with `shared/securityHeaders.ts` so live server code is consistent. Confirm the legacy `create-checkout` endpoint is disabled (HTTP 410) **first**.
- **Do not deploy before staging checks.** Authentication, catalog reads, guest COD, admin-only workflows, email verification, and stock/checkout flows may return 503 if the ApiRateLimit entity is unavailable under their protected service role. This denial is intentional: capacity to read/write the counters must be established at the host.
- Rate counters are NOT atomic and may overshoot under concurrent requests. Client identity still depends on a trusted proxy-provided `cf-connecting-ip` header and falls back to a shared unidentified bucket. An atomic rate limiter at a trusted edge or a database uniqueness/compare-and-set strategy remains necessary.
- Wallet concurrency, card checkout and Wix webhook replay, manual payments, settlement and stock reservation still need deployed payment-provider tests. Avoid assuming pure unit tests guarantee exactly-once writes across functions.
- The mobile auth bridge still mirrors access tokens into the `refresh_token` field; replacing it requires a compatible mobile-client authentication flow and revoked-token validation.
- The server-side scheduled workflow queue currently requires admin auth. Verify scheduled jobs actually run under that identity rather than weakening public authorization.
- Access tokens previously copied into chat or terminal logs should be rotated in Base44 by the credential owner.
- Live website previously returned HTTP 503, unrelated to static security lint/test results.
