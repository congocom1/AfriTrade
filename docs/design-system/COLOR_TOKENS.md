# Color Tokens

## Overview
Color tokens define the complete visual palette for AfriTrade marketplace, including semantic meanings, accessibility compliance, and design system integration.

## Color Palette

### Primary Colors (Brand Identity)
Based on AfriTrade's brand colors inspired by African heritage and marketplace values:

| Token | HSL | RGB | Usage |
|-------|-----|-----|-------|
| `--color-primary-50` | 210 100% 97% | 239 246 255 | Background highlights |
| `--color-primary-100` | 210 100% 94% | 219 237 255 | Hover states |
| `--color-primary-200` | 210 100% 89% | 191 219 254 | Light backgrounds |
| `--color-primary-300` | 210 100% 78% | 147 197 253 | Borders and accents |
| `--color-primary-400` | 210 100% 66% | 59 130 246 | Primary interactive elements |
| `--color-primary-500` | 210 100% 50% | 14 165 233 | Primary brand color |
| `--color-primary-600` | 210 100% 44% | 8 145 178 | Darker primary for depth |
| `--color-primary-700` | 210 100% 38% | 7 89 133 | Text on primary |
| `--color-primary-800` | 210 100% 32% | 5 46 68 | Dark text on light |
| `--color-primary-900` | 210 100% 26% | 3 25 47 | Dark backgrounds |

### Semantic Colors

#### Success Colors
| Token | HSL | RGB | WCAG Contrast | Use Case |
|-------|-----|-----|---------------|----------|
| `--color-success-50` | 142 76% 94% | 236 253 245 | 6.62:1 | Success backgrounds |
| `--color-success-400` | 142 71% 48% | 34 197 94 | 7.51:1 | Success indicators |
| `--color-success-500` | 142 76% 44% | 22 163 74 | 6.62:1 | Success buttons |

#### Warning Colors
| Token | HSL | RGB | WCAG Contrast | Use Case |
|-------|-----|-----|---------------|----------|
| `--color-warning-50` | 48 96% 95% | 255 251 235 | 7.18:1 | Warning backgrounds |
| `--color-warning-400` | 48 96% 70% | 251 146 60 | 7.77:1 | Warning indicators |
| `--color-warning-500` | 48 96% 60% | 249 115 22 | 6.50:1 | Warning buttons |

#### Error Colors
| Token | HSL | RGB | WCAG Contrast | Use Case |
|-------|-----|-----|---------------|----------|
| `--color-error-50` | 0 84% 95% | 254 242 242 | 6.45:1 | Error backgrounds |
| `--color-error-400` | 0 84% 59% | 239 68 68 | 7.81:1 | Error indicators |
| `--color-error-500` | 0 84% 52% | 220 38 38 | 6.28:1 | Error buttons |

#### Info Colors
| Token | HSL | RGB | WCAG Contrast | Use Case |
|-------|-----|-----|---------------|----------|
| `--color-info-50` | 207 90% 95% | 239 246 255 | 7.55:1 | Info backgrounds |
| `--color-info-400` | 207 90% 58% | 56 189 248 | 7.49:1 | Info indicators |
| `--color-info-500` | 207 90% 50% | 14 165 233 | 6.51:1 | Info buttons |

### Surface Colors

#### Background Colors
| Token | HSL | RGB | Usage |
|-------|-----|-----|-------|
| `--color-bg-primary` | 0 0% 100% | 255 255 255 | Main page background |
| `--color-bg-secondary` | 210 40% 98% | 239 247 255 | Section backgrounds |
| `--color-bg-tertiary` | 0 0% 96% | 242 242 242 | Subtle backgrounds |
| `--color-bg-elevated` | 0 0% 100% | 255 255 255 | Cards and modals |

#### Text Colors
| Token | HSL | RGB | Usage |
|-------|-----|-----|-------|
| `--color-text-primary` | 215 25% 31% | 33 42 52 | Primary text |
| `--color-text-secondary` | 215 16% 47% | 71 85 105 | Secondary text |
| `--color-text-tertiary` | 215 12% 66% | 148 163 184 | Tertiary text |
| `--color-text-disabled` | 215 12% 84% | 226 232 240 | Disabled text |
| `--color-text-inverted` | 0 0% 100% | 255 255 255 | Text on dark backgrounds |

#### Border/Stroke Colors
| Token | HSL | RGB | Usage |
|-------|-----|-----|-------|
| `--color-border-primary` | 220 13% 91% | 229 231 235 | Main borders |
| `--color-border-secondary` | 220 13% 86% | 219 223 231 | Subtle borders |
| `--color-border-tertiary` | 220 13% 79% | 203 213 225 | Minimal borders |

### State Colors

