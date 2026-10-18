# DX Metrics — AfriTrade

Tracks developer-experience metrics: time-to-hello-world (TTHW), error rates, and DX scorecard history.

## TTHW (time-to-hello-world)

| Run | Date | TTHW | Target | Status |
|-----|------|------|--------|--------|
| Baseline | 2026-10-18 | >10 min | <5 min | Red Flag |

Target: new contributor goes from clone to running `npm run build` green in under 5 minutes.

## DX Scorecard history

| Area | 2026-10-18 | Grade | Notes |
|------|------------|-------|-------|
| 1 Getting Started | 5/10 | acceptable | Quickstart added (docs/quickstart.md) |
| 2 API/CLI/SDK Design | 6/10 | acceptable | Base44 SDK client in src/api/ |
| 3 Error Messages & Debugging | 4/10 | poor | agent-ready-v1 error contract added (docs/errors/) |
| 4 Documentation | 5/10 | acceptable | Developer portal + contribution + upgrade guides added |
| 5 Upgrade & Migration | 4/10 | poor | UPGRADE_MIGRATION.md added |
| 6 Dev Environment & Tooling | 7/10 | good | CI, lint, typecheck, build all present |
| 7 Community & Ecosystem | 3/10 | poor | CONTRIBUTING.md added |
| 8 DX Measurement | 2/10 | broken | This file establishes baseline tracking |

**Overall: 4.5/10 — acceptable, leaning poor** (baseline 2026-10-18)

## Error rate tracking

Track production and CI error rates here as incidents occur. Fields: date, code, count, area, resolution.

| Date | Code | Count | Area | Resolution |
|------|------|-------|------|------------|
| 2026-10-18 | wallet.refund_disabled | ongoing | wallet | Release blocked; see WALLET_PROTOCOL.md |

## How to update

After each DX-relevant change (new doc, new CI check, new error path), update this file:
1. Update the scorecard row if the area score changed.
2. Add a TTHW row if you measured a new contributor's onboarding time.
3. Add an error-rate row for recurring production/CI errors.
