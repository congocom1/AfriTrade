# Wallet protocol — deployment and recovery gates

## Implemented locally

The ledger now uses a conditional Wallet update to persist the rounded balance,
pending amount, lifetime totals, revision and operation receipt together. It
creates a `preparing` WalletTransaction first; only the candidate ID stored in
the winning receipt can be finalized. Losing candidates remain nonfinancial
preparing records and all current ledger list/report queries exclude them.

Retries with the same wallet-scoped key and financial payload repair the same
projection without another balance movement. Changed payloads fail with
idempotency_conflict. Unknown write responses throw, rather than trigger unsafe
compensation. Pending releases also use receipts. Rejection of an admin payout
now invokes an authenticated server function, with a durable approve/reject
decision before any refund.

The two former TODO tests are ordinary mandatory tests. Tests model atomic
conditional writes; they do not prove hosted database semantics.

## Required rollout order

1. Stop old wallet writers during migration; do not mix old and new functions.
2. Push Wallet and WalletTransaction schema changes to an approved staging app.
3. Verify that updateMany evaluates the predicate and writes atomically on a
   single wallet, including missing ledger_revision fields on legacy wallets.
   Installed SDK types document the operators and `updated` count; this is not
   sufficient evidence of the hosted concurrency guarantee.
4. Deploy the ledger callers and settle-wallet-payout function together, then
   the frontend. The frontend must not ship ahead of the new payout function.
5. Run simultaneous exact-balance debits, identical credits, competing payout
   decisions and interrupted projection tests on disposable staging wallets.
6. Record results and reconcile balances against receipts and finalized rows.
   No production deployment has been performed by this change.

## Recovery and limits

- Retry the original operation with the same key and payload. Do not manually
  apply a credit/debit because an HTTP response timed out.
- Receipts are wallet-scoped. Keys are not a global cross-wallet constraint.
- There is a hard limit of 1,000 receipts per wallet, including releases. New
  operations fail closed at capacity; old-key retries still work. Add a durable
  archival/index strategy before high-volume rollout. Never prune receipts to
  bypass the limit. The platform wallet may reach this limit quickly.
- Preparing rows may be orphaned. No automatic cleanup is implemented: a row
  cannot safely be deleted merely because it is old or not yet finalized.
- Lifetime credits/debits are gross movement totals. Payout rejection is a new
  refund credit, not a rewrite of historical lifetime debit totals.
- Payout audit retries may produce repeated audit events, but not repeated money
  movements; the transaction ID identifies the decision.

## Remaining risks — not closed by ledger tests

- Full checkout/refund workflows span orders, payouts and notifications. They
  are not multi-entity transactions. Order-level refund caps and payout-vs-refund
  coordination require separate durable orchestration.
- The legacy refund endpoint now fails closed with HTTP 503 (`refunds_disabled`)
  after authorization and before financial operations. Despite its deprecated
  label, admin returns and dispute resolution still call it; these refund actions
  are therefore unavailable. Do not remove the guard until duplicate recovery,
  order-level caps, compensating debits and seller clawback are repaired together.
- Payout tests now exercise the actual ledger and authorization helper against
  an atomic in-memory storage model, including concurrent identical rejections,
  audit/finalization/projection failures and ambiguous claim/wallet writes.
  Rate limiting and storage remain mocked; this is not hosted validation.
- A business retry that creates a new order ID or changes its operation key is
  a new movement. Endpoint-level idempotency is still required.
- Legacy withdrawal keys derive from amount/method/account and may suppress a
  later legitimate identical withdrawal. This deprecated endpoint needs an
  explicit request ID contract before reactivation.
- Admin RLS privileges still permit direct entity edits; privileged out-of-band
  writes can bypass the protocol. Restrict operational access and audit it.
- Production header controls, staging origin, hosted CI and tenant-role security
  verification remain separate release gates.