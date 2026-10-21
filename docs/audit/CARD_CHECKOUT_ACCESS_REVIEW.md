# AfriTrade card checkout access remediation — 2026-10-21

## Threat

Before this patch, the publicly addressable `create-checkout` function accepted an order number from anonymous callers and could create Wix hosted sessions with platform credentials and privileged `Base44Purchase` pending rows. The amount was resolved from the Order record, but this was still a billable API and database-write abuse path.

## Remediation (source only; publish needed)

- `create-checkout` now responds with HTTP 410 and performs no reads, writes, or provider calls. **Deploy the replacement function explicitly**; editing the source or publishing just the frontend does not neutralize the old deployed version.
- Card checkout session construction now occurs inside `place-order` only after `auth.me()` verifies an account with both ID and email. The verified email replaces any caller-supplied profile email. The ordering engine independently refuses unauthenticated card operations before any order is created.
- The order total is computed on the server. Wix requests use server-side secrets; the pending purchase is linked to the verified buyer and saved with the Wix checkout session id. The `payments-webhook` signature validation and idempotency remain unchanged.
- The frontend requires sign-in to select card checkout. Cash on delivery remains guest-accessible.
- Existing IP rate limiting remains and an additional card attempt limit of six per account per hour applies. The current entity-based counters are **not atomic and may fail open if storage fails**; provider-side cost ceilings and atomic edge quotas remain a follow-up priority.

## Release checklist

1. Deploy `create-checkout` **first**, replacing its old implementation. Verify a direct anonymous POST gets **HTTP 410**, not a checkout URL. No privileged write or Wix API call should occur.
2. Deploy `place-order` and then the frontend. Verify an unauthenticated card request is rejected with **HTTP 401**, no Order or Base44Purchase created and no Wix requests made.
3. Verify an authenticated card checkout creates a Wix session with exactly the server-calculated order total and a pending purchase whose `checkoutSessionId` matches Wix's response. Verify checkout redirect and a successful payment through Wix test mode.
4. Verify the signature-verified webhook marks the correct paid Order exactly once, enforces amount and currency, and does not double-credit after retries.
5. Verify guest cash-on-delivery still works and account log-in returns buyers to their saved cart. Monitor Wix API volume, latency, error rates, and unusual pending purchase creation.
6. Ensure production Wix keys and any Base44 access tokens are rotated as needed and never appear in client bundles, logs, Git, or documentation.

**This change is not confirmed live until both backend functions and frontend are deployed and hosted tests pass.** The public site last responded HTTP 503; that must also be resolved separately.
