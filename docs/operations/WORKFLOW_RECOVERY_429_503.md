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

## Custom workflow engine queue — October 22, 2026 hardening

`base44/functions/processWorkflowQueue` belongs to the **custom** `WorkflowExecution` engine. It is not the same as Base44's nine managed `base44/workflows/*.jsonc` automations. This distinction matters when choosing which failure to resume.

The custom queue now uses `base44/shared/workflowRecovery.ts` to make eligibility explicit. Exhausted/dead-letter, not-due, invalid retry schedules and completed/waiting executions cannot be replayed. The auto-retry allowlist is deliberately **empty** until each custom workflow's external writes, email delivery and financial side effects have been proved idempotent in staging. Eligible failures are listed in `held_for_review` and require a privileged operator to reconcile. This is an intentional safety hold, not an end-to-end automated retry implementation.

An overdue `RUNNING` or `RETRYING` execution (15 minutes) is marked dead-lettered by the queue. An execution that is legitimately `WAITING` must not be mistaken for hung work. Queue failures now surface as `503` instead of silently returning empty results. The scheduled queue function currently uses `requireAdmin`, and **whether the Base44 scheduler supplies this identity has not been verified**; verify authentication and invocation rights in isolated staging before claiming unattended execution. Do not weaken authentication to make a scheduled run pass.

**Known limitations requiring engineering work before autonomous recovery:** transactional/atomic job claiming, concurrency leases, a vetted safe auto-retry allowlist, notifications and monitoring for review holds, and verified platform-level retry/dead-letter semantics. Stuck detection currently considers the execution's `started_at` rather than a heartbeat, so long legitimate work must be tested against the timeout. Admin-triggered `runWorkflow.retry` is an explicit privileged action and must only occur after ledger inspection. Retain a review trail and never retry uncertain external payments or outgoing emails without provider reconciliation.
