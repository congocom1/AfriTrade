import base44 from "@base44/vite-plugin";
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { securityHeadersPlugin } from './scripts/security-headers-plugin.js';

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
              name: chunk.name || chunk.fileName,
              type: chunk.type,
              size: chunk.type === 'asset' ? chunk.source?.length || 0 : chunk.code?.length || 0,
            })),
          assetsTotal: Object.values(bundle).reduce((total, chunk) => {
            return total + (chunk.type === 'asset' ? chunk.source?.length || 0 : chunk.code?.length || 0);
          }, 0)
        };

        fs.mkdirSync(path.dirname(statsPath), { recursive: true });
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

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: true,
    // Native projects and generated SDK trees share this repository, but are
    // not Vite inputs. Do not follow their plugin trees and exhaust inotify.
    watch: {
      ignored: [
        '**/android/**', '**/ios/**', '**/windows/**',
        '**/.dart_tool/**', '**/build/**', '**/oracleJdk-27/**',
        '**/test/e2e/visual-regression/diff/**',
      ],
    },
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
      '@mainmoneyapp/js-core', '@mainmoneyapp/js-http', '@mainmoneyapp/js-checkout',
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
            // React first. A group absorbs the dependencies of the modules it
            // matches, so without its own group React is folded into whichever
            // dependency cluster is emitted first (charts, three) and shipped
            // twice.
            { name: 'react-core', test: /node_modules\/(react|react-dom|scheduler)\// },
            // Three.js: three.core.js (the engine) and three.module.js (the engine
            // plus the WebGL renderer) are two separate build files, and the
            // examples/addons directory is a third. Keeping them apart means a page
            // that only needs the core does not download the renderer or the addons.
            { name: 'three-engine-core', test: /node_modules\/three\/build\/three\.core\.js$/ },
            { name: 'three-engine-module', test: /node_modules\/three\/build\/three\.module\.js$/ },
            { name: 'three-addons', test: /node_modules\/three\/examples\/jsm\// },
            { name: 'three-other', test: /node_modules\/three\// },
            // Charts: the d3 modules recharts builds on get their own chunk, so a
            // chart page fetches recharts and its maths in parallel instead of as
            // one oversized bundle.
            { name: 'charts-d3', test: /node_modules\/d3-[^/]+\// },
            { name: 'charts-recharts', test: /node_modules\/(recharts|victory-vendor|react-smooth|fast-equals|decimal\.js-light)\// },
            { name: 'pdf', test: /node_modules\/jspdf\// },
            { name: 'html2canvas', test: /node_modules\/html2canvas\// },
            { name: 'pdf-deps', test: /node_modules\/(fflate|canvg|@babel)\// },
            // Translations: one chunk per locale instead of a single ~330KB
            // bundle, plus a chunk for the shared copy patches that every locale
            // consumes. Order matters: the locale patterns must come first.
            { name: 'locale-fr', test: /src\/i18n\/(fr|fr-extended)\.js$/ },
            { name: 'locale-en', test: /src\/i18n\/en\.js$/ },
            { name: 'locale-ln', test: /src\/i18n\/ln\.js$/ },
            { name: 'locale-sw', test: /src\/i18n\/sw\.js$/ },
            { name: 'i18n-copy', test: /src\/i18n\// },
          ],
        },
      },
    },
  },
});

