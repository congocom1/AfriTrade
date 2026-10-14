import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// Use an ESM-compatible method to resolve the src directory so aliasing works
// across loaders and on Windows.
const SRC = path.resolve(process.cwd(), 'src')
// Alternatively you could use:
// const SRC = path.resolve(new URL('./src', import.meta.url).pathname)

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

// https://vite.dev/config/
export default defineConfig({
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
