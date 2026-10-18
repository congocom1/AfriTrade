# Typography System

## Overview
Typography system defines the complete font hierarchy and text styling standards for AfriTrade marketplace, ensuring readability, accessibility, and brand consistency across all user interfaces.

## Font Stack Architecture

### Primary Typography Stack
```css
font-family:
  'Inter',                          /* Primary interface font */
  'system-ui',                      /* System default */
  'Segoe UI',                       /* Windows */
  'Roboto',                         /* Android */
  'Helvetica Neue',                 /* macOS */
  'Arial',                          /* Fallback */
  sans-serif;
```

### Code/Technical Font Stack
```css
font-family:
  'JetBrains Mono',                 /* Code and technical text */
  'Consolas',                       /* Windows */
  'Courier New',                    /* Classic */
  monospace;
```

## Type Scale & Hierarchy

### Responsive Type Scale
Based on 4px grid system with breakpoints:

| Size | Mobile (px) | Tablet (px) | Desktop (px) | Usage |
|------|-------------|-------------|--------------|-------|
| H1 | 32 | 48 | 64 | Main headings, page titles |
| H2 | 28 | 36 | 48 | Section headers |
| H3 | 24 | 32 | 40 | Subsection headers |
| H4 | 20 | 24 | 32 | Card headers |
| Body Large | 18 | 20 | 22 | Large body text |
| Body Regular | 16 | 18 | 20 | Standard body text |
| Body Small | 14 | 16 | 18 | Small body text |
| Caption | 12 | 14 | 16 | Captions, metadata |
| Label | 14 | 16 | 18 | Form labels, buttons |

### Font Weights

| Weight | CSS Value | Use Case |
|--------|-----------|----------|
| Thin | 100 | Decorative, special emphasis |
| Extra Light | 200 | Light text, subtle elements |
| Light | 300 | Secondary text, descriptions |
| Regular | 400 | Body text, standard content |
| Medium | 500 | Labels, highlights |
| Semi Bold | 600 | Important text, headers |
| Bold | 700 | Main headings, emphasis |
| Extra Bold | 800 | Large emphasis, branding |
| Black | 900 | Maximum emphasis, branding |

## Typography Specifications

### Heading Hierarchy

#### H1 - Page Titles
```css
h1 {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: clamp(32px, 5vw, 64px);
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  margin: 0 0 1rem 0;
}
```

#### H2 - Section Headers
```css
h2 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
  margin: 0 0 0.75rem 0;
}
```

#### H3 - Subsection Headers
```css
h3 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: clamp(24px, 3vw, 40px);
  line-height: 1.4;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}
```

### Body Text Standards

#### Large Body (18px/20px)
```css
.body-large {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: clamp(18px, 2.5vw, 22px);
  line-height: 1.6;
  color: var(--color-text-primary);
}
```

#### Regular Body (16px/18px)
```css
.body-regular {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: clamp(16px, 2vw, 20px);
  line-height: 1.6;
  color: var(--color-text-primary);
}
```

#### Small Body (14px/16px)
```css
.body-small {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: clamp(14px, 1.5vw, 18px);
  line-height: 1.6;
  color: var(--color-text-secondary);
}
```

### Specialized Typography

#### Labels
```css
.label {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: clamp(14px, 1.5vw, 18px);
  line-height: 1.5;
  color: var(--color-text-primary);
  text-transform: none;
  letter-spacing: normal;
}
```

#### Captions
```css
.caption {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: clamp(12px, 1.2vw, 16px);
  line-height: 1.5;
  color: var(--color-text-tertiary);
}
```

#### Technical/Code Text
```css
.code, .technical {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-text-primary);
}
```

## Typography Rules & Guidelines

### Line Height System
```css
/* Typography scale with optimal line heights */
.typography-scale {
  --lh-tight: 1.2;    /* Headings */
  --lh-base: 1.6;     /* Body text */
  --lh-loose: 1.8;    /* Long-form content */
  --lh-condensed: 1.3; /* Compact layouts */
}
```

