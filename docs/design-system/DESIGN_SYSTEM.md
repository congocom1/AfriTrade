# Design System

## Overview
The CongoCommerce/AfriTrade marketplace visual design system provides a comprehensive foundation for the user interface, ensuring consistency, accessibility, and scalability across all marketplace pages and components.

## Design Tokens

### Color System
Based on Tailwind CSS custom properties with the `.paper-console` theme applied to seller dashboards:

- **Primary Colors**: Brand-specific color palette for AfriTrade
- **Semantic Colors**: Success, warning, error, info states
- **Surface Colors**: Background, card, popover, tooltip backgrounds
- **Text Colors**: Primary, secondary, muted, accent text

### Typography System
Font stack hierarchy:
- **Headings**: Inter, sans-serif family
- **Body Text**: Inter, sans-serif family  
- **Code/Mono**: JetBrains Mono for code snippets
- **Scales**: 12px, 14px, 16px, 18px, 24px, 32px, 48px

### Spacing Scale
Tailwind CSS utility-first approach with spacing scale:
- **Base Unit**: 4px
- **Small**: 8px, 12px, 16px
- **Medium**: 24px, 32px, 40px
- **Large**: 48px, 64px, 96px, 128px

### Elevation
Shadow system:
- **Level 1**: 0px 1px 3px rgba(0,0,0,0.12)
- **Level 2**: 0px 4px 6px rgba(0,0,0,0.12)
- **Level 3**: 0px 10px 15px rgba(0,0,0,0.10)
- **Level 4**: 0px 20px 25px rgba(0,0,0,0.10)

## Component Library

### DashboardShell
Shared wrapper for admin and seller dashboards with:
- Consistent vertical rhythm (space-y-5 pb-8)
- Role-based navigation (DashboardNav)
- Paper variant support (`variant="paper"`) for SellerDashboard
- Responsive layout container

### SellerProductCard
Seller-specific product card with management features:
- Edit, toggle publish/archive, delete functionality
- B2B product information display
- Status badges and inventory indicators
- Consistent with shared ProductCard patterns

### Navigation Components
- **DashboardNav**: Primary navigation with role-based links
- **StatusBadge**: Standardized status indicators with i18n support
- **Input/Select**: shadcn/ui form components

## Component Conventions

### Structure
1. **Container Components**: Provide semantic HTML structure
2. **Presentational Components**: Focus on styling and layout
3. **Functional Components**: Handle user interactions and state

### Naming Patterns
- **kebab-case** for className props
- **CamelCase** for component names
- **UPPER_SNAKE_CASE** for constants and enums

### Composition Patterns
- Use Tailwind CSS utilities over custom styles
- Leverage Radix UI primitives for accessibility
- Implement responsive design with Tailwind breakpoints

## Layout Patterns

### Dashboard Layout
```
DashboardShell
├── DashboardNav (variant="paper" for sellers)
└── Page Content (dynamic per role)
```

### Product Management
```
SellerProductCard
├── Product Image
├── Product Info
├── Action Buttons (edit, publish, delete)
└── B2B-specific fields
```

## State Management

### Visual States
- **Hover**: `hover:bg-secondary` on interactive elements
- **Focus**: `focus:outline-none focus:ring-2 focus:ring-primary`
- **Disabled**: `opacity-50 cursor-not-allowed`
- **Loading**: `animate-pulse` for async states

### i18n Integration
- All user-facing strings use `t('namespace.key')` translation keys
- Namespace structure: `nav.*`, `common.*`, `auth.*`, `dashboard.*`, `inventoryManagement.*`
- Context-aware translations based on user role and locale

## Motion Guidelines

### Duration
- **Immediate**: 0ms (no transition)
- **Quick**: 150ms - 250ms
- **Smooth**: 300ms - 500ms
- **Complex**: 800ms - 1000ms

### Easing
- **Ease In Out**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Standard**: `ease-in-out`
- **Sharp**: `cubic-bezier(0.4, 0, 0.6, 1)`

### Reduced Motion
All motion respects `prefers-reduced-motion` media query with `reduce("motion")` via Tailwind

## Accessibility

### ARIA Standards
- **Semantic HTML5** for structure
- **ARIA roles** for interactive elements
- **ARIA labels** for icon-only buttons
- **Keyboard navigation** support for all interactive components

### Screen Reader Support
- **Focus management** for modal dialogs
- **Live regions** for dynamic content updates
- **Color contrast** meeting WCAG AA standards
- **Font sizing** respect for zoom functionality

## Responsive Design

### Breakpoints
- **Mobile**: <768px (single column)
- **Tablet**: 768px-1024px (two columns)
- **Desktop**: >1024px (multi-column)

### Responsive Patterns
- **Flexbox** for fluid layouts
- **Grid system** for complex arrangements
- **Container queries** for component responsiveness
- **Touch targets** minimum 44px

## Quality Standards

### Code Quality
- **ESLint validation** with flat config
- **TypeScript** for type safety
- **Vitest** for unit testing
- **Playwright** for E2E testing

### Visual Consistency
- **Design tokens** used consistently
- **Component library** maintained
- **Theme system** applied across all pages
- **Brand integrity** preserved

### Performance
- **Tree shaking** for bundle optimization
- **Code splitting** for lazy loading
- **Image optimization** via next/image
- **Critical CSS** inlined for above-the-fold

## Documentation
This design system is documented in the Phase C-J design documentation series:
- DESIGN_SYSTEM.md (this document)
- BRAND_IDENTITY.md
- COLOR_TOKENS.md
- TYPOGRAPHY_SYSTEM.md
- COMPONENT_LIBRARY.md
- DASHBOARD_DESIGN_SPEC.md
- MOBILE_DESIGN_SPEC.md
- MOTION_GUIDELINES.md
- THREEJS_EXPERIENCES.md
- ASSET_MANIFEST.md
- VISUAL_QA_REPORT.md
- ACCESSIBILITY_REPORT.md

## Version Control
All design system changes tracked in git with proper commit messages and co-authored attribution.

---

*This design system serves as the foundation for the CongoCommerce/AfriTrade marketplace visual redesign, ensuring consistency across all user interfaces while maintaining brand integrity and accessibility standards.*