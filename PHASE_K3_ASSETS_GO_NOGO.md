# Phase K.3 (Assets) — Go/No-Go Recommendation

**Date:** 2026-10-18
**Branch:** `visual-redesign` (commit `c388601`)
**Recommendation:** **GO — proceed with Phase K.3 (Assets)**

---

## Summary

The Phase K.3 Assets phase is a natural next step following the completed Phase K.2 Visual QA & Validation. The codebase has a mature design system (paper theme tokens + Tailwind config), lint/typecheck/e2e all passing, and the site is live at https://afritrade-1.base44.app. Assets already exist in `public/` (brand, fonts, icons, images) and a design-system doc foundation exists under `docs/design-system/`. There are no hard blockers to starting K.3.

---

## Current Asset State (verified)

### What exists and is wired up

| Asset type | Location | Status |
|---|---|---|
| Brand/logos | `public/brand/` | ✅ Complete — favicon set, SVG logos, PNG icons (192/512/maskable), apple-touch-icon |
| Fonts | `public/fonts/` | ✅ Sora, Manrope, JetBrains Mono (`.woff2`) referenced in `src/index.css` |
| Icons | `public/icons/` | ✅ PNG icons + SVGs |
| Images | `public/images/` | ✅ Category/product SVGs + raster images |
| Web app manifest | `public/site.webmanifest` | ✅ Present; **fixed** wrong `/assets/brand/` → `/brand/` icon paths (commit `c388601`) |
| OG image | `public/brand/og.png` | ✅ 400 KB social image |

### What `docs/design-system/` already documents

- `BRAND_IDENTITY.md` — brand voice, color psychology, typography, shape language, usage guidelines
- `ASSET_MANIFEST.md` — single source of truth for all brand/design assets (logos, colors, typography, icons, images, animations, audio, Three.js models)
- `COMPONENT_LIBRARY.md` — component inventory

These give K.3 a solid documentation foundation to build on.

### Gaps worth addressing in K.3

1. **`site.webmanifest` had broken icon paths** — referenced `/assets/brand/` which does not exist; actual files are served at `/brand/`. Fixed in commit `c388601` and redeployed.
2. **`assets/` directory is mostly empty** — `assets/icons/` and `assets/images/` contain only `.gitkeep`; `assets/brand/` doesn't exist. All real assets live in `public/`. The `ASSET_MANIFEST.md` doc references paths under `assets/` (e.g. `assets/brand/logo-primary.svg`, `assets/fonts/Inter-Regular.woff2`) that don't match the actual `public/` layout.
3. **No image optimization pipeline** — `public/images/` contains several ~2 MB raster images with no WebP/AVIF conversion or responsive breakpoints configured in Vite.
4. **No font subsetting/preloading** beyond what's in CSS; the brand doc recommends preload but it isn't implemented.

---

## Recommended K.3 Scope

| Item | Priority | Rationale |
|---|---|---|
| Audit `public/` assets vs. `ASSET_MANIFEST.md` paths; reconcile doc ↔ reality | High | Doc references non-existent `assets/` paths; actual assets are in `public/` |
| Optimize `public/images/` rasters (WebP/AVIF + responsive sizes) | Medium | Several ~2 MB images impact mobile performance (noted in systematic plan P2-01) |
| Add font preload for critical fonts (Sora/Manrope) | Low | Already referenced in CSS; easy win for LCP |
| Verify all manifest/favicon icons resolve on the live site | Medium | Just fixed one broken path; worth a sweep |

---

## Risks

- **Low.** Assets are additive — none of this touches the design-system tokens, routes, or backend functions already deployed.
- The only production issue found during K.2 (WCAG contrast 4.43:1) is fixed and verified at 0 axe violations on both `/seller` and `/`.
- `assets/` being empty vs. `public/` being populated is a documentation/organization inconsistency, not a functional blocker.

---

## Success criteria for K.3 (suggested)

1. `ASSET_MANIFEST.md` paths match actual `public/` file locations (reconcile `assets/` → `public/`).
2. All raster images in `public/images/` have optimized WebP variants; no single image >500 KB without justification.
3. Live site PWA manifest icons all return HTTP 200 (verify `/brand/icon-192.png`, `/brand/icon-512.png`, etc.).
4. Lint + typecheck + build + e2e all still pass after asset changes.

---

## Verdict

**GO.** Phase K.3 can proceed immediately. No blockers, no pending approvals needed for the asset work itself. The design system is stable, the site is deployed, and the accessibility audit is green. Start with reconciling `ASSET_MANIFEST.md` to the real `public/` layout, then image optimization.
