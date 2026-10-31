# Phase A — Visual Audit: AfriTrade Repository

**Date:** 2026-10-17  
**Branch:** `visual-redesign` (new dedicated branch for all visual work)  
**Status:** Complete — ready for Phase B design system work

---

## Executive Summary

The repository implements a mature visual design system under the brand name **AfriTrade** (formerly referred to as "CongoCommerce" in legacy references — see Brand Integrity below). The design system is cohesive: Tailwind tokens resolve through CSS custom properties in `src/index.css`, all pages consume a consistent set of shared components, Radix UI primitives, and lucide-react icons. Layout shells (DashboardShell/DashboardNav, AuthLayout, BottomNav/TopBar) are reusable and consistent.

**Overall assessment:** Strong foundation — minor inconsistencies only. No critical visual defects found. The directive's "Apple-level simplicity," "Stripe financial clarity," and "Shopify usability" targets are structurally supported by the current architecture.

---

## Brand Integrity

**The product brand is AfriTrade.** This is confirmed by four independent sources:

| Source | Evidence |
|--------|----------|
| `BRAND.md` | "AfriTrade" named as the brand throughout; monogram "A/T"; never an Africa map |
| `docs/design/design-brief.md` | "The network that holds"; Sora/Manrope/JetBrains Mono; ≤32MiB desktop / ≤16MiB mobile |
| `index.html` | `<title>` and meta reference AfriTrade |
| `src/components/BrandLogo.jsx` | Renders `Afri<span>Trade</span>`; LOGO_URL = `/brand/logo-primary.svg` |

**Historical Note:** Legacy documentation and repository references used "CongoCommerce" prior to the rebrand. The decision to standardize on AfriTrade was made per directive constraint #3 ("Inspect the project's actual brand direction before changing names"). All 12 design docs and visual enhancements use the AfriTrade brand identity.

**Brand color:** Congo Jade — `--primary: hsl(158 78% 29%)` (light mode), `hsl(160 70% 55%)` (dark mode). Accent: `--accent: hsl(157 44% 91%)` / dark `#0d7858` seller-CTA gradient.

---

## Design System Coverage

### Tokens (`src/index.css`)

The token system is **complete and mature**:

- **Color palette:** Full HSL-based system with `:root` (light) and `.dark` (dark) blocks. Primary, secondary, muted, accent, destructive, border, input, ring, chart-1–5, sidebar variants.
- **Typography:** `--font-heading` (Sora), `--font-body` (Manrope), `--font-display` (Sora), `--font-mono` (JetBrains Mono). Optical sizing, line-height, and letter-spacing variables defined.
- **Surfaces:** Material design variables (`.material`, `.material-elevated`, `.material-scrim`) with backdrop-blur.
- **Brand system:** `.brand-hero`, `.brand-trust-band`, `.brand-seller-cta`, `.brand-action` variants, `.brand-kicker`, `.brand-section-label` — all fully styled.
- **Paper console:** `.paper-console` theme for SellerDashboard with Georgia serif headings, `--paper`/`--ink`/`--green` variables, hairline rules, and entrance animations.
- **Accessibility:** `prefers-reduced-motion` and `prefers-reduced-transparency` media queries implemented. Focus rings via `outline` on `:focus-visible`.
- **Skeleton shimmer:** `@keyframes shimmer` with compositor-friendly `transform` animation.

**Status:** Production-grade. No token gaps found.

### Typography System

| Element | Font | Size | Leading | Tracking |
|---------|------|------|---------|----------|
| Display (h1 Hero) | Sora | clamp(1rem, 1.2vw, 1.17rem) | 1.08 | -0.075em |
| Hero title | Sora | 4xl/md:text-6xl | 0.98 | -0.055em |
| Headings (h2 SectionHeader) | Sora | text-lg/md:text-xl | 1.15 | -0.01em |
| Body text | Manrope | base | 1.5 | 0 |
| Captions | Manrope | text-xs/text-[10px] | 1.4–1.5 | 0.01em |
| Mono labels | JetBrains Mono | text-[10px] | 1.4 | 0.14em |

