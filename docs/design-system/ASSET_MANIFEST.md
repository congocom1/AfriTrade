# Asset Manifest

## Overview
Asset Manifest documents all brand and design assets used in the AfriTrade marketplace, including logos, images, icons, color palettes, typography, and media files. This manifest serves as the single source of truth for asset management and usage.

## Brand Assets

### Logo Files
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Primary Logo | `assets/brand/logo-primary.svg` | SVG | Vector | Main brand applications |
| Logo Mark | `assets/brand/logo-mark.svg` | SVG | Vector | Icon-only usage |
| Monogram | `assets/brand/monogram.svg` | SVG | Vector | Favicon and small applications |
| Wordmark | `assets/brand/wordmark.svg` | SVG | Vector | Text-only brand applications |
| Logo Black | `assets/brand/logo-black.svg` | SVG | Vector | Light backgrounds |
| Logo White | `assets/brand/logo-white.svg` | SVG | Vector | Dark backgrounds |

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
| Favicon | `assets/favicon/favicon.ico` | ICO | Multiple sizes | Browser favicon |
| Apple Touch | `assets/favicon/apple-touch-icon.png` | PNG | 180x180 | iOS home screen |
| Android Chrome | `assets/favicon/android-chrome-192x192.png` | PNG | 192x192 | Android home screen |
| Android Chrome | `assets/favicon/android-chrome-512x512.png` | PNG | 512x512 | Android home screen |

## Color Assets

### Color Palette Files
| Asset | File Path | Format | Usage |
|-------|-----------|--------|-------|
| Primary Palette | `assets/colors/primary-palette.json` | JSON | Brand colors |
| Semantic Colors | `assets/colors/semantic-colors.json` | JSON | Success, warning, error |
| Surface Colors | `assets/colors/surface-colors.json` | JSON | Backgrounds and surfaces |
| Text Colors | `assets/colors/text-colors.json` | JSON | Text color tokens |

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
| Inter Regular | `assets/fonts/Inter-Regular.woff2` | WOFF2 | 400 | Body text |
| Inter Medium | `assets/fonts/Inter-Medium.woff2` | WOFF2 | 500 | Labels |
| Inter SemiBold | `assets/fonts/Inter-SemiBold.woff2` | WOFF2 | 600 | Subheadings |
| Inter Bold | `assets/fonts/Inter-Bold.woff2` | WOFF2 | 700 | Headings |
| JetBrains Mono Regular | `assets/fonts/JetBrainsMono-Regular.woff2` | WOFF2 | 400 | Code text |
| JetBrains Mono Bold | `assets/fonts/JetBrainsMono-Bold.woff2` | WOFF2 | 700 | Code emphasis |

### Font Loading Strategy
```css
/* Preload critical fonts */
<link rel="preload" href="assets/fonts/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>

/* Font face definitions */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url('assets/fonts/Inter-Regular.woff2') format('woff2');
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  src: url('assets/fonts/Inter-Bold.woff2') format('woff2');
  font-display: swap;
}

/* Fallback stack */
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
```

## Icon Assets

### Icon Library
| Asset | File Path | Format | Category | Usage |
|-------|-----------|--------|----------|-------|
| Lucide Icons | `node_modules/lucide-react` | React Component | UI icons | Interface icons |
| Custom Icons | `assets/icons/custom/` | SVG | Brand icons | AfriTrade-specific icons |
| Navigation Icons | `assets/icons/navigation/` | SVG | Navigation | Menu items |
| Status Icons | `assets/icons/status/` | SVG | Status indicators | Success, warning, error |
| Action Icons | `assets/icons/actions/` | SVG | Actions | Edit, delete, add |

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

### Product Images
| Asset Type | File Path | Format | Size | Optimization |
|------------|-----------|--------|------|--------------|
| Product Thumbnail | `assets/products/thumbnails/` | WebP | 150x150 | Lazy loaded |
| Product Main | `assets/products/main/` | WebP | 800x800 | Progressive loading |
| Product Gallery | `assets/products/gallery/` | WebP | 1200x1200 | Responsive breakpoints |
| Product Detail | `assets/products/detail/` | WebP | 1600x1600 | High resolution |

### Category Images
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Category Banner | `assets/categories/banners/` | WebP | 1200x400 | Category pages |
| Category Icon | `assets/categories/icons/` | SVG | 48x48 | Category navigation |
| Category Thumbnail | `assets/categories/thumbnails/` | WebP | 300x300 | Category grids |

### Promotional Images
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Hero Banner | `assets/promotions/hero/` | WebP | 1920x600 | Homepage hero |
| Sale Banner | `assets/promotions/sale/` | WebP | 800x400 | Sale announcements |
| Campaign Image | `assets/promotions/campaigns/` | WebP | 1200x800 | Marketing campaigns |

### Image Optimization
```jsx
// Optimized image component
const OptimizedImage = ({ src, alt, ...props }) => {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      {...props}
    />
  );
};
```

## Animation Assets

### Lottie Animations
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Loading Animation | `assets/animations/loading.json` | Lottie | 5KB | Loading states |
| Success Animation | `assets/animations/success.json` | Lottie | 8KB | Success feedback |
| Error Animation | `assets/animations/error.json` | Lottie | 8KB | Error feedback |
| Empty State | `assets/animations/empty.json` | Lottie | 12KB | Empty states |

