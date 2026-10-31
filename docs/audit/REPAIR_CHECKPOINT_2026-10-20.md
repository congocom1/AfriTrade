# Production repair checkpoint — 2026-10-20

## Decision: NOT READY

This is a bounded header/test repair checkpoint, not completion of the production
master brief. Financial reconciliation, whole-product inventory, Flutter,
rendered UI, backend typechecking and hosted validation remain unfinished.

## Repository and isolation

- GitHub's old repository URL redirects to congocom1/AfriTrade.
- Canonical main fetched at bc87c9849edd9b124b465a665b530c9351274013.
- Original checkout e61e38affdbdec769db19245f525a5847708dfad is 37 commits behind.
- Worktree: /home/hermes/afritrade-production-repair.
- Branch: repair/production-gates-2026-10-20.
- Original untracked preview artifacts and main were preserved.
- CLI authentication succeeded; intended app/environment and GitHub integration
  settings have NOT been verified. No remote writes or linking performed.

## Repairs and reproduction

1. Vite appended unsupported security metadata after the HTML document; the
   hardening report incorrectly claimed hosting-independent protection.
   Extracted plugin now uses head metadata for supported policies and local
   response middleware for development/preview. Existing CSP allowlist retained.
   Production hosting controls remain a release gate, not an implemented fix.
2. Full-suite run initially returned 210 pass / 1 fail: the REST review test's
   client lacked auth and expected anonymous success despite the current admin
   restriction. Preserved the endpoint and added denied-role and auth-failure
   behavior coverage with assertions that no review rows are read.

## Local evidence

## Follow-up repair — same day

Closed the P0 items that were still open in OPEN_RISKS.md, plus two correctness
defects found while verifying them.

| Area | Change |
| --- | --- |
| R-001 | Removed a dead commented-out provider-verification block and its "verification completed" log that claimed a check the code did not perform. The RS256 JWT check is the provider authentication. |
| R-002 | Withdrawal idempotency now requires a caller-supplied `request_id` instead of deriving the key from amount/method/account, which suppressed a later legitimate identical withdrawal. A retry of the same id returns the existing movement rather than a 409 that invited endless client retries. |
| R-004 | Removed DRC-only / CFA / Kinshasa-courts copy that contradicted the pan-African app configuration, and the "RDC" labels leaking into pickup and directory UI. |
| R-003 | Audited every service-role function: all verify the caller except the provider-signed webhook and the emailed-token verification page. |
| — | Mobile-money validation was DRC-only and rejected every Nigerian number although Nigeria is the configured default country; one table now serves both, normalizing local/trunked/international spellings to E.164 and rejecting wrong lengths. |

Verification: `npm test` 223 passed / 0 failed (was 217; +6 withdrawal-contract
cases exercising the real ledger), `npm run lint` clean, `npm run typecheck`
clean, `npm run build` succeeds, `git diff --check` clean.

Not closed by this work: hosted `updateMany` atomicity, hosted replayed-delivery
behaviour, production response headers, CI hosted execution and branch
protection, Flutter parity, bundle size, and the business decisions behind the
legal-entity fields. Repository work cannot close any of them.

Environment: Linux, Node v22.22.1, npm 9.2.0. No hosted services used by tests.

| Check | Result |
| --- | --- |
| npm ci --ignore-scripts --no-audit --no-fund | 641 packages installed; lifecycle scripts intentionally not exercised |
| node --test test/security-headers-plugin.test.js | 4 passed; actual Vite fixture build and loopback HTTP requests |
| npm test | 216 passed, 0 failed/skipped/TODO |
| npm run lint | Passed |
| npm run typecheck | Passed; frontend only |
| npm run build | Passed; oversized chunk warnings remain |
| git diff --check | Passed |
| npm audit --json | 12 findings: 5 high, 5 moderate, 2 low; reachability and compatible fixes not yet assessed |
| Hosted CI / staging / production headers | Not verified |
| Flutter / rendered browser journeys | Not exercised |

Transient command logs are under /tmp/afritrade-repair-*. They are not durable
release artifacts. No payment, notification, migration or customer-data changes
occurred. No push, PR, Base44 sync, deployment or publication occurred.

## Next work and external decisions

- Complete archived patch review and capability reconciliation before financial
  changes; do not apply the patch wholesale or mix CommerceControl with receipts.
- Review dependency advisories and restore meaningful backend checking.
- Confirm approved staging app ID/origin and production hosting owner before
  hosted concurrency, provider and header verification. CLI login alone does
  not establish which environment is safe for disposable test records.
- Inspect hosted CI and current Base44 GitHub connection read-only.
- Continue local inventory, Flutter and UI work independently of those decisions.

## Rollout / recovery for this bounded change

Do not publish this work as a production-ready release. Stage the header change
and exercise auth/payment/asset compatibility first: moving CSP into head makes
it effective where the previous placement could be ignored. A confirmed host
CSP must be coordinated with metadata, since both policies can apply.
Rollback is a code revert of this bounded change; it does not undo any external
effects. No schema/data migration or financial recovery is needed for this
checkpoint because none was performed. Full release still requires the wallet
runbook, approved configuration, complete evidence and explicit publication
authorization.