**Status:** Consistent and well-defined. Hero titles use `font-display` class for large display text.

### Components Review

#### Shared Components (High Quality)

| Component | Path | Observations |
|-----------|------|-------------|
| `Button` | `src/components/ui/button.jsx` | cva-based variants (default/destructive/outline/secondary/ghost/link), sizes (default/sm/lg/icon). Fully typed. |
| `Image` | `src/components/ui/image.jsx` | ResponsiveImage with Wix Media support, fallback image, optimized loading. |
| `StatusBadge` | `src/components/StatusBadge.jsx` | Status→style mapping for all order/seller states. Supports `paper` variant. French labels via LABELS map + `useTranslation`. |
| `EmptyState` | `src/components/EmptyState.jsx` | Dashed border, icon, title, description, action link. Clean. |
| `SectionHeader` | `src/components/SectionHeader.jsx` | Title + subtitle + see-all ChevronRight link. Consistent across all pages. |
| `ProductCard` | `src/components/ProductCard.jsx` | `memo`-wrapped, LazyImage, discount badge, flash-sale badge, wishlist heart, rating stars. Consistent `group` hover. |
| `ProductRow` | `src/components/ProductRow.jsx` | `memo` + horizontal scroll snap. Skeleton loading. |
| `ProductGrid` | `src/components/ProductGrid.jsx` | Responsive CSS grid (2-col mobile → 4-col desktop). |
| `SellerCard` | `src/components/SellerCard.jsx` | Verified badge, location, sales count, optional RatingStars. |
| `DashboardNav` | `src/components/DashboardNav.jsx` | Title + mobile select + desktop nav links. Supports `variant="paper"`. |
| `DashboardShell` | `src/components/DashboardShell.jsx` | Wrapper: DashboardNav + children, `space-y-5 pb-8`. |
| `AuthLayout` | `src/components/AuthLayout.jsx` | Consistent form container with icon bubble, card, footer. |
| `MobileActionBar` | `src/components/MobileActionBar.jsx` | Fixed bottom bar above BottomNav, hidden md+. |
| `LanguageToggle` | `src/components/LanguageToggle.jsx` | Compact select styled like CurrencyToggle. |

#### shadcn/ui Components

Full suite under `src/components/ui/`: accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip.

**Status:** All components present and consistent with shadcn/ui conventions.

### Layout Shells

#### App Layout (`src/components/layout/`)
| File | Role |
|------|------|
| `AppLayout.jsx` | Root flex layout with TopBar + Outlet + BottomNav |
| `TopBar.jsx` | Header with search, language toggle, cart, user menu |
| `BottomNav.jsx` | Mobile navigation with icon + label items |
| `HeaderActions.jsx` | Cart, search, profile actions |
| `MobileDrawer.jsx` | Mobile navigation drawer |

**Status:** Cohesive and consistent across all consumer pages.

#### Dashboard Shells
- **Admin:** `DashboardShell` + `DashboardNav` with `ADMIN_LINKS` (45 nav items from `src/lib/navLinks.js`). Used consistently across all admin pages.
- **Seller:** Most pages use `DashboardShell` + `DashboardNav`. **Exception:** `SellerDashboard.jsx` uses `variant="paper"` with a full `.paper-console` theme wrapper instead.

### Page-by-Page Audit

#### Consumer Pages

