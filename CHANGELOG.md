# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-10-22

### Repository maintenance
- Archived historical completion/audit documents without rewriting existing commit history.
- Added current project README, canonical contribution/security policies, and repository branch/merge governance.
- Added GitHub issue/PR templates, CODEOWNERS, `.editorconfig`, and `.gitattributes`.
- Added maintained-document link checks and integrated them into CI and the launch verification command.
- Preserved the eight remote legacy branches for owner review (two contain unmerged commits).

## [0.0.1.0] - 2026-10-18

### Added
- AfriTrade brand identity — a refreshed visual identity with new color tokens, typography, and component styles across the storefront
- Design system documentation — component library, accessibility, motion, color tokens, typography, mobile specs, and dashboard specs (Phase C-J)
- Visual QA & validation — axe accessibility E2E tests and baseline screenshots for seller pages (Phase K.2)
- Asset optimization — WebP image variants and a reconciled asset manifest (Phase K.3)
- DX getting started — .env.example credential template and a copy-paste quickstart
- Developer docs portal and contribution guide
- Agent-ready v1 error contract — standardized error paths across the app
- Upgrade and migration guide for dependencies and assets
- DX metrics baseline tracking — TTHW, error rates, and scorecard history

### Changed
- Primary color contrast improved to meet WCAG AA
- Baseline seller dashboard screenshot regenerated after the E2E run

### Fixed
- Vite now runs on port 5174 to avoid a FreeLLMAPI port conflict
- Replaced template-literal key and localhost URL in flagged lines
- Resolved preflight secrets findings and registered empty lanes
- Added missing `sellerWallet.method` translation (English and French)
