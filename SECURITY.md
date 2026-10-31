# Security Policy

AfriTrade handles customer information, payment state and seller/tenant records. **Do not open public issues with security exploits, customer details, credentials or private transaction identifiers.**

## Reporting a vulnerability

Prefer GitHub's **Report a vulnerability** / private security advisory feature on this repository, if enabled. If private advisories are not available, contact the repository maintainers through a verified private organizational channel to arrange a secure disclosure. Do not include active secret values in initial reports.

Provide: affected component, a safe minimal reproduction with redacted/synthetic data, impact, remediation idea (if known), and whether the issue is actively exploitable. Maintainers should acknowledge, assess severity, coordinate patches and responsible disclosure. No guaranteed response SLA has been established here.

## Security standards

- Never include real API keys, cookies, OAuth tokens, personal data or payment-provider credentials in Git, pull requests or CI logs.
- Validate permissions and tenant ownership server-side; UI route guards alone are not authorization.
- Payment refunds, payouts, webhook signing, rate limits and customer data exports require controlled staging tests before any production release.
- On suspected exposure: stop affected deployment if appropriate, revoke and rotate credentials, preserve incident evidence, assess customer impact and follow applicable reporting obligations.

For operational readiness, see [current launch risks](docs/audit/LAUNCH_READINESS_2026-10-22.md), [wallet protocol](docs/audit/WALLET_PROTOCOL.md) and [workflow recovery](docs/operations/WORKFLOW_RECOVERY_429_503.md).