| Page | Path | Visual Consistency | Notes |
|------|------|-------------------|-------|
| Home | `src/pages/Home.jsx` | ✅ Excellent | Brand-hero section, collections grid, category chips, flash sale row, ShoppingAssistant, discovery feed, trust band, seller CTA. Consistent token usage. |
| ProductDetail | `src/pages/ProductDetail.jsx` | ✅ Excellent | Gallery with photo/3D toggle, wishlist heart, flash badge, price with compare-at, variants, quantity stepper, add-to-cart/buy-now, delivery info, PriceBreakdown, ProductReviews, related products, MobileActionBar. |
| Categories | `src/pages/Categories.jsx` | ✅ Excellent | 4-column category grid with images + counts. |
| About | `src/pages/About.jsx` | ✅ Excellent | Minimal text page. |
| Discover | `src/pages/Discover.jsx` | ✅ Good | Content feed with like/share/add-to-cart, creator cards, action rail. |
| Checkout | `src/pages/Checkout.jsx` | ✅ Excellent | 3-step (delivery/payment/review), mobile vs desktop layouts, mobile money validation, coupon, VAT, intl shipping. |
| Login | `src/pages/Login.jsx` | ✅ Excellent | AuthLayout, email/password + Google. |
| Register | `src/pages/Register.jsx` | ✅ Excellent | AuthLayout, email/password/confirm + OTP + Google. |

#### Seller Pages

| Page | Path | Visual Consistency | Notes |
|------|------|-------------------|-------|
| SellerDashboard | `src/pages/seller/SellerDashboard.jsx` | ✅ Good (paper theme) | Uses `.paper-console` theme with Georgia serif. Stats tiles, AI tips, latest orders, paper tiles. Uses `DashboardNav variant="paper"` directly — not via DashboardShell. |
| SellerProducts | `src/pages/seller/SellerProducts.jsx` | ⚠️ Minor | ProductCard defined inline (not using shared `src/components/ProductCard.jsx`). Zod schema form. |
| SellerOrders | `src/pages/seller/SellerOrders.jsx` | ✅ | Fulfillment flow (SELLER_FLOW), cancel, status badges, payout info. |
| SellerSettings | `src/pages/seller/SellerSettings.jsx` | ✅ | Shop profile form, verification section. |
| SellerQuotes | `src/pages/seller/SellerQuotes.jsx` | ✅ | B2B quote inbox, respond with price/message, realtime subscribe. |
| SellerWallet | `src/pages/seller/SellerWallet.jsx` | ✅ | Balance, withdrawal request (M-Pesa/Airtel/Orange/Virement), transaction list. |
| InventoryManagement | `src/pages/seller/InventoryManagement.jsx` | ⚠️ **Inconsistency** | Hardcoded French strings bypassing `t()`: "Aucune boutique associée à votre compte", "Déposer une candidature vendeur", etc. |
| SellerImport | `src/pages/seller/SellerImport.jsx` | ✅ | Supplier search, price breakdown, AI description, publish product. |
| SellerPortal | `src/pages/seller/SellerPortal.jsx` | ✅ | Portal KPIs, performance, inventory alerts, incoming orders, quick tiles. |
| SellerMessages | `src/pages/seller/SellerMessages.jsx` | ✅ | ChatInbox integration. |

#### Admin Pages

| Page | Visual Consistency | Notes |
|------|-------------------|-------|
| AdminDashboard | ✅ | DashboardShell + ADMIN_LINKS, KPI grid, latest orders, audit log, dispute banner. |
| AdminSettings | ✅ | Pricing/country config, DEFAULT_PRICING_CONFIG/DEFAULT_COUNTRY_CONFIG, PlatformSetting entities. |
| AdminUsers | ✅ | Sellers/creators/couriers/team tabs, invite user, toggle status, verify, TenantEmailField. |
| + 25 more | ✅ | All use DashboardShell + ADMIN_LINKS consistently. |

### Specialized Components

| Component | Path | Observations |
|-----------|------|-------------|
| `Product3DViewer` | `src/components/Product3DViewer.jsx` | Three.js integration for 3D product views. |
| `ShoppingAssistant` | `src/components/ShoppingAssistant.jsx` | AI assistant widget. |
| `RatingStars` | `src/components/RatingStars.jsx` | Star rating display. |
| `QuantityStepper` | `src/components/QuantityStepper.jsx` | +/- quantity selector. |
| `PriceBreakdown` | `src/components/PriceBreakdown.jsx` | Order total breakdown (VAT, shipping, coupon). |
| `ProductReviews` | `src/components/ProductReviews.jsx` | Review list + submission form. |
| `CheckoutSteps` | `src/components/checkout/CheckoutSteps.jsx` | Tabbed step indicator. |
| `StepDelivery/Payment/Review` | `src/components/checkout/` | Step components, passed as array. |

