// Local middleware is not production hosting configuration. See
// docs/audit/PRODUCTION_HARDENING.md for the response-header release gate.
const localHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Preserve the existing allowlist pending staging compatibility testing.
// frame-ancestors is response-header-only and must be set by the host.
const contentSecurityPolicy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://base44.app https://*.base44.app https://api.base44.com wss://*.base44.app; base-uri 'self'; form-action 'self';";

function configureLocalHeaders(server) {
  server.middlewares.use((_req, res, next) => {
    for (const [name, value] of Object.entries(localHeaders)) {
      res.setHeader(name, value);
    }
    next();
  });
}

export function securityHeadersPlugin() {
  let isBuild = false;
  return {
    name: 'security-headers',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    transformIndexHtml: {
      order: 'pre',
      handler() {
        if (!isBuild) return;
        return [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: contentSecurityPolicy },
            injectTo: 'head-prepend',
          },
          {
            tag: 'meta',
            attrs: { name: 'referrer', content: localHeaders['Referrer-Policy'] },
            injectTo: 'head-prepend',
          },
        ];
      },
    },
    configureServer: configureLocalHeaders,
    configurePreviewServer: configureLocalHeaders,
  };
}