### Letter Spacing
```css
/* Responsive letter spacing */
.typography-spacing {
  --ls-normal: normal;
  --ls-tight: -0.02em;
  --ls-expanded: 0.02em;
}
```

### Text Alignment
```css
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }
```

### Text Decoration
```css
.text-underline { text-decoration: underline; }
.text-line-through { text-decoration: line-through; }
.text-no-underline { text-decoration: none; }
```

## Typography Component Integration

### Dashboard Components
```css
/* Dashboard header typography */
.dashboard-header {
  h1 { @apply body-large font-bold; }
  p { @apply body-small text-tertiary; }
}

/* Card typography */
.card-content {
  .card-title { @apply h4 font-semibold; }
  .card-description { @apply body-small; }
}
```

### Navigation Typography
```css
/* Nav labels */
.nav-label {
  @apply label font-medium;
}

/* Nav descriptions */
.nav-description {
  @apply caption;
}
```

### Form Typography
```css
/* Input labels */
.form-label {
  @apply label font-medium;
}

/* Input helper text */
.form-help {
  @apply caption text-tertiary;
}

/* Error messages */
.form-error {
  @apply caption text-error-600;
}
```

## Accessibility Compliance

### Minimum Font Sizes
```css
/* WCAG 2.1 AA compliance */
.accessible-text {
  /* Regular text must be at least 16px */
  font-size: 16px;
  line-height: 1.5;
}

/* Large text (18px+) */
.accessible-large {
  font-size: 18px;
  line-height: 1.5;
}
```

### Color Contrast
```css
/* Ensure sufficient contrast */
.accessible-text {
  color: var(--color-text-primary);
  /* Contrast ratio: 6.62:1 on white background */
}

.accessible-secondary {
  color: var(--color-text-secondary);
  /* Contrast ratio: 4.51:1 on white background */
}
```

### Focus Indicators
```css
/* Keyboard navigation support */
.focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

## Responsive Typography

### Fluid Typography Implementation
```css
/* Fluid type using clamp() */
.fluid-heading {
  font-size: clamp(24px, 4vw, 48px);
  line-height: 1.3;
}

.fluid-body {
  font-size: clamp(16px, 2vw, 20px);
  line-height: 1.6;
}
```

### Breakpoint-Specific Typography
```css
/* Mobile first approach */
.typography-scale {
  @media (min-width: 768px) {
    /* Tablet styles */
    h1 { font-size: 48px; }
    h2 { font-size: 36px; }
  }
  
  @media (min-width: 1024px) {
    /* Desktop styles */
    h1 { font-size: 64px; }
    h2 { font-size: 48px; }
  }
}
```

## Typography Tools & Testing

### Typography Testing Utilities
```javascript
// Typography consistency checker
function validateTypographyScale() {
  // Checks font sizes, weights, and spacing consistency
}

// Accessibility validator
function checkTypographyAccessibility() {
  // Verifies WCAG compliance
}

// Cross-browser compatibility checker
function validateCrossBrowser() {
  // Ensures consistent rendering
}
```

### Typography Validation
- **Font loading validation**: Checks custom font injection
- **Fallback testing**: Validates fallback font chain
- **Render testing**: Cross-browser and device testing
- **Performance monitoring**: Font loading and rendering metrics

## Typography Documentation Structure
This typography system supports:
- **DESIGN_SYSTEM.md** - Typography system overview
- **BRAND_IDENTITY.md** - Typography brand applications
- **TYPOGRAPHY_SYSTEM.md** - This comprehensive guide
- **COMPONENT_LIBRARY.md** - Component typography usage
- **DASHBOARD_DESIGN_SPEC.md** - Dashboard typography specs
- **MOBILE_DESIGN_SPEC.md** - Mobile typography adaptations

## Dependencies
Typography system depends on:
- **CSS custom properties** for responsive scaling
- **Font loading optimization** for performance
- **Accessibility testing frameworks**
- **Cross-browser validation tools**
- **Performance monitoring**

---

*This typography system provides the comprehensive foundation for AfriTrade marketplace text design, ensuring readability, accessibility, and consistent brand application across all user interfaces.*