### CSS Animation Assets
| Asset | File Path | Format | Usage |
|-------|-----------|--------|-------|
| Entrance Animations | `assets/css/animations/entrance.css` | CSS | Component entrances |
| Transition Animations | `assets/css/animations/transition.css` | CSS | Page transitions |
| Hover Animations | `assets/css/animations/hover.css` | CSS | Interactive states |

## Audio Assets

### Sound Effects
| Asset | File Path | Format | Duration | Usage |
|-------|-----------|--------|----------|-------|
| Button Click | `assets/audio/click.mp3` | MP3 | 0.1s | Button interactions |
| Success | `assets/audio/success.mp3` | MP3 | 0.5s | Success feedback |
| Error | `assets/audio/error.mp3` | MP3 | 0.5s | Error feedback |
| Notification | `assets/audio/notification.mp3` | MP3 | 0.8s | Notifications |

### Audio Guidelines
```javascript
// Audio preference handling
const useAudio = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  
  const playSound = (soundFile) => {
    if (isEnabled && typeof window !== 'undefined') {
      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  };
  
  return { playSound, isEnabled, setIsEnabled };
};
```

## Three.js Model Assets

### 3D Models
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Product Model Template | `assets/models/product-template.glb` | GLB | 5MB | Base product viewer |
| Electronics Model | `assets/models/electronics.glb` | GLB | 8MB | Electronics category |
| Fashion Model | `assets/models/fashion.glb` | GLB | 6MB | Fashion category |
| Home Model | `assets/models/home.glb` | GLB | 10MB | Home & garden category |

### Environment Assets
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Studio Environment | `assets/environments/studio.glb` | GLB | 15MB | Product studio |
| Outdoor Environment | `assets/environments/outdoor.glb` | GLB | 20MB | Outdoor product scenes |
| Indoor Environment | `assets/environments/indoor.glb` | GLB | 12MB | Indoor product scenes |

### Texture Assets
| Asset | File Path | Format | Size | Usage |
|-------|-----------|--------|------|-------|
| Wood Texture | `assets/textures/wood.jpg` | JPG | 2MB | Wooden surfaces |
| Metal Texture | `assets/textures/metal.jpg` | JPG | 2MB | Metallic surfaces |
| Fabric Texture | `assets/textures/fabric.jpg` | JPG | 3MB | Textile surfaces |

## Asset Optimization

### Image Optimization Settings
```javascript
// Image optimization configuration
const IMAGE_OPTIMIZATION = {
  formats: ['webp', 'avif'],
  quality: {
    low: 60,
    medium: 75,
    high: 85,
    lossless: 100
  },
  sizes: {
    thumbnail: [150, 150],
    small: [300, 300],
    medium: [600, 600],
    large: [1000, 1000],
    xlarge: [1600, 1600]
  },
  responsive: true,
  lazyLoad: true,
  progressive: true
};
```

### Font Optimization
```javascript
// Font optimization configuration
const FONT_OPTIMIZATION = {
  preload: true,
  fontDisplay: 'swap',
  subset: true,
  formats: ['woff2', 'woff'],
  variable: false
};
```

### Asset Bundling
```javascript
// Asset bundling configuration
const ASSET_BUNDLING = {
  codeSplit: true,
  treeShake: true,
  compress: true,
  gzip: true,
  brotli: true
};
```

## Asset Delivery

### CDN Configuration
```javascript
// CDN asset delivery
const CDN_CONFIG = {
  provider: 'cloudflare',
  baseURL: 'https://cdn.afritrade.com',
  cacheControl: 'public, max-age=31536000',
  compression: 'brotli',
  edgeLocations: ['US', 'EU', 'AF', 'APAC']
};
```

### Asset Loading Strategy
```jsx
// Progressive asset loading
const ProgressiveAsset = ({ src, placeholder, onLoad }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="progressive-asset">
      {!isLoaded && <div className="placeholder">{placeholder}</div>}
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
5. **Image Assets**: Product, category, and promotional images
6. **Animation Assets**: Lottie and CSS animations
7. **Audio Assets**: Sound effects and guidelines
8. **Three.js Model Assets**: 3D models and environments
9. **Asset Optimization**: Image and font optimization
10. **Asset Delivery**: CDN and loading strategies
11. **Asset Accessibility**: Alt text and ARIA requirements
12. **Asset Version Control**: Versioning and deprecation
13. **Asset Testing**: Visual and performance testing

### Related Documentation
- **DESIGN_SYSTEM.md**: Core design system principles
- **BRAND_IDENTITY.md**: Brand application guidelines
- **COLOR_TOKENS.md**: Color system documentation
- **TYPOGRAPHY_SYSTEM.md**: Typography specifications
- **COMPONENT_LIBRARY.md**: Component inventory
- **THREEJS_EXPERIENCES.md**: 3D model usage guidelines
- **VISUAL_QA_REPORT.md**: Visual testing guidelines

---

*This Asset Manifest provides comprehensive documentation of all design assets in the AfriTrade marketplace, ensuring consistent asset management, optimization, and accessibility across all user interfaces.*