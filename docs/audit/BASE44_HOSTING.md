# AfriTrade managed hosting

AfriTrade's published `https://afritrade-1.base44.app/` domain is served through infrastructure owned by Base44 and its hosting providers. Seeing `server: cloudflare` in the response does **not** indicate a separate Cloudflare Pages, Workers, Tunnel, or DNS configuration owned by this app. The site cannot bypass the provider's edge while using that Base44-managed URL.

The optional Cloudflare Pages readiness materials (`public/_headers`, its setup guide, and its specialized test) were removed because this project is deployed with the Base44 site deployment mechanism, not a separate Cloudflare Pages project. No `wrangler.toml`, `wrangler.json`, or worker deployment scripts are configured on the main branch. Removing those optional files does **not** modify live Base44 routing, SSL certificates, or the site's availability.

The server's `cf-connecting-ip` header reader in `base44/shared/securityHeaders.ts` is **not** a Cloudflare deployment integration. It is an input to the existing API rate-limiting implementation. Do not remove or replace it with an untrusted client header without reviewing the trusted proxy contract and the abuse controls.

Security headers for live responses must be configured and verified at the actual hosting edge. Local Vite preview middleware and HTML meta tags do not install production response headers.

## If the site returns 503

1. Verify the frontend builds (`npm ci && npm run build`), and check the latest checkpoint.
2. Authenticate using an authorized Base44 CLI session, and deploy **only the site** when publishing frontend changes: `npx base44 --app-id 6ad35f967cfc0088309e830b site deploy --build --yes`.
3. Confirm public status: `curl -I https://afritrade-1.base44.app/`. Expect HTTP 200 with a valid TLS certificate. Do not treat HTTP->HTTPS redirect or `/robots.txt` availability as proof the app itself works.
4. If the homepage still returns 503 after a confirmed successful publish, use Base44's publishing/build logs and support with timestamp and response request IDs. Repository cleanup cannot remove the managed edge or fix a provider-side failure.

Moving to hosting that does not use Cloudflare requires a separate migration plan, new hosting, an owned custom domain/DNS configuration, working backend/auth redirect integration, and tests. Do not change DNS just to work around an unhealthy origin.
