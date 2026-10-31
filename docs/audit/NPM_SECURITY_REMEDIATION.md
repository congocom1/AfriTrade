# npm dependency security remediation — October 21, 2026

The repository has migrated React Router to v7, Tailwind CSS to v4 (using @tailwindcss/postcss with its existing configuration), and replaced Tailwind animation plugin with tw-animate-css. Unused Quill editor dependency was removed.

Verified with a clean npm installation and `npm audit --json`: zero reported advisories at the time of this change. `npm run security:check` now fails if any high or critical vulnerabilities recur, or audit cannot run.

Validation: lint, typecheck, 267 automated tests and Vite production build passed. Note that CLI checks do not prove UI visual parity, accessibility, authentication routes, or hosted Base44 functionality; run browser E2E and screenshot regression testing before shipping this major CSS/router upgrade to production.
