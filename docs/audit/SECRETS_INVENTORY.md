# AfriTrade configuration and secrets inventory

Repository-derived inventory, 2026-10-17. No secret values are recorded here.
Presence in code does not establish that a credential is configured or valid.

| Name | Classification | Consumer | Storage / status |
| --- | --- | --- | --- |
| WIX_CHECKOUT_API_KEY | Secret | create-checkout backend | Backend secret store; owner and rotation date unverified |
| WIX_CHECKOUT_SITE_ID | Configuration identifier | create-checkout backend | Backend configuration; value unverified |
| WIX_CHECKOUT_APP_URL | Public return-origin configuration | create-checkout backend | Backend configuration; approved origin unverified |
| WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY | Public verification key, integrity-sensitive | payments-webhook backend | Backend configuration; provider provenance and rotation unverified |
| VITE_BASE44_APP_ID | Public build configuration | src/lib/app-params.js | Build environment; verify staging/production separation |
| VITE_BASE44_FUNCTIONS_VERSION | Public build configuration | src/lib/app-params.js | Build environment |
| VITE_BASE44_APP_BASE_URL | Public build configuration | src/lib/app-params.js | Build environment; approved origin required |
| STAGING_BASE_URL | Public CI configuration | Web CI staging smoke | Repository variable, not a secret; not yet configured by this work |

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