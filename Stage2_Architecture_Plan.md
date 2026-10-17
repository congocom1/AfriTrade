# Stage 2 — Architecture Plan

**Target branch:** review/stage2-architecture  
**Date:** 2026-10-17
**Author:** Claude Code

## 1. Executive summary

The CongoCommerce project is a Base44-powered pan-African B2B/B2C marketplace (branded as AfriTrade) with React frontend, Flutter mobile, and extensive admin capabilities. The 16-stage directive requires staged implementation, beginning with Phase 1 (Discovery) and continuing through Stage 2 (Architecture) incrementally.

This document captures the architecture approach for Stage 2: designing the commerce platform architecture, data layer, and integration patterns while remaining in discovery to inform implementation phases.

## 2. High-level architecture

### 2.1 System overview

**Frontend:** React 18 + Vite SPA, TypeScript, Tailwind CSS, Radix UI, framer-motion
- Lazy-loaded route bundles with TanStack Query
- Multi-tenant routing (/admin/*, /seller/*, /warehouse, /finance, etc.)
- French/English i18n with react-i18next (Lingala, Kiswahili fallback)
- Base44 SDK client for API calls

**Backend:** Base44 platform (Deno runtime)
- Entities: 50+ types (Order, Product, Wallet, Tenant, etc.)
- Functions: 50+ business logic handlers
- RLS policies for tenant isolation
- Deno-based runtime with persistent storage

**Mobile:** Flutter app in `/lib/` with providers, models, repositories
- Separate codebase but shares same business logic patterns

### 2.2 Key architectural decisions

**Tenant isolation:** Base44 entities with Row Level Security (RLS) policies
- Each tenant (brand/merchant) has isolated data
- `base44/entities/Tenant` and `base44/entities/TenantMember` manage relationships

**Authentication & authorization:**
- Base44 auth with user.role (admin/seller)
- Custom permissions matrix in `src/lib/permissions.js`
- Server-side privilege checks in `base44/shared/security.ts`

**Security:**
- CSP, HSTS, rate limiting in `base44/shared/securityHeaders.ts`
- HTML escaping in `base44/shared/security.ts`
- Audit logging via `base44/entities/AuditLog`

**Event-driven architecture:**
- `base44/shared/events.ts` defines EVENT_RULES
- Integration between payment, fulfillment, and notification flows

## 3. Core modules and data flow

### 3.1 Commerce engine

**Primary module:** `src/lib/orderService.js`
- `placeOrder()` - creates orders and initiates payment
- `advanceFulfillment()` - moves orders through fulfillment flow
- `courierUpdateShipment()` - tracks shipment status
- `buildCheckoutQuote()` - pricing and cart logic
- `loadCartLines()` - retrieves customer cart

**Business rules in:**
- `src/lib/config.js` - platform pricing and country config
- `src/lib/pricing.js` - pricing calculations
- `src/lib/tax.js` - VAT and tax logic

### 3.2 Logistics & fulfillment

**Module:** `src/lib/logistics.js`
- `COURIER_PROVIDERS` - available shipping services
- `SHIPMENT_STATUS_FLOW` - state machine for shipments
- `INTL_TRACKING_FLOW` - international shipping logic
- `selectCourierFor()` - provider selection based on route

### 3.3 Wallet & payments

**Module:** `base44/shared/walletLedger.ts`
- Atomic wallet balance updates with preparation workflow
- Idempotency key enforcement
- Held-funds mechanism for payment processing

**Functions:**
- `settle-wallet-payout` - release held funds to sellers
- `request-withdrawal` - external payout processing
- `payments-webhook` - payment provider webhook processing

## 4. Route and layout architecture

### 4.1 Route hierarchy

**AppLayout.jsx** (components/layout/AppLayout.jsx)
- TopBar, BottomNav drawer, LegalFooter
- Tenant branding via `applyTenantBranding()`

**DashboardShell.jsx** (components/layout/DashboardShell.jsx)
- Admin-only layouts
- DashboardNav for navigation between admin sections

**ProtectedRoute.jsx** (components/ProtectedRoute.jsx)
- Login requirement enforcement
- Role-based access control

### 4.2 Navigation structure

**Admin navigation:** `src/lib/navLinks.js` → ADMIN_LINKS (47 items)
**Seller navigation:** SELLER_LINKS (23 items)

**Key admin sections:**
- `/admin` - dashboard (GMV, revenue KPIs)
- `/warehouse` - inventory management
- `/finance` - financial operations
- `/logistics-hub` - logistics oversight
- `/backoffice` - super-admin functions

## 5. Data management patterns

### 5.1 TanStack Query

**Client:** `src/lib/query-client.js`
- Query caching and server state management
- Invalidations for data consistency
- Concurrent reads for optimal UX

### 5.2 Entity patterns

**Base44 entity structure:**
- All entities defined in `base44/.types/types.d.ts`
- CRUD operations via Base44 SDK
- RLS policies for security

**Entity examples:**
- `Order` - order lifecycle
- `FulfillmentOrder` - shipment tracking
- `Wallet` and `WalletTransaction` - financial tracking
- `AuditLog` - immutable audit trail

## 6. Integration patterns

### 6.1 Event system

**base44/shared/events.ts**
- Defines EVENT_RULES for system events
- `planForEvent()` - determines event handling
- `buildNotifications()` - notification generation

**Key events:**
- `order_placed`, `order_paid`, `fulfillment_status_changed`
- `payout_released`, `product_published`, `seller_applied`

### 6.2 Third-party integrations

**WIX_CHECKOUT_API_KEY** - checkout processing
**MAISHAPAY_* keys** - payment processing
**Webhooks** - payment provider callbacks

### 6.3 Mobile integration

**Flutter app** (`/lib/`):
- Shared business logic
- Separate UI implementation
- Platform-specific features

## 7. Security architecture

### 7.1 Trust boundaries

**requireAdmin()** (base44/shared/app.ts)
- Server-side admin privilege verification
- Prevents client-side bypass

**Security headers:**
- CSP, HSTS, X-Frame-Options in `vite.config.js` (dev only)
- Missing production header controls (open risk P1-02)

### 7.2 Access control matrix

**Roles:** TENANT_ADMIN, FINANCE_ADMIN, SUPPORT, SELLER, CREATOR, COURIER

**Permissions:** PRODUCT_CREATE, ORDER_READ, REFUND_CREATE, etc.

**Implementation:** `src/lib/permissions.js`
- `can(permission, permissions)` helper
- Role-based access in UI components

## 8. Testing and deployment

### 8.1 Testing strategy

**Unit tests:** `test/**/*.test.js`
- Wallet ledger tests (182 passing, 2 TODO)
- Payment security tests
- I18n and localization tests

**E2E tests:** `test/e2e/smoke.spec.js`
- Playwright-based smoke tests
- AfriTrade branding assertions

### 8.2 Deployment considerations

**Current status:**
- Staging smoke tests not yet run (STAGING_BASE_URL not configured)
- Production security headers not deployed (P1-02)
- CI/CD pipeline not implemented (P1-03)

**Release gates:**
- Wallet protocol gates in `docs/audit/WALLET_PROTOCOL.md`
- Payment webhook signature validation (P0-01)
- Security headers deployment (P1-02)

## 9. Implementation priorities

### 9.1 Critical (P0)

1. **Payment webhook signature validation** - prevent replay attacks
2. **Wallet concurrency fixes** - prevent double-spending
3. **Privilege escalation audits** - secure role management

### 9.2 High (P1)

1. **Brand standardization** - archive legacy Congo Commerce docs
2. **Security headers production** - deploy CSP/HSTS/X-Frame-Options
3. **CI/CD pipeline** - automated testing and deployment
4. **Secrets inventory** - document and rotate credentials

### 9.3 Medium (P2)

1. **Large JS chunks** - optimize mobile performance
2. **Legacy audit docs** - archive to `docs/archive/`
3. **Flutter parity** - verify mobile/web alignment

## 10. Next steps for this stage

**Architecture artifacts to produce:**
1. Detailed data flow diagrams
2. Component interaction maps
3. Security requirement validation

**Immediate tasks:**
1. Archive legacy docs to `docs/archive/`
2. Update all Congo Commerce references to AfriTrade
3. Document production header configuration requirements
4. Create CI/CD pipeline skeleton
5. Verify Flutter parity with `flutter analyze`

**Architecture validation:**
- Review current implementation against planned architecture
- Identify gaps and architectural debt
- Document refactoring priorities

## 11. Risk assessment

**High confidence areas:**
- Core route structure
- Authentication patterns
- Tenant isolation concept

**Moderate confidence:**
- Wallet concurrency fixes
- Production deployment
- CI/CD implementation

**Low confidence:**
- Mobile parity
- Performance optimization
- Complex integration points

## 12. Documentation

**Created:** 2026-10-17
**Updated:** 2026-10-17

**References:**
- `docs/audit/FULL_AUDIT.md`
- `docs/audit/WALLET_PROTOCOL.md`
- `docs/audit/PRODUCTION_HARDENING.md`
- `docs/audit/REMEDIATION_LOG.md`

**Team notes:**
- Keep architecture document live and updated
- Review every 2 weeks for alignment with implementation
- Maintain traceability between architectural decisions and implementation

---

**End of Stage 2 Architecture Plan**