---

## Identified Inconsistencies

### 1. SellerDashboard Paper Variant Isolation
**File:** `src/pages/seller/SellerDashboard.jsx`  
**Issue:** Uses `.paper-console` theme with `DashboardNav variant="paper"` directly, while all other seller pages (SellerOrders, SellerProducts, SellerWallet, SellerSettings, etc.) use the standard `space-y-5 pb-8` layout with `DashboardShell`.  
**Impact:** Visual discontinuity when navigating between seller pages.  
**Fix (Phase B):** Either extend `.paper-console` to all seller pages for a consistent "Registre clair" paper theme, or normalize SellerDashboard to the standard layout. Recommend extending paper theme for brand differentiation.

### 2. Hardcoded French Strings in InventoryManagement
**File:** `src/pages/seller/InventoryManagement.jsx`  
**Issue:** Several French strings are hardcoded bypassing `t()`:
- "Aucune boutique associée à votre compte"
- "Déposer une candidature vendeur"
- "Stock faible" (may be translated, need to verify)  
**Impact:** Breaks i18n — these strings won't translate to English/Swahili when language changes.  
**Fix (Phase B):** Route all visible text through `t()` with appropriate keys.

### 3. Inline ProductCard in SellerProducts
**File:** `src/pages/seller/SellerProducts.jsx`  
**Issue:** Defines a local `ProductCard` component instead of importing the shared `src/components/ProductCard.jsx`.  
**Impact:** Visual drift risk — two ProductCard implementations can diverge.  
**Fix (Phase B):** Extract and use the shared component, or clarify if seller-specific card design is intentional (different fields needed for management vs. listing).

### 4. Status Translation Mixed Languages
**File:** `src/components/StatusBadge.jsx`  
**Issue:** `LABELS` map contains mixed French/English: most are French ("En attente", "Payé", "Confirmée"), but `SUBMITTED: 'Request submitted'`, `RESPONDED: 'Supplier responded'`, `ACCEPTED: 'Accepted'`, `DECLINED: 'Declined'`, `EXPIRED: 'Expired'` are English. Since LABELS is used as the `defaultValue` for `t()`, untranslated statuses fall back to mixed languages.  
**Impact:** Inconsistent language on status badges.  
**Fix (Phase B):** Add all status labels to i18n translation files (`src/i18n/en.js`, `src/i18n/fr.js`) for proper localization.

### 5. SellerWallet Uses Inline Classes Instead of Shared Components
**File:** `src/pages/seller/SellerWallet.jsx`  
**Issue:** Uses raw `<input>` and `<select>` with inline Tailwind classes (`className="h-11 rounded-lg border border-border bg-background px-3 text-sm"`) instead of the shared `Input` and `Select` components from `@/components/ui/*`.  
**Impact:** Minor visual consistency risk — if base input styles change, this page won't follow.  
**Fix (Phase B):** Replace with `<Input>` and `<Select>` from `@/components/ui/`.

---

## i18n / Translation Coverage

