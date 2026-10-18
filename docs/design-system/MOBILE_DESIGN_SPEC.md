# Mobile Design Specification

## Overview
This document defines the comprehensive mobile design system for the AfriTrade marketplace, covering responsive patterns, touch interactions, and mobile-specific design considerations for both Seller and Admin interfaces.

## Mobile Architecture

### Mobile-First Design Approach
```
mobile-first-breakpoint: 768px

/* Mobile (default): 1 column, vertical stacking */
.dashboard-container {
  grid-template-columns: 1fr;
  flex-direction: column;
}

/* Tablet (≥768px): 2 columns, expanded content */
@media (min-width: 768px) {
  .dashboard-container {
    grid-template-columns: 280px 1fr;
  }
}

/* Desktop (≥1024px): 3+ columns, full features */
@media (min-width: 1024px) {
  .dashboard-container {
    grid-template-columns: 320px 1fr;
  }
}
```

### Mobile Component Adaptation

#### Navigation Patterns
**Mobile Bottom Navigation**:
```css
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  padding: 0.75rem;
  display: flex;
  justify-content: space-around;
  z-index: 1000;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.mobile-nav-item.active {
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}
```

**Mobile Action Bar**:
```css
.mobile-action-bar {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 16px;
  margin: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mobile-action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: var(--color-bg-secondary);
  transition: all 0.2s ease;
}

.mobile-action-button.primary {
  background: var(--color-primary-500);
  color: white;
}
```

### Mobile Dashboard Layout

#### Responsive Dashboard Structure
```jsx
const MobileDashboardLayout = () => {
  return (
    <div className="mobile-dashboard-layout">
      {/* Fixed header for mobile */}
      <header className="mobile-header">
        <button className="menu-toggle">
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="header-title">AfriTrade</h1>
        <button className="notification-toggle">
          <Bell className="h-6 w-6" />
        </button>
      </header>

      {/* Scrollable content area */}
      <main className="mobile-content">
        <MobileDashboardShell variant="paper" />
      </main>

      {/* Bottom navigation for mobile */}
      <MobileBottomNav />
    </div>
  );
};
```

#### Mobile Dashboard Shell
```jsx
const MobileDashboardShell = ({ variant = 'default' }) => {
  return (
    <div className={`mobile-dashboard-shell ${variant === 'paper' ? 'mobile-paper' : ''}`>
      <MobileDashboardNav />
      <div className="mobile-dashboard-content">
        <MobileKPIOverview />
        <MobileActionBar />
        <MobileProductList />
      </div>
    </div>
  );
};
```

## Touch Interaction Design

### Touch Target Sizes
```css
/* Minimum touch targets for mobile */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Button touch targets */
.mobile-button {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Input touch targets */
.mobile-input {
  min-height: 44px;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 16px; /* Prevents zoom on iOS */
}
```

### Gesture-Based Interactions
```css
/* Swipe gestures */
.swipeable {
  touch-action: pan-y;
  user-select: none;
}

/* Long press for actions */
.long-press {
  touch-action: manipulation;
}

/* Pinch to zoom (for images) */
.pinch-zoomable {
  touch-action: pinch-zoom;
}
```

### Haptic Feedback
```jsx
const useHapticFeedback = (type = 'light') => {
  const haptic = useCallback(() => {
    if (navigator.vibrate) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
      }
    }
  }, [type]);
  
  return haptic;
};
```

## Mobile-Specific Components

### Mobile Action Button
```jsx
const MobileActionButton = ({ 
  onClick, 
  icon, 
  label, 
  variant = 'primary',
  size = 'medium'
}) => {
  return (
    <button
      onClick={onClick}
      className={`mobile-action-button ${variant} ${size}`}
      aria-label={label}
      onTouchStart={hapticFeedback}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
};
```

### Mobile Swipe Actions
```jsx
const SwipeableProductCard = ({ product, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSwipe = (direction) => {
    if (direction === 'left') {
      setIsOpen(true);
    } else if (direction === 'right') {
      setIsOpen(false);
    }
  };
  
  return (
    <div className="swipeable-card">
      <MobileSwipeable
        onSwipe={handleSwipe}
        threshold={50}
      >
        <SellerProductCard product={product} />
      </MobileSwipeable>
      
      <div className={`action-sheet ${isOpen ? 'open' : ''}`>
        <button onClick={() => onEdit(product)}>
          <Pencil /> Edit
        </button>
        <button onClick={() => onDelete(product)} className="danger">
          <Trash2 /> Delete
        </button>
      </div>
    </div>
  );
};
```

### Mobile Form Components
```jsx
const MobileForm = () => {
  return (
    <form className="mobile-form">
      <div className="form-group">
        <label className="mobile-label">Product Name</label>
        <input
          type="text"
          className="mobile-input"
          placeholder="Enter product name"
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label className="mobile-label">Status</label>
        <MobileSelect
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={statusOptions}
        />
      </div>
      
      <MobileActionButton
        type="submit"
        variant="primary"
        size="large"
      >
        Save Product
      </MobileActionButton>
    </form>
  );
};
```

## Mobile Navigation Patterns

### Bottom Navigation
```jsx
const MobileBottomNav = () => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, href: '/dashboard' },
    { id: 'products', label: 'Products', icon: Package, href: '/products' },
    { id: 'analytics', label: 'Analytics', icon: BarChart, href: '/analytics' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  ];
  
  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => (
        <MobileNavItem
          key={item.id}
          {...item}
          isActive={activeRoute === item.id}
        />
      ))}
    </nav>
  );
};
```

