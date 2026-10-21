# Cloudflare Pages readiness (not a deployment)

The AfriTrade SPA currently uses Base44 hosting. An observed HTTP 503 at `https://afritrade-1.base44.app/` is an upstream Base44/hosting availability failure; deploying `_headers` to a separate Cloudflare Pages project will **not** repair that URL.

For an explicitly authorized Cloudflare Pages deployment:

- Connect the approved GitHub repository and select `main` only after staging validation.
- Build command: `npm ci && npm run build`; output directory: `dist`; Node 22.
- `public/_headers` is copied by Vite to `dist/_headers`, where **Cloudflare Pages** serves these response headers. Cloudflare Workers and Base44 hosting do not automatically consume this file.
- The CSP here intentionally only sets safe independent directives; a complete script/connect/style CSP requires a tested inventory of the Base44 SDK, map tiles, image hosts and payment endpoints. Never use an untested restrictive CSP on live checkout.
- Keep API secrets on the server; do not place them in `VITE_` variables or `wrangler.toml`.
- Use a dedicated preview domain and verify SPA deep links, auth redirect URLs, cookies/CORS, backend API origin, payment callbacks, and real data scopes before DNS cutover.
- Configure Cloudflare DNS only for a verified deployed project, not by pointing Cloudflare to an unhealthy Base44 endpoint.
- Before release verify live responses using `curl -I https://YOUR_PAGES_DOMAIN/` and check headers, HTTP 200, browser journeys, and rollback to an earlier Pages deployment.
- For the current Base44 503: inspect Base44 app publishing/deployment status and provider logs or escalate to Base44 support; preserve evidence with timestamp and HTTP request identifiers. This cannot be cured by adding Cloudflare DNS or frontend files.
