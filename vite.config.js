const base44 = require("@base44/vite-plugin");
const react = require('@vitejs/plugin-react');
const { defineConfig } = require('vite');
const path = require('path');

// Use a CommonJS-style config so builders that parse vite.config.js with
// CJS (like some CI/build environments) won't fail with ESM-only syntax.
const SRC = path.resolve(process.cwd(), 'src');

// Security headers plugin
const securityHeadersPlugin = () => {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // In production, also add HSTS and CSP
        if (process.env.NODE_ENV === 'production') {
          // HSTS - max-age=31536000 seconds (1 year)
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

          // Basic CSP - adjust as needed for your application
          res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https: ws:;");
        }

        next();
      });
    }
  };
};

module.exports = defineConfig({
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
    securityHeadersPlugin()
  ],
  resolve: {
    alias: {
      // Override Base44's URL-style @/ alias with file-path aliases so it
      // resolves on Windows, where "/src/" matches no file on disk.
      '@/': SRC + '/',
      '@': SRC,
    },
  },
});