### Mobile Navigation Item
```jsx
const MobileNavItem = ({ icon: Icon, label, href, isActive, onClick }) => {
  return (
    <Link
      to={href}
      className={`mobile-nav-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span className="nav-label">{label}</span>
      {isActive && <div className="nav-indicator" />}
    </Link>
  );
};
```

### Mobile Drawer Navigation
```jsx
const MobileDrawerNav = ({ isOpen, onClose }) => {
  return (
    <Drawer direction="left" isOpen={isOpen} onClose={onClose}>
      <div className="mobile-drawer-content">
        <div className="drawer-header">
          <h2>Navigation</h2>
          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="drawer-body">
          {navigationItems.map((item) => (
            <MobileDrawerItem key={item.id} {...item} />
          ))}
        </div>
      </div>
    </Drawer>
  );
};
```

## Mobile Performance Optimization

### Image Optimization
```jsx
const OptimizedImage = ({ src, alt, ...props }) => {
  return (
    <div className="image-container">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
};
```

### Lazy Loading
```jsx
// Intersection Observer for lazy loading
const useLazyLoad = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return { ref, isLoaded };
};
```

### Data Optimization
```jsx
const useMobileDataFetching = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch data with mobile-optimized payload
        const response = await api.getProducts({
          format: 'mobile',
          fields: 'id,title,price,status,images',
          limit: 20 // Smaller page size for mobile
        });
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return { data, loading, error };
};
```

## Mobile Typography

### Responsive Typography
```css
/* Mobile typography scale */
.mobile-typography {
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
}

/* Mobile font sizes */
.mobile-h1 { font-size: var(--font-size-3xl); }
.mobile-h2 { font-size: var(--font-size-2xl); }
.mobile-h3 { font-size: var(--font-size-xl); }
.mobile-body { font-size: var(--font-size-base); }
.mobile-caption { font-size: var(--font-size-sm); }

/* Adjust for larger screens */
@media (min-width: 768px) {
  .mobile-h1 { font-size: 3rem; }
  .mobile-h2 { font-size: 2.25rem; }
  .mobile-h3 { font-size: 1.875rem; }
}
```

### Mobile Text Styling
```css
.mobile-text {
  line-height: 1.6;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.mobile-text-secondary {
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.mobile-text-caption {
  line-height: 1.4;
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
}
```

## Mobile Accessibility

### Touch Accessibility
```css
/* High contrast for mobile */
.mobile-accessible {
  /* Ensure 4.5:1 contrast ratio */
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
}

/* Focus indicators for touch */
.mobile-focus {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
  position: relative;
}

/* Better tap targets on mobile */
.mobile-tap-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Screen Reader Support
```jsx
const MobileScreenReader = ({ content }) => {
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {content}
    </span>
  );
};
```

## Mobile Testing

### Mobile Device Testing
```jsx
// Mobile viewport testing
const mobileViewport = {
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
};

// iOS specific testing
const iOSViewport = {
  width: 375,
  height: 812,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
};
```

### Touch Interaction Testing
```jsx
// Gesture-based testing
it('should handle swipe gestures', async () => {
  render(<MobileSwipeableComponent />);
  
  await userEvent.touchStart('div', { touch: { clientX: 100 } });
  await userEvent.touchMove('div', { touch: { clientX: -100 } });
  await userEvent.touchEnd('div');
  
  expect(onSwipe).toHaveBeenCalledWith('left');
});
```

## Mobile Component Documentation

### Mobile Component Inventory
| Component | Mobile Version | Features |
|-----------|----------------|----------|
| DashboardShell | MobileDashboardShell | Collapsible sidebar, bottom nav |
| DashboardNav | MobileBottomNav | Fixed bottom navigation |
| SellerProductCard | SwipeableProductCard | Swipe actions, touch optimized |
| Action Button | MobileActionButton | Touch targets, haptic feedback |
| Form | MobileForm | Optimized inputs, keyboard support |

### Mobile Development Guidelines

#### Performance Optimization
1. **Use `React.lazy()`** for component lazy loading
2. **Implement `requestIdleCallback()`** for non-critical tasks
3. **Optimize images** with appropriate sizing
4. **Cache data** effectively for offline scenarios
5. **Minimize re-renders** with memoization

#### Memory Management
1. **Clean up listeners** on component unmount
2. **Dispose of timers** and intervals
3. **Clear caches** appropriately
4. **Monitor memory usage** for mobile devices
5. **Handle offline scenarios** gracefully

## Documentation Structure

### Mobile Design Documentation Sections
1. **Overview**: Mobile-first design philosophy
2. **Layout**: Responsive patterns and breakpoints
3. **Navigation**: Mobile-specific navigation patterns
4. **Touch Interface**: Gesture-based interactions
5. **Components**: Mobile-optimized component specifications
6. **Performance**: Mobile optimization guidelines
7. **Accessibility**: Mobile-specific accessibility standards
8. **Testing**: Mobile device and interaction testing

### Related Documentation
- **DESIGN_SYSTEM.md**: Core design system principles
- **TYPOGRAPHY_SYSTEM.md**: Typography specifications
- **COMPONENT_LIBRARY.md**: Component inventory
- **DASHBOARD_DESIGN_SPEC.md**: Dashboard layout patterns
- **MOBILE_DESIGN_SPEC.md**: This mobile-specific guide

---

*This Mobile Design Specification provides comprehensive guidelines for designing consistent, accessible, and performant mobile interfaces for the AfriTrade marketplace, focusing on touch interactions, responsive layouts, and mobile-specific optimization.*