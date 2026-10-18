# Agent-ready-v1 Error Contract

Every error path in the AfriTrade codebase must produce an error object conforming to this contract. It is designed to be machine-readable and agent-actionable: an automated agent should be able to tell a human what went wrong, how to fix it, and whether it is safe to retry — without reading source code.

## Error shape

```json
{
  "code": "wallet.refund_disabled",
  "what": "The legacy refund-payment endpoint is guarded and returns HTTP 503 before financial operations.",
  "fix": "Do not retry refunds. File an issue under the wallet area; release is blocked until docs/audit/WALLET_PROTOCOL.md gates are satisfied.",
  "recovery": "No automatic recovery. Admin returns and dispute refunds are unavailable until duplicate recovery, order-level caps, compensating debits and seller clawback are repaired together.",
  "context": {
    "endpoint": "refund-payment",
    "httpStatus": 503,
    "releaseBlocked": true,
    "auditRef": "docs/audit/WALLET_PROTOCOL.md"
  },
  "trace": {
    "spanId": "optional-distributed-trace-id",
    "component": "base44/functions/refund-payment/entry.ts",
    "timestamp": "2026-10-18T00:00:00Z"
  },
  "redaction": {
    "fields": ["paymentToken", "cardLast4", "walletId"],
    "safeToLog": true
  },
  "channel": "api"
}
```

## Fields

| Field | Required | Meaning |
|-------|----------|---------|
| `code` | Yes | Stable machine-readable error code, `domain.subdomain.reason` (e.g. `wallet.refund_disabled`, `auth.invalid_token`). Never include PII. |
| `what` | Yes | Plain-English one-sentence explanation of what went wrong, suitable for an end user or support agent. |
| `fix` | Yes | Actionable next step for the caller — what to do, what not to do, where to file. |
| `recovery` | Yes | Whether and how the system can recover; state if no automatic recovery exists. |
| `context` | No | Structured additional data (endpoint, HTTP status, release-blocked flags, audit doc refs). No secrets. |
| `trace` | No | Distributed tracing info (span ID, component, timestamp) for correlating logs. |
| `redaction` | No | Which fields were redacted and whether the object is safe to log. |
| `channel` | Yes | Delivery channel: `api`, `cli`, `ui`, `webhook`, `background`. |

## Required error paths

Each documented error path must list its `code`, `what`, `fix`, `recovery`, `context`, `trace`, `redaction`, and `channel`.

### 1. wallet.refund_disabled (legacy refund-payment endpoint)

- **code:** `wallet.refund_disabled`
- **httpStatus:** 503
- **what:** The legacy refund-payment endpoint now fails closed with HTTP 503 before any financial operation.
- **fix:** Do not retry refunds through this endpoint. Admin returns and dispute refunds are unavailable. File a wallet-area issue.
- **recovery:** None automatic. Requires duplicate recovery, order-level caps, compensating debits, and seller clawback repaired together.
- **context:** `docs/audit/WALLET_PROTOCOL.md` lists the release gates (hosted CAS validation, atomic conditional writes, simultaneous debit/credit tests).
- **releaseBlocked:** true
- **channel:** `api`

### 2. auth.invalid_token

- **code:** `auth.invalid_token`
- **httpStatus:** 401
- **what:** The supplied authentication token is missing, expired, or malformed.
- **fix:** Re-authenticate and retry with a fresh token. Do not retry the same failed request.
- **recovery:** Client must obtain a new token; server does not retry on its own behalf.
- **context:** none
- **channel:** `api`

### 3. wallet.idempotency_conflict

- **code:** `wallet.idempotency_conflict`
- **httpStatus:** 409
- **what:** A wallet operation with the same idempotency key but a different payload was already processed.
- **fix:** Use the original payload with the same key, or use a new key for a new operation. Do not alter the payload and retry.
- **recovery:** Fail closed — no financial movement occurs.
- **context:** `idempotencyKey`, `walletId`
- **channel:** `api`

### 4. build.chunk_oversized

- **code:** `build.chunk_oversized`
- **what:** A Vite build chunk exceeds 500kB, which may slow loading on mobile/3G.
- **fix:** Add the module to `manualChunks` in `vite.config.js` or lazy-load the route.
- **recovery:** Build still succeeds; this is a warning, not a failure.
- **context:** `chunkName`, `chunkSizeKB`, `limitKB: 500`
- **channel:** `build`

### 5. ci.secret_missing

- **code:** `ci.secret_missing`
- **what:** A required CI secret or repository variable is not configured.
- **fix:** Add the variable to GitHub repository secrets/variables. Do not hardcode values in `.github/workflows/`.
- **recovery:** CI job fails closed; no deployment occurs.
- **context:** `variableName`, `workflow`
- **channel:** `ci`

## Redaction rules

Never log or return: private API keys, signing keys, payment tokens, full card numbers, wallet IDs that link to individuals, or access tokens. Mark `redaction.safeToLog: true` only after confirming none of the above appear in `what`, `fix`, `context`, or `trace`.

## Version

Contract version: **agent-ready-v1**. Changes to this contract require a docs PR and review.
