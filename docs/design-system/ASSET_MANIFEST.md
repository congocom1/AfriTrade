# Asset Manifest

## Overview
Asset Manifest documents all brand and design assets used in the AfriTrade marketplace, including logos, images, icons, color palettes, typography, and media files. This manifest serves as the single source of truth for asset management and usage.

## Brand Assets

### Logo Files
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Primary Logo | `public/brand/logo-primary.svg` | SVG | Vector | Main brand applications |
| Logo Mark | `public/brand/logo-mark.svg` | SVG | Vector | Icon-only usage |
| Monogram | `public/brand/logo-monogram.svg` | SVG | Vector | Favicon and small applications |
| Logo Stacked | `public/brand/logo-stacked.svg` | SVG | Vector | Header/hero lockup |
| Logo Monogram Badge | `public/brand/logo-monogram-badge.svg` | SVG | Vector | Small brand applications |
| Logo Mark Mono | `public/brand/logo-mark-mono.svg` | SVG | Vector | Monochrome usage |
| Logo Mono | `public/brand/logo-mono.svg` | SVG | Vector | Dark backgrounds |
| Logo Primary Mono | `public/brand/logo-primary-mono.svg` | SVG | Vector | Monochrome primary |
| Logo Dark | `public/brand/logo-dark.svg` | SVG | Vector | Dark variant |
| Logo Icon | `public/brand/logo-icon.svg` | SVG | Vector | Icon-only usage |
| Logo Loader | `public/brand/logo-loader.svg` | SVG | Vector | Loading state |
| Logo Sting | `public/brand/logo-sting.svg` | SVG | Vector | Animated sting |

### Logo Usage Guidelines
```css
/* Minimum clear space: 1x logo height */
.logo-container {
  min-width: 150px;
  min-height: 40px;
  padding: 1rem;
}

/* Never stretch or distort */
.logo img {
  max-width: 100%;
  height: auto;
  object-fit: contain;
}
```

### Favicon Files
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Favicon | `public/brand/favicon.ico` | ICO | Multiple sizes | Browser favicon |
| Favicon SVG | `public/brand/favicon.svg` | SVG | Vector | Modern browser favicon |
| Favicon 16 | `public/brand/favicon-16.png` | PNG | 16x16 | Small tab icon |
| Favicon 32 | `public/brand/favicon-32.png` | PNG | 32x32 | Standard tab icon |
| Favicon 64 | `public/brand/favicon-64.png` | PNG | 64x64 | High-DPI tab icon |
| Apple Touch | `public/brand/apple-touch-icon.png` | PNG | 180x180 | iOS home screen |
| Android Chrome 192 | `public/brand/icon-192.png` | PNG | 192x192 | Android home screen |
| Android Chrome 512 | `public/brand/icon-512.png` | PNG | 512x512 | Android home screen |
| Android Maskable 512 | `public/brand/icon-512-maskable.png` | PNG | 512x512 | Adaptive icons |

## Color Assets

### Color Palette Files
| Asset | File Path | Format | Usage |
|-------|-----------|--------|-------|
| Primary Palette | CSS custom properties (`src/index.css` :root) | CSS HSL | Brand colors defined via `--primary`, `--success`, `--warning`, `--info` tokens |
| Semantic Colors | `src/index.css` :root | CSS HSL | Success, warning, info, destructive |
| Surface Colors | `src/index.css` :root | CSS HSL | Background, card, popover, secondary, accent |
| Text Colors | `src/index.css` :root | CSS HSL | Foreground, card-foreground, muted-foreground, accent-foreground |

### Color Usage
```css
/* CSS custom properties for color tokens */
:root {
  --color-primary-500: 14 165 233;
  --color-success-500: 22 163 74;
  --color-warning-500: 249 115 22;
  --color-error-500: 220 38 38;
}
```

## Typography Assets

### Font Files
| Asset | File Path | Format | Weight | Usage |
|-------|-----------|--------|--------|-------|
| Sora Regular | `public/fonts/sora.woff2` | WOFF2 | 400 | Headings / display |
| Manrope Regular | `public/fonts/manrope.woff2` | WOFF2 | 400 | Body text |
| JetBrains Mono Regular | `public/fonts/jetbrains-mono.woff2` | WOFF2 | 400 | Code / data |

### Font Loading Strategy
```css
/* Preload critical fonts */
<link rel="preload" href="/fonts/sora.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>

/* Font face definitions */
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/sora.woff2') format('woff2');
  font-display: swap;
}

@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/manrope.woff2') format('woff2');
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/jetbrains-mono.woff2') format('woff2');
  font-display: swap;
}

/* Fallback stack */
body {
  font-family: 'Manrope', system-ui, -apple-system, sans-serif;
}
```

## Icon Assets

### Icon Library
| Asset | File Path | Format | Category | Usage |
|-------|-----------|--------|----------|-------|
| Lucide Icons | `node_modules/lucide-react` | React Component | UI icons | Interface icons |
| App icons (192/512/maskable) | `public/icons/` | PNG | Brand | PWA / home screen |
| Apple Touch icon | `public/icons/apple-touch-icon.png` | PNG | Brand | iOS home screen |
| Maskable 512 | `public/icons/icon-maskable-512.png` | PNG | Brand | Adaptive icons |

