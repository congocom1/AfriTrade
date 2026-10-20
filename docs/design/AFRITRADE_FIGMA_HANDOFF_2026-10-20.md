# AfriTrade — Figma design handoff (20 October 2026)

**Design owner:** Michel Buki, Chairman  
**Source repository:** `congocom1/AfriTrade` (`main`)  
**Figma workspace:** https://www.figma.com/design/kS6Zazipusavm0TrELQkTC  
**Repository-aligned desktop design:** https://www.figma.com/design/kS6Zazipusavm0TrELQkTC?node-id=35-2  
**Repository-aligned mobile design:** https://www.figma.com/design/kS6Zazipusavm0TrELQkTC?node-id=35-36  
**Apple-inspired conceptual exploration:** https://www.figma.com/design/kS6Zazipusavm0TrELQkTC?node-id=21-2

## Source-of-truth principle

Figma is a **design reference**, not executable application code. This commit registers the design handoff and implementation specification; it does not pretend that Figma frames were converted into React components or deployed.

Use the existing components and architecture:
- `src/pages/Home.jsx`: marketplace home; product rows, category discovery, flash sales, seller/creator features, local and international inventory, network retry and empty/loading states.
- `src/components/layout/AppLayout.jsx`: `TopBar`, `BottomNav`, tenant-aware branding and `LegalFooter`.
- `src/App.jsx`: buyer, seller, admin, courier, supplier, warehouse, finance, support and developer routes.
- `src/index.css`: CSS semantic tokens and current brand classes; preserve themes and accessibility behavior.
- `README.md` and `AGENTS.md`: development workflow and release gates.

## Visual system

Prioritize the repository's identity over generic mockup palettes:
- Headings: **Sora**.
- Body text: **Manrope**.
- Technical labels: **JetBrains Mono**.
- Warm paper backgrounds, deep forest hero, green/emerald primary actions.
- Maintain dark-mode token parity and adequate contrast.
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency`.
- Responsive breakpoints: mobile 390 px, tablet 834 px, desktop 1440 px reference frames (not exclusive device sizes).
- Mobile: consistent bottom navigation; no duplicate back buttons; 44px minimum targets.

## Key screens and flows to implement or reconcile

| Surface | Repository-driven design requirement |
| --- | --- |
| Home & discovery | Categories, flash sale, trending, featured, local & international items, seller cards, creator showcase |
| Customer | Search, product detail, cart, checkout, orders, invoices, tracking, profile, dispute center, support |
| Seller | Seller portal/dashboard, products, orders, quotes, inventory, messages and reports |
| Supplier | Purchase-order readiness, fulfillment and China warehouse handoff |
| China warehouse | Parcel intake, QR labels, photos, measurements and consolidation |
| Logistics | Rate quotes, shipping configuration, air/sea shipment events, exceptions and courier operations |
| Admin | Users, products, suppliers, order controls, billing, compliance, tenants, roles and audit activity |
| Finance | Invoices, reconciliation, payouts, disputes, fraud and available payment methods |
| Platform | Tenant isolation, notifications, localization, accessibility and integration status |

Do **not** present disabled wallet refunds as available. The repository's `README.md` describes an intentional HTTP 503 safety block pending wallet protocol validation. Any finance UI must reflect this.

## Implementation acceptance criteria

1. Compare Figma frames to the *running* Base44-linked application, rather than assuming visual sketches match production.
2. Preserve actual routes, authentication, role permissions, tenant boundaries and data contracts.
3. Use existing reusable React/Radix components and semantic HSL CSS variables; avoid parallel one-off widgets and hard-coded palettes.
4. Implement mobile, tablet and desktop behavior without overflow; test navigation, loading, empty, offline, error and unauthorized states.
5. Validate keyboard focus, labels, contrast, screen reader basics and reduced-motion behavior.
6. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and configured Playwright/Flutter checks where available.
7. Start the local full stack with `base44 dev`, not standalone `npm run dev` when the local backend is required.
8. Do not remove wallet safeguards, deploy to production or modify financial functionality without separate validation and approval.

## Scope of this handoff

**Committed:** implementation reference, source mappings, review checklist, Figma links.

**Not committed:** generated Figma source, screenshots, frontend implementation, changed Base44 functions, production deployment.

The design remains editable in Figma. Engineering updates should be implemented and reviewed in separate code PRs.
