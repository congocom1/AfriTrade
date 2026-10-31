# AfriTrade configuration and secrets inventory

**Status:** IN PROGRESS - Initial inventory created, needs completion  
**Archive:** Legacy Congo Commerce references removed from secret documentation

Repository-derived inventory, 2026-10-17. No secret values are recorded here.
Presence in code does not establish that a credential is configured or valid.

| Name | Classification | Consumer | Storage / status | Owner | Last Rotation | Next Review | Provider Key ID |
|---|---|---|---|---|---|---|---|
| WIX_CHECKOUT_API_KEY | Secret | create-checkout backend | Backend secret store; owner and rotation date unverified | TBD | TBD | TBD | TBD |
| WIX_CHECKOUT_SITE_ID | Configuration identifier | create-checkout backend | Backend configuration; value unverified | TBD | TBD | TBD | TBD |
| WIX_CHECKOUT_APP_URL | Public return-origin configuration | create-checkout backend | Backend configuration; approved origin unverified | TBD | TBD | TBD | TBD |
| WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY | Public verification key, integrity-sensitive | payments-webhook backend | Backend configuration; provider provenance and rotation unverified | TBD | TBD | TBD | TBD |
| VITE_BASE44_APP_ID | Public build configuration | src/lib/app-params.js | Build environment; verify staging/production separation | TBD | N/A (public) | TBD | TBD |
| VITE_BASE44_FUNCTIONS_VERSION | Public build configuration | src/lib/app-params.js | Build environment | TBD | N/A (public) | TBD | TBD |
| VITE_BASE44_APP_BASE_URL | Public build configuration | src/lib/app-params.js | Build environment; approved origin required | TBD | N/A (public) | TBD | TBD |
| STAGING_BASE_URL | Public CI configuration | Web CI staging smoke | Repository variable, not a secret; not yet configured | TBD | N/A | TBD | TBD |

## Mobile Money Provider Secrets (Backend Only)

| Name | Classification | Consumer | Storage / status | Owner | Last Rotation | Next Review | Provider Key ID |
|---|---|---|---|---|---|---|---|
| MPAY_MERCHANT_ID | Secret | mpesa-payment, airtel-payment, orange-payment backends | Backend secret store | TBD | TBD | TBD | TBD |
| MPAY_API_KEY | Secret | mpesa-payment, airtel-payment, orange-payment backends | Backend secret store | TBD | TBD | TBD | TBD |
| MPAY_PUBLIC_KEY | Public verification key | payments-webhook backend | Backend configuration | TBD | TBD | TBD | TBD |
| MPAY_WEBHOOK_SECRET | Secret | payments-webhook backend | Backend secret store | TBD | TBD | TBD | TBD |

## Stripe (Card Payments)

| Name | Classification | Consumer | Storage / status | Owner | Last Rotation | Next Review | Provider Key ID |
|---|---|---|---|---|---|---|---|
| STRIPE_SECRET_KEY | Secret | card-payment backend | Backend secret store | TBD | TBD | TBD | TBD |
| STRIPE_PUBLISHABLE_KEY | Public | Frontend (via backend config) | Build environment | TBD | N/A (public) | TBD | TBD |
| STRIPE_WEBHOOK_SECRET | Secret | payments-webhook backend | Backend secret store | TBD | TBD | TBD | TBD |

## General

MAISHAPAY_* was mentioned in earlier remediation notes, but exact active backend
environment variable names have not been established by this inventory. Review
payment adapters and provider setup before adding names; do not invent credentials.
This inventory is preliminary, not a certification of all integrations.

## Handling and rotation procedure

- Never place private API keys in VITE_* variables, source, screenshots or logs.
- Store local credentials only in ignored local environment files. CI compile
  checks should not need production credentials.
- Assign an accountable owner for each provider credential and record the last
  rotation date, next review date and provider key identifier in the secret manager.
- Proposed policy: review access every 90 days; rotate immediately on suspected
  exposure, staff access changes or provider notice. Confirm provider-supported
  rotation intervals with the owner rather than assuming an expiry.
- Rotate in staging first, verify checkout and webhook signatures, then coordinate
  production cutover and revocation. Handle public verification-key rotation in
  coordination with the provider; it is not a private signing credential.
- Record evidence and rollback instructions without copying credential values.

## Audit Notes (2026-10-22)

- **Historical issue (AUDIT_RESULTS.md 6.1, 6.2):** VITE_MPESA_TOKEN, VITE_AIRTEL_TOKEN, VITE_ORANGE_TOKEN, VITE_STRIPE_SECRET_KEY were previously exposed in client-side code. **FIXED:** Payment processing moved to backend functions (`src/lib/payments.js` uses `PAYMENT_FUNCTIONS` endpoints). Frontend no longer handles secrets.
- **VITE_BASE44_APP_ID, VITE_BASE44_FUNCTIONS_VERSION, VITE_BASE44_APP_BASE_URL** are public build configs — acceptable in client bundle but must have separate values for staging vs production.
- **STAGING_BASE_URL** must be set as GitHub repository variable for E2E smoke tests.

## Archive note

**This document has been archived to clean up legacy Congo Commerce references. All secret inventory requirements remain valid for the current AfriTrade implementation, with updated status indicators and ongoing completion process.**

---

**End of archived secrets inventory documentation**