### Icon Usage
```jsx
// Lucide icon usage
import { Menu, X, Search, ShoppingBag, User } from 'lucide-react';

// Custom icon usage
import { AfriTradeMonogram } from '@/components/icons/AfriTradeMonogram';

// Icon sizing
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 24px; height: 24px; }
.icon-lg { width: 32px; height: 32px; }
.icon-xl { width: 48px; height: 48px; }
```

## Image Assets

### Category / Promotional Images
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Shopping Hero | `public/images/shopping-hero.svg` | SVG | 4 KB | Homepage hero |
| Electronics | `public/images/electronics.svg` | SVG | 3 KB | Category page |
| Home Decor | `public/images/home-decor.svg` | SVG | 4 KB | Category page |
| afritrade_social_portrait_1080x1350 | `public/images/afritrade_social_portrait_1080x1350.png` | PNG | 30 KB | Social media portrait |
| afritrade_social_square_1080x1080 | `public/images/afritrade_social_square_1080x1080.png` | PNG | 40 KB | Social media square |
| afritrade_social_story_1080x1920 | `public/images/afritrade_social_story_1080x1920.png` | PNG | 50 KB | Social media story |
| afritrade_web_banner_1200x400 | `public/images/afritrade_web_banner_1200x400.png` | PNG | 36 KB | Webpage banner |
| afritrade_web_hero_1600x900 | `public/images/afritrade_web_hero_1600x900.png` | PNG | 56 KB | Webpage hero |

### Optimized WebP Variants
WebP variants at 4 responsive widths (300w / 600w / 900w / 1200w) are generated by
`scripts/optimize-images.js` and written to `public/images/webp/`. Each source PNG
(~2 MB) reduces to ~100–140 KB total across all breakpoints (~87–93% smaller).
Regenerate with:

```bash
node scripts/optimize-images.js
```

## Asset Optimization

`scripts/optimize-images.js` converts `public/images/*.png` to responsive WebP
variants using `sharp`. Breakpoints: 300w, 600w, 900w, 1200w (no upscaling).
Quality: 82.

      <img
        src={src}
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};
```

## Asset Accessibility

### Alt Text Requirements
```jsx
// Image accessibility requirements
<Image
  src="/path/to/image.jpg"
  alt="Descriptive alternative text"
  aria-label="Screen reader label"
  role="img"
/>

// Decorative images
<Image
  src="/path/to/decorative.jpg"
  alt=""
  aria-hidden="true"
/>
```

### Audio Accessibility
```jsx
// Audio controls accessibility
<audio
  controls
  aria-label="Audio description"
  src="/path/to/audio.mp3"
/>
```

### Animation Accessibility
```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .animated-asset {
    animation: none !important;
    transition: none !important;
  }
}
```

## Asset Version Control

### Versioning Strategy
- **Major versions**: Significant asset changes (new logo, brand redesign)
- **Minor versions**: New assets added, existing assets modified
- **Patch versions**: Asset optimizations, bug fixes

### Asset Management Workflow
1. **Creation**: Asset created by design team
2. **Optimization**: Asset optimized for web delivery
3. **Testing**: Asset tested across devices and browsers
4. **Documentation**: Asset added to manifest
5. **Deployment**: Asset deployed to CDN
6. **Monitoring**: Asset performance monitored

### Asset Deprecation
- **Unused**: Assets no longer referenced in codebase
- **Replaced**: Assets replaced by newer versions
- **Deprecated**: Assets marked for removal

## Asset Testing

### Visual Testing
```jsx
// Asset visual regression testing
import { composeStories } from '@storybook/react';
import * as stories from './Asset.stories';

const { Logo, Icon, Image } = composeStories(stories);

it('renders assets correctly', () => {
  const story = Logo();
  expect(story).toMatchSnapshot();
});
```

### Performance Testing
```javascript
// Asset loading performance
const measureAssetLoadTime = async (assetUrl) => {
  const startTime = performance.now();
  await fetch(assetUrl);
  const endTime = performance.now();
  return endTime - startTime;
};
```

## Asset Documentation Structure

### Asset Manifest Sections
1. **Overview**: Asset management philosophy
2. **Brand Assets**: Logos, favicons, color palette
3. **Typography Assets**: Font files and loading
4. **Icon Assets**: Icon library and usage
5. **Image Assets**: Category and promotional images
6. **Asset Optimization**: WebP image optimization script
7. **Asset Testing**: Visual and performance testing

### Related Documentation
- **BRAND_IDENTITY.md**: Brand application guidelines
- **COMPONENT_LIBRARY.md**: Component inventory
- **VISUAL_QA_REPORT.md**: Visual testing guidelines

---

*This Asset Manifest provides comprehensive documentation of all design assets in the AfriTrade marketplace, ensuring consistent asset management, optimization, and accessibility across all user interfaces.*