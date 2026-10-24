import base44 from "@base44/vite-plugin";
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');

// Performance analyzer for bundle analysis
const buildAnalyzerPlugin = () => {
  if (process.env.ANALYZE === 'true') {
    return {
      name: 'vite-bundle-analyzer',
      generateBundle(options, bundle) {
        const distDir = path.join(process.cwd(), 'dist');
        const statsPath = path.join(distDir, 'stats.json');
        const stats = {
          assets: Object.values(bundle)
            .filter(chunk => chunk.type === 'asset' || chunk.type === 'chunk')
            .map(chunk => ({
              name: chunk.name || chunk.fileName,
              type: chunk.type,
              size: chunk.type === 'asset' ? chunk.source?.length || 0 : chunk.code?.length || 0,
            })),
          assetsTotal: Object.values(bundle).reduce((total, chunk) => {
            return total + (chunk.type === 'asset' ? chunk.source?.length || 0 : chunk.code?.length || 0);
          }, 0)
        };

        fs.mkdirSync(distDir, { recursive: true });
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
            console.log(`  - ${chunk.name || chunk.fileName}: ${sizeKB}KB`);
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
    transformIndexHtml(html) {
      if (process.env.NODE_ENV !== 'production') return html;
      const securityMetaTags = [
        '    <!-- Security Headers (Production) -->',
        '    <meta http-equiv="X-Content-Type-Options" content="nosniff" />',
        '    <meta name="referrer" content="strict-origin-when-cross-origin" />',
      ].join('\n');
      return html.replace('</head>', `${securityMetaTags}\n  </head>`);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
      });
    }
  };
};

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
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
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/@tanstack/react-query') ||
            id.includes('/react-i18next/') ||
            id.includes('/i18next/') ||
            id.includes('/next-themes/') ||
            id.includes('/framer-motion/')
          ) {
            return 'react-vendor';
          }
          if (id.includes('/@base44/sdk/')) {
            return 'base44-sdk';
          }
          if (id.includes('/@radix-ui/')) {
            return 'radix-ui';
          }
          if (id.includes('/date-fns/')) {
            return 'date-utils';
          }
          if (
            id.includes('/react-hook-form/') ||
            id.includes('/@hookform/resolvers/') ||
            id.includes('/zod/')
          ) {
            return 'form-utils';
          }
          if (id.includes('/recharts/') || id.includes('/d3-')) {
            return 'chart-utils';
          }
          if (id.includes('/leaflet/') || id.includes('/react-leaflet/')) {
            return 'map-utils';
          }
          if (id.includes('/three/')) {
            return 'three-vendor';
          }
          if (id.includes('/jspdf/') || id.includes('/cmdk/')) {
            return 'lib-utils';
          }
          return undefined;
        }
      }
    }
  }
});
