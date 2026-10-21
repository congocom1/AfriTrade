# AfriTrade staging smoke tests

The GitHub Actions workflow `.github/workflows/ci.yml` reads the repository variable `STAGING_BASE_URL` for pull-request smoke checks. There is **no verified staging hostname** in the repository. Do not point smoke checks at the currently failing production address `https://afritrade-1.base44.app/` or invent a staging domain.

After a dedicated Base44 staging branch or separately deployed staging site exists and returns the AfriTrade application, configure GitHub Actions repository variable `STAGING_BASE_URL` with its exact `https://...` origin (no trailing path). Run manually using `BASE_URL=https://YOUR_VERIFIED_STAGING_DOMAIN npx playwright test test/e2e/smoke.spec.js --reporter=list`.

The native Base44 agent `employee_task_agent` supplies internal task-planning advice only. Actual workload assignments remain in `employee-workspace`, gated by authenticated admin preview and explicit apply. The native agent is not a scheduler and does not send notifications automatically.