- **Languages supported:** English (`src/i18n/en.js`), French (`src/i18n/fr.js`), Swahili (`src/i18n/sw.js`), Lingala (`src/i18n/ln.js`), plus extended French (`src/i18n/fr-extended.js`).
- **i18n entry:** `src/i18n/index.js` configures react-i18next with `resources` from `src/i18n/resources.js`.
- **Usage:** Most pages properly use `const { t } = useTranslation()` and route strings through `t()`. Exception: InventoryManagement.jsx hardcoded French.
- **Status labels:** Partially translated (see #4 above).

**Status:** Good coverage. The InventoryManagement hardcoded French bug is the primary gap.

---

## Mobile Responsiveness

- **Breakpoints:** Standard Tailwind (sm=640, md=768, lg=1024, xl=1280).
- **Mobile optimizations:** `MobileActionBar` floats above `BottomNav`; checkout hides desktop grid on mobile and shows single-step wizard; hero image object-position shifts on mobile.
- **Touch targets:** `min-h-11` (44px) on buttons and links, meeting WCAG 2.1 AA.
- **Reduced motion/transparency:** Fully implemented via media queries.

**Status:** Mobile-first design is solid and consistent.

---

## Performance Considerations

- **`src/scripts/performance-monitor.js`:** Bundle analysis script with oversized chunk detection (>500KB), vendor chunk analysis, CSS file count checks, and HTML report generation.
- **Delivery budget:** ≤32MiB desktop / ≤16MiB mobile (per `docs/design/design-brief.md`).
- **Code splitting:** App uses lazy-loaded routes via `React.lazy` + `Suspense` in `src/App.jsx` with `LoadingFallback` boundary.

**Status:** Tooling exists; performance budget is defined.

---

## Tooling Confirmation

| Tool | Config | Status |
|------|--------|--------|
| ESLint | `eslint.config.js` (flat config) | ✅ Present |
| TypeScript | `jsconfig.json` | ✅ Present (typecheck via `tsc -p ./jsconfig.json`) |
| Tests | `node --test --import ./test/setup.mjs test/**/*.test.js` | ✅ Vitest-style node test |
| E2E | Playwright (`npx playwright test`) | ✅ Present |
| Build | `vite build` (Vite 8.2) | ✅ Configured |

---

## Git State

- **Current branch:** `main` (will switch to `visual-redesign` for visual work)
- **Local state:** 2 commits ahead of origin/main (`9662ce1` brand identity, `c97a30f` merge) — **unpushed**, blocked by auto-mode classifier (force-push detection on shared repo).
- **Action required:** User must run `git push origin main` manually to publish local commits.

---

## Phase B–J Roadmap (12 Design Docs)

Based on the audit, the following design docs will be produced, in order:

1. **DESIGN_SYSTEM.md** — Tokens, component conventions, spacing scale, elevation
2. **BRAND_IDENTITY.md** — AfriTrade brand (monogram, voice, motion, no-map rule)
3. **COLOR_TOKENS.md** — Full color palette with HSL values, semantic mappings
4. **TYPOGRAPHY_SYSTEM.md** — Font stack, hierarchy, responsive scale
5. **COMPONENT_LIBRARY.md** — Component inventory + usage patterns
6. **DASHBOARD_DESIGN_SPEC.md** — Seller (paper-console) + Admin design spec
7. **MOBILE_DESIGN_SPEC.md** — BottomNav, MobileActionBar, responsive patterns
8. **MOTION_GUIDELINES.md** — 150–250ms durations, easing, reduced-motion
9. **THREEJS_EXPERIENCES.md** — 3D product viewer integration
10. **ASSET_MANIFEST.md** — Logo, cover image, icon inventory
11. **VISUAL_QA_REPORT.md** — Visual regression checklist + findings
12. **ACCESSIBILITY_REPORT.md** — WCAG 2.1 AA compliance audit

---

## Recommended Phase B Actions (No Business Logic Changes)

1. **Fix InventoryManagement.jsx i18n** — Route hardcoded French strings through `t()`.
2. **Fix StatusBadge.jsx LABELS** — Add missing status translations to `en.js`/`fr.js`/`sw.js`/`ln.js`.
3. **Extract SellerProducts ProductCard** — Use shared component or document seller-specific needs.
4. **Standardize SellerWallet inputs** — Replace inline `<input>`/`<select>` with `@/components/ui/*` components.
5. **Extend paper-console theme** — Apply consistently across all seller pages OR document as intentional single-page treatment.
6. **Resolve SellerDashboard nav inconsistency** — Use `DashboardShell` with paper variant or document intentional deviation.
