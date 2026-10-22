## Summary

Explain **what changed** and **why**. Link the relevant issue (`Closes #...` when applicable).

## Scope and risk

- Workspaces / roles affected:
- Data model or Base44 function changes:
- Security, financial, payment, GDPR, supplier, shipping or tenant-isolation impact:
- Rollback or migration strategy:

## Verification (mark only tests you actually ran)

- [ ] `npm run verify:launch` — attach output or summarize exceptions
- [ ] New/updated tests for fixes and risk boundaries
- [ ] Browser checks at mobile and desktop viewports
- [ ] Flutter analyze/tests (when Flutter is changed)
- [ ] Staging deployment and `npm run release:remote` (when publishing)
- [ ] No secrets, customer information or compiled/generated artifacts committed

## Screenshots and UX

Add before/after images for visual changes, describe keyboard/accessibility behavior and applicable locales. Use synthetic test data only.

## Release decision

- [ ] No deployment required
- [ ] Staging QA required
- [ ] Production approval needed — include the signed-off release/incident ticket

**Do not mark P0 financial or operational risks complete based solely on unit tests.** Check [current launch readiness](../docs/audit/LAUNCH_READINESS_2026-10-22.md).
