# BASELINE REPORT — AfriTrade (formerly Congo Commerce)

**Generated:** 2026-10-17  
**Archive:** Legacy Congo Commerce reference removed from audit documents

## Repository identity

- **Default branch:** main  
- **Current branch:** main  
- **Commit SHA:** 9662ce18445031d4745ca3e732d2f0e9c0b564fd  
- **Commit message:** feat: rebuild AfriTrade brand identity  
- **Working tree:** modified files  
  - M base44/functions/payments-webhook/entry.ts  
  - M base44/functions/request-withdrawal/entry.ts  
  - M package-lock.json  
  - M test/e2e/smoke.spec.js  
- **Remote tracking:** origin/fix/production-audit-2026-10-16  

## Runtime versions

- Node: v22.22.1  
- npm: 9.2.0  
- OS: Linux  

## Project configuration

- **README.md:** Project described as AfriTrade — "Shopify × Alibaba for Africa", React/Vite frontend + Flutter mobile. Base44 CLI workflow required.  
- **AGENTS.md:** Base44 development rules, `base44 dev` as default.  
- **base44/config.jsonc:** ```json
{
  "name": "AfriTrade",
  "site": {
    "installCommand": "npm install",
    "buildCommand": "npm run build",
    "serveCommand": "npm run dev",
    "outputDirectory": "./dist"
  }
}
```
- **vite.config.js:** Vite + @base44/vite-plugin, security headers plugin, path alias `@/` → `src/`.  
- **playwright.config.js:** testDir `./test/e2e`, baseURL http://localhost:5173, Chromium only.  

## Dependency status

- **package.json name:** base44-app  
- **Key dependencies:** react 18.2.0, react-dom 18.2.0, react-router-dom 6.26.0, @tanstack/react-query 5.84.1, @base44/sdk 0.8.52, @base44/vite-plugin 1.0.44, tailwindcss 3.4.17, three 0.171.0, i18next 26.4.2, zod 3.24.2  
- **Dev dependencies:** vite 8.2.0, @vitejs/plugin-react 6.0.5, @playwright/test 1.63.0, eslint 9.19.0, typescript 5.8.2  
- **Lockfile:** package-lock.json present, modified.  

## Existing capabilities

### Frontend
- React 18 + Vite SPA under `src/`  
- Base44 SDK client at `src/api/base44Client.js`  
- Tailwind CSS design system, Radix UI components  
- i18n French/English (supports Lingala, Kiswahili)  
- Pages: Home, Product detail, Cart, Checkout, Seller portal, Admin, Warehouse, Logistics, Finance  
- Brand system: `src/components/BrandLogo.jsx`, `src/components/AppLayout.jsx`, top bar with AfriTrade lockup  \n
### Backend / Base44 functions
- `base44/functions/` includes: customerAccount, place-order, request-withdrawal, payments-webhook, wallet ledger, chinaSourcing, shippingLabel, etc.  
- Shared libs: `base44/shared/walletLedger.ts`  
- Entities defined in `base44/.types/types.d.ts` — Wallet, WalletTransaction, Order, Product, Seller, Shipment, IdempotencyKey, etc.  

### Mobile
- Flutter project under `lib/` with Android/iOS. Package `com.afritrade.afritrade_flutter`.  

### Tests
- Node tests: `test/**/*.test.js` — passing.  
- Playwright e2e: `test/e2e/smoke.spec.js` recently updated for AfriTrade brand assertions.  
- Lint: eslint passes with warning about React version.  
- Typecheck: `tsc -p ./jsconfig.json` passes.  
- Build: `npm run build` succeeds, dist generated, chunk warnings for >500kB assets.  

## Naming discrepancy investigation

- Repository history contains legacy “Congo Commerce” documentation, audit notes, and a live Base44 URL `https://congocommerce.base44.app` with App ID `6ab43a1371d65d1a911b0fe7`.  
- Recent commits `aacfa19`, `9662ce1` rebrand to **AfriTrade** — pan-African B2B/B2C marketplace.  
- `README.md`, `base44/config.jsonc`, UI components now reference AfriTrade.  
- **Conclusion:** intentional rebrand from Congo Commerce to AfriTrade. Legacy docs remain in repo and require cleanup; no automatic overwrite performed.  

## Build & test status

- **npm run lint:** OK with warning  
- **npm run typecheck:** OK  

**WARNING:** ESLint reports a React version mismatch. The codebase uses React 18.2.0 but ESLint expects React 18.18.0. Add `"react": "detect"` in ESLint config and `settings.react.version = "detect"` to resolve.

- **npm test:** OK — TAP tests pass  
- **npm run build:** OK — dist built in 1.84s  
- **npm run test:e2e:** Not executed in this session due to no running dev server; config present.  

## Environment limitations

- Base44 backend required for full functionality; `npm run dev` alone insufficient.  
- No evidence of CI/CD pipeline configuration in repo.  
- Secrets expected in `.env.local` — gitignored.  
- No explicit staging/production environment definitions observed.  
- Flutter SDK not verified in this session.  

## Missing capabilities / known gaps

- No documented CI/CD, branch protection, or automated deployment.  
- Production monitoring / observability not verified.  
- Payment provider integration details not confirmed; webhook idempotency recently adjusted.  
- Wallet concurrency / held-funds atomicity still under review per context summary.  
- Landing page improvements not scoped.  
- Legacy Congo Commerce docs and brand assets remain.  

## Known failures

- **ESLint React version warning** only.  

## Next steps

- Create isolated repair branch.  
- Execute Phase One full codebase audit.  
- Address P0/P1 defects identified in wallet/payments and brand consistency.  

---

**Note:** This document has been archived from the main audit suite to clean up legacy Congo Commerce references. All technical guidance remains valid for the current AfriTrade implementation.