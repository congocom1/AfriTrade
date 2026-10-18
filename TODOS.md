# TODOs — DX Review (Phase 2.5, plan-devex-review)

Overall DX Score: 4.5/10 — acceptable, leaning poor. TTHW: Red Flag (>10 min).
Outside Voice: unavailable (codex not installed).

## DX Implementation Checklist

- [x] Add `.env.example` credential template (non-secret keys documented)
- [x] Add copy-paste quickstart with stated TTHW target (<5 min competitive)
- [x] Create `.github/workflows/ci.yml` (lint/typecheck/test/build + optional staging smoke)
- [x] Fix ESLint React version warning in eslint.config.js
- [x] Write agent-ready-v1 error contract per error path (what/fix/recovery/code/context/trace/redaction/channel)
- [x] Add developer docs portal or docs index page; contribution guide
- [x] Add upgrade/migration guide for dependencies and assets
- [x] Track DX metrics: TTHW, error rates, DX scorecard history
- [x] Run `scripts/optimize-images.js` and commit WebP variants
- [x] Investigate wallet refund-payment 503 release gate (docs/audit/WALLET_PROTOCOL.md)
- [x] Log DX review record via gstack-review-log

## P2-03 Flutter parity verification

- [x] `flutter analyze` — no issues found
- [x] `flutter test` — 32/32 tests pass
- [x] API contract parity documented (lib/ models vs src/api/ interfaces)

## DX Scorecard Summary

| Pass | Area | Score | Grade |
|------|------|-------|-------|
| 1 | Getting Started | 5/10 | acceptable |
| 2 | API/CLI/SDK Design | 6/10 | acceptable |
| 3 | Error Messages & Debugging | 4/10 | poor |
| 4 | Documentation | 5/10 | acceptable |
| 5 | Upgrade & Migration | 4/10 | poor |
| 6 | Dev Environment & Tooling | 7/10 | good |
| 7 | Community & Ecosystem | 3/10 | poor |
| 8 | DX Measurement | 2/10 | broken |

**Overall: 4.5/10 — acceptable, leaning poor**
