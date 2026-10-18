import base44 from "@base44/vite-plugin";
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';

// Use a CommonJS-style config so builders that parse vite.config.js with
// CJS (like some CI/build environments) won't fail with ESM-only syntax.
const SRC = path.resolve(process.cwd(), 'src');

// Performance analyzer for bundle analysis
const buildAnalyzerPlugin = () => {
  if (process.env.ANALYZE === 'true') {
    return {
      name: 'vite-bundle-analyzer',
      generateBundle(options, bundle) {
        const fs = require('fs');
        const path = require('path');

        const statsPath = path.join(process.cwd(), 'dist', 'stats.json');
        const stats = {
          assets: Object.values(bundle)
            .filter(chunk => chunk.type === 'asset' || chunk.type === 'chunk')
            .map(chunk => ({
              name: chunk.name,
              type: chunk.type,
              size: chunk.type === 'asset' ? chunk.source?.length || 0 : chunk.code?.length || 0,
            })),
          assetsTotal: Object.values(bundle).reduce((total, chunk) => {
            return total + (chunk.type === 'asset' ? chunk.source?.length || 0 : chunk.code?.length || 0);
          }, 0)
        };

        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
        console.log('\n📊 Bundle analysis saved to dist/stats.json');
      }
    };
  }
  return null;
};

// Performance monitoring plugin
const performanceMonitorPlugin = () => {
  return {
    name: 'performance-monitor',
    buildStart() {
      console.log('\n🚀 Starting bundle optimization...');
    },
    generateBundle(options, bundle) {
      if (process.env.NODE_ENV === 'production') {
        const totalSize = Object.values(bundle).reduce((total, chunk) => {
          const chunkSize = chunk.type === 'asset' ? chunk.source?.length || 0 : chunk.code?.length || 0;
          return total + chunkSize;
        }, 0);

        const chunks = Object.values(bundle).filter(chunk => chunk.type === 'chunk');
        const largeChunks = chunks.filter(chunk => {
          const size = chunk.code?.length || 0;
          return size > 500 * 1024; // >500KB
        });

        if (largeChunks.length > 0) {
          console.log(`\n⚠️  Found ${largeChunks.length} oversized chunks (>500KB):`);
          largeChunks.forEach(chunk => {
            const sizeKB = ((chunk.code?.length || 0) / 1024).toFixed(2);
            console.log(`  - ${chunk.name}: ${sizeKB}KB`);
          });
        }

        const totalKB = (totalSize / 1024).toFixed(2);
        console.log(`\n✅ Bundle optimization complete: ${totalKB}KB total size`);
      }
    }
  };
};

// Security headers plugin
const securityHeadersPlugin = () => {
  return {
    name: 'security-headers',
    // Apply security headers during HTML generation for production builds
    generateBundle(options, bundle) {
      if (process.env.NODE_ENV === 'production') {
        for (const fileName in bundle) {
          const chunk = bundle[fileName];
          if (chunk.type === 'asset' && chunk.name?.endsWith('.html')) {
            let html = chunk.source?.toString() || '';

            // Add security headers as meta tags to the HTML
            const securityMetaTags = `
  <!-- Security Headers (Production) -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.base44.app https://api.base44.com wss://*.base44.app; frame-ancestors 'none'; base-uri 'self'; form-action 'self';">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()">`;

            html += securityMetaTags + '\n';

            // Update the bundle with enhanced security headers
            chunk.source = html;
          }
        }
      }
    },
    // Keep server middleware for Vite dev server
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Security headers for dev server
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        next();
      });
    }
  };
};

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
    securityHeadersPlugin(),
    buildAnalyzerPlugin(),
    performanceMonitorPlugin()
  ],
  resolve: {
    alias: {
      // Override Base44's URL-style @/ alias with file-path aliases so it
      // resolves on Windows, where "/src/" matches no file on disk.
      '@/': SRC + '/',
      '@': SRC,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'debug'],
    exclude: ['@base44/sdk'],
  },
  build: {
    target: 'es2020',
    legacy: {
      target: 'es2015',
      additionalChunks: 'legacy-chunks',
    },
    moduleNaming: '[hash].js',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      manualChunks: {
        'react-vendor': [
          'react',
          'react-dom',
          'react-router-dom',
          '@tanstack/react-query',
          'react-i18next',
          'i18next',
          'next-themes',
          'framer-motion'
        ],
        'base44-sdk': [
          '@base44/sdk'
        ],
        'radix-ui': [
          '@radix-ui/react-accordion',
          '@radix-ui/react-alert-dialog',
          '@radix-ui/react-avatar',
          '@radix-ui/react-checkbox',
          '@radix-ui/react-collapsible',
          '@radix-ui/react-context-menu',
          '@radix-ui/react-dialog',
          '@radix-ui/react-dropdown-menu',
          '@radix-ui/react-hover-card',
          '@radix-ui/react-label',
          '@radix-ui/react-menubar',
          '@radix-ui/react-navigation-menu',
          '@radix-ui/react-popover',
          '@radix-ui/react-progress',
          '@radix-ui/react-radio-group',
          '@radix-ui/react-scroll-area',
          '@radix-ui/react-select',
          '@radix-ui/react-separator',
          '@radix-ui/react-slider',
          '@radix-ui/react-slot',
          '@radix-ui/react-switch',
          '@radix-ui/react-tabs',
          '@radix-ui/react-toast',
          '@radix-ui/react-toggle',
          '@radix-ui/react-toggle-group',
          '@radix-ui/react-tooltip'
        ],
        'date-utils': [
          'date-fns',
          'date-fns-tz'
        ],
        'form-utils': [
          'react-hook-form',
          '@hookform/resolvers',
          'zod'
        ],
        'chart-utils': [
          'recharts'
        ],
        'map-utils': [
          'react-leaflet',
          'leaflet'
        ],
        'lib-utils': [
          'jspdf',
          'sharp',
          'three',
          'cmdk'
        ]
      }
    }
  }
});
