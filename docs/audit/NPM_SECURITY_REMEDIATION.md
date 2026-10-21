# npm security status — 2026-10-21

`npm audit fix` previously applied available nonbreaking fixes. The remaining advisories are **not resolved** by this patch. `npm run security:check` fails on new high/critical affected package names or an unavailable audit report; its reviewed temporary baseline is in the script. This is a regression guard, NOT a green security audit.

- Tailwind CSS 3 with chokidar, braces, micromatch and fast-glob: remaining high findings; no compatible nonbreaking upgrades reported by npm audit. Moving to Tailwind 4 requires CSS/PostCSS and visual regression testing.
- React Router 6: advisory fix requires a major v7 migration and authentication/navigation E2E testing.
- react-quill-new/Quill: remaining low-severity issue with major upgrade path.
- PostCSS dependencies: additional moderate advisories, revisit with the Tailwind migration.

Run `npm audit` for the current complete advisory report. Reassess baseline on every dependency update. Do not approve unrestricted production on the basis of this regression check.
