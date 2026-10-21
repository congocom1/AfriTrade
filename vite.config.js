import base44 from "@base44/vite-plugin";
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { securityHeadersPlugin } from './scripts/security-headers-plugin.js';

// Use a CommonJS-style config so builders that parse vite.config.js with
// CJS (like some CI/build environments) won't fail with ESM-only syntax.
const SRC = path.resolve(process.cwd(), 'src');

// Performance analyzer for bundle analysis
const buildAnalyzerPlugin = () => {
  if (process.env.ANALYZE === 'true') {
    return {
      name: 'vite-bundle-analyzer',
      generateBundle(options, bundle) {

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

export default defineConfig({
  server: {
    port: 5174,
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
    // Pre-bundle every client dependency up front. Without this, Vite discovers
    // packages used only by lazy-loaded route chunks after the app has already
    // started, re-optimizes, and hands out new dependency hashes mid-session —
    // the running page keeps the old hashes and its lazy imports then fail with
    // "504 Outdated Optimize Dep" / "Failed to fetch dynamically imported module".
    include: [
      'react', 'react-dom', 'react-router-dom', 'debug',
      '@tanstack/react-query', 'react-i18next', 'i18next',
      'react-hook-form', '@hookform/resolvers', 'zod',
      'lucide-react', 'clsx', 'tailwind-merge', 'class-variance-authority',
      'framer-motion', 'date-fns',
      'recharts', 'jspdf', 'three', 'react-leaflet',
      'react-markdown', 'embla-carousel-react', 'cmdk', 'vaul',
      'sonner', 'react-hot-toast', 'next-themes', 'input-otp',
      'react-day-picker', 'react-resizable-panels',
      '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio', '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox', '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu', '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu', '@radix-ui/react-focus-scope',
      '@radix-ui/react-hover-card', '@radix-ui/react-label',
      '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover', '@radix-ui/react-progress',
      '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area',
      '@radix-ui/react-select', '@radix-ui/react-separator',
      '@radix-ui/react-slider', '@radix-ui/react-slot',
      '@radix-ui/react-switch', '@radix-ui/react-tabs',
      '@radix-ui/react-toast', '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group', '@radix-ui/react-tooltip',
    ],
    exclude: ['@base44/sdk'],
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-engine-core', test: /node_modules\/three\/build\/three\.core\.js$/ },
            { name: 'three-engine-module', test: /node_modules\/three\/build\/three\.module\.js$/ },
            { name: 'three-renderers', test: /node_modules\/three\/src\/renderers\// },
            { name: 'three-math', test: /node_modules\/three\/src\/math\// },
            { name: 'three-loaders', test: /node_modules\/three\/examples\/jsm\/loaders\// },
            { name: 'three-controls', test: /node_modules\/three\/examples\/jsm\/controls\// },
            { name: 'three-core', test: /node_modules\/three\// },
            { name: 'translations', test: /src\/i18n\/(en|fr|ln|sw|resources)\.js$/ },
            { name: 'charts', test: /node_modules\/(recharts|d3-[^/]+)\// },
            { name: 'pdf', test: /node_modules\/jspdf\// },
            { name: 'html2canvas', test: /node_modules\/html2canvas\// },
            { name: 'pdf-deps', test: /node_modules\/(fflate|canvg|@babel)\// },
          ],
        },
      },
    },
  },
});