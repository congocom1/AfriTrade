# Recovery policy: rate-limit and unavailable workflow steps

This is a **manual production recovery protocol**, not proof that Base44's managed workflow runtime provides automatic retries. No operator should replay a step without checking its ledger. Do not add unsupported DSL retry fields to `base44/workflows/*.jsonc` without platform-side validation.

## Coverage

- `Data Request Lifecycle`: `emailDataReport` (contains private order data) and verification/compliance emails.
- `Unpaid Fulfillment Followup`: `sendUnpaidReminder`, `sendUnpaidDiscountEmail`, and payment status checks.
- Authenticated rate limits use `ApiRateLimit`, `failClosed: true` for these sensitive handlers. Anonymous requests are rejected before a slot is counted.

## Failure response and operator action

| Response | Interpretation | Recovery |
|---|---|---|
| `429` | Request did not pass the function's rate limit | Wait for `Retry-After` (currently conservative 3600 seconds); verify workflow state, then resume once. If email provider explicitly rejects with 429, a retry is permitted only when the ledger is marked `failed`. |
| `503` from rate limiter | Counter store unavailable; work not authorized | Recover storage and wait at least 120 seconds, then retry after confirming state; do not bypass rate limit. |
| `503` from mail provider or timeout | Delivery might have been accepted | Treat `delivery_unknown` or `sending` ledger state as **manual reconciliation required**. Check provider delivery logs and customer status. Never auto-replay these sends. |
| `409` | In-flight/unknown delivery | Do not replay until human reconciliation and a safe state transition. |
| Non-retryable 4xx | Bad request/authorization/rejected operation | Fix the triggering condition; do not retry automatically. |

## Dedupe / reconciliation

1. For GDPR report: inspect `DataRequest.report_sent_at`, `email_status`, `email_error` and audit actions `privacy.report_sent`, `privacy.report_failed`. `completed` / timestamp means **no resend**; `sending` / `delivery_unknown` means manually verify against provider logs. A stale `sending` marker cannot by itself prove an email was sent.
2. For unpaid 1h reminder: recheck order payment state. Check `Notification` with exact `{title, order_number}`. **Never** create another notification if the same one exists; database lookup errors must block sending instead of being treated as an empty result.
3. For unpaid 24h discount: check `OrderNotification` by `{order_number, event:'payment_discount'}`. `sent` means no resend; `queued`, `sending`, `delivery_unknown` require reconciliation; `failed` after explicit rejection is eligible for retry, after rechecking order payment. Coupon code is deterministic; don't issue a second coupon.
4. Review the managed workflow execution (or operator dashboard) and record incident ID, step, HTTP code, elapsed time, replay decision and outcome. Escalate persistent failures and GDPR deadlines to compliance personnel.
5. Limit any operator-triggered recovery to **at most 3 total attempts** with increasing delays (2 minutes, 10 minutes, 1 hour) *when the operation is known not to have taken effect*. After that, escalate instead of silently dropping.

## Staging acceptance required before production claim

- Configure a dedicated STAGING_BASE_URL GitHub variable (not production) and run PR CI smoke + route guards.
- Use staging administrator credentials and synthetic DataRequest/FulfillmentOrder fixtures, never real customer information.
- Verify auth `401/403` without counter consumption; verify `429` after configured threshold; verify `503` when counter storage is deliberately unavailable; assert no email/notification side effects.
- Concurrently test the rate-limit counter on staging and inspect duplicates/lost updates. The current `ApiRateLimit.filter` followed by `update/create` is **read-modify-write and not a proven atomic counter**. A load test has not been performed, so production concurrency enforcement is unverified. Replace it with a provider-supported atomic counter or unique-key compare-and-swap before claiming reliable concurrency limits.
- Confirm a managed workflow failed-step can be resumed, and document actual Base44 retry/dead-letter support; this repository cannot certify managed workflow execution semantics by unit testing JSON definitions alone.

**Release gate:** no automatic replay of possibly accepted outgoing messages. No live load test without coordinated authorization and a staging test plan. Production behavior remains unverified until staging exercise and explicit operational signoff.