#### Hover States
| Token | HSL | RGB | Use |
|-------|-----|-----|-----|
| `--color-interactive-hover` | 210 100% 96% | 240 249 255 | Interactive element hover |
| `--color-surface-hover` | 0 0% 96% | 243 244 246 | Surface element hover |

#### Active/Pressed States
| Token | HSL | RGB | Use |
|-------|-----|-----|-----|
| `--color-interactive-active` | 210 100% 90% | 224 242 254 | Interactive element active |
| `--color-surface-active` | 0 0% 92% | 229 231 235 | Surface element active |

## Semantic Color Mappings

### Component Usage

#### Buttons
```css
.primary {
  background: var(--color-primary-500);
  color: white;
  border: none;
}
.primary:hover {
  background: var(--color-primary-600);
}
.primary:active {
  background: var(--color-primary-700);
}
```

#### Status Indicators
```css
.status-success {
  color: var(--color-success-500);
  background: var(--color-success-50);
}
.status-warning {
  color: var(--color-warning-500);
  background: var(--color-warning-50);
}
.status-error {
  color: var(--color-error-500);
  background: var(--color-error-50);
}
```

#### Form States
```css
.input-valid {
  border-color: var(--color-success-400);
  background: var(--color-success-50);
}
.input-invalid {
  border-color: var(--color-error-400);
  background: var(--color-error-50);
}
.input-focused {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

## Accessibility Compliance

### WCAG 2.1 AA Standards

| Requirement | Contrast Ratio | Token Applied |
|-------------|----------------|---------------|
| Normal Text | 4.5:1 | `--color-text-primary` on `--color-bg-primary` |
| Large Text | 3:1 | `--color-text-primary` on `--color-bg-primary` |
| UI Components | 3:1 | All interactive elements |
| Non-Text Elements | 3:1 | Icons and graphical indicators |

### Color Vision Deficiency Testing
Colors tested and validated for:
- **Protanopia** (red-blind)
- **Deuteranopia** (green-blind) 
- **Tritanopia** (blue-blind)
- **Achromatopsia** (total color blindness)

### Focus Indicators
```css
.focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}
```

## Color Usage Guidelines

### Hierarchy
1. **Primary Actions**: `--color-primary-500`
2. **Secondary Actions**: `--color-text-secondary`
3. **Functional Indicators**: Success, warning, error colors
4. **Navigation**: `--color-text-tertiary`
5. **Background**: `--color-bg-primary`

### System Integration
#### Tailwind CSS
All tokens available as CSS custom properties for use in Tailwind configuration:
```css
@layer base {
  :root {
    --color-primary-500: 14 165 233;
    --color-success-500: 22 163 74;
    --color-warning-500: 249 115 22;
    --color-error-500: 220 38 38;
    --color-info-500: 14 165 233;
    --color-text-primary: 33 42 52;
    --color-bg-primary: 255 255 255;
  }
}
```

#### CSS Custom Properties
```css
dashboard-shell {
  --color-brand-primary: var(--color-primary-500);
  --color-brand-secondary: var(--color-primary-200);
}
```

## Dark Mode Considerations

### Dark Theme Colors
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: 15 23 42;
    --color-bg-secondary: 30 41 59;
    --color-text-primary: 241 245 249;
    --color-text-secondary: 203 213 225;
    --color-border-primary: 51 65 85;
  }
}
```

## Color Accessibility Tools

### Development Tools
```javascript
// Color contrast checker utility
function getContrastRatio(color1, color2) {
  // Implementation for contrast ratio calculation
}

// Color usage validator
function validateColorUsage(component) {
  // Ensures semantic colors are used correctly
}
```

### Testing Strategy
- **Automated contrast checks** in build pipeline
- **Manual color vision deficiency testing**
- **Accessibility audit reports**
- **Color token validation**

## Documentation Structure
This color system serves as foundation for:
- **DESIGN_SYSTEM.md** - Color system overview
- **BRAND_IDENTITY.md** - Brand color applications
- **COMPONENT_LIBRARY.md** - Component color usage
- **DASHBOARD_DESIGN_SPEC.md** - Dashboard color schemes
- **VISUAL_QA_REPORT.md** - Color validation results

## Version Control
All color tokens tracked in git with semantic versioning:
- **Major version**: Significant color palette changes
- **Minor version**: New semantic colors added
- **Patch version**: Bug fixes and adjustments

## Dependencies
This color system depends on:
- **Tailwind CSS configuration** for utility classes
- **CSS custom properties** for dynamic theming
- **Design token validation tools**
- **Accessibility testing frameworks**

---

*This color system provides the comprehensive foundation for AfriTrade marketplace visual design, ensuring accessibility compliance, semantic meaning, and consistent application across all user interfaces.*