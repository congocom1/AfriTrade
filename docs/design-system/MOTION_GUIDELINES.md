# Motion Guidelines

## Overview
Motion guidelines define the comprehensive animation and interaction patterns for the AfriTrade marketplace, ensuring smooth, purposeful animations that enhance user experience while maintaining accessibility and performance.

## Motion Philosophy

### Core Principles
1. **Purpose-Driven**: Every animation serves a user experience function
2. **Consistent**: Predictable timing and easing across all interactions
3. **Accessible**: Respects reduced motion preferences
4. **Performance**: Optimized for smooth rendering on all devices
5. **Hierarchical**: More important actions animate more prominently

### Motion Values
```css
/* Design system motion tokens */
--motion-duration-immediate: 0ms;
--motion-duration-quick: 150ms;
--motion-duration-smooth: 300ms;
--motion-duration-complex: 500ms;

--motion-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
--motion-easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--motion-easing-material: cubic-bezier(0.4, 0, 0.2, 1);

--motion-easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
--motion-easing-accelerate: cubic-bezier(0.4, 0, 1, 1);
```

## Animation Durations

### Duration Scale
| Duration | Time | Use Case |
|----------|------|----------|
| Immediate | 0ms | No transition, instant changes |
| Quick | 150ms | Button presses, micro-interactions |
| Smooth | 300ms | Modal open/close, dropdown menus |
| Complex | 500ms | Page transitions, multi-step flows |

### Specific Animation Durations
```css
/* Component animations */
.button-press {
  transition: all 150ms var(--motion-easing-standard);
}

.modal-open {
  animation: modalOpen 300ms var(--motion-easing-standard);
}

.dropdown-open {
  animation: dropdownOpen 300ms var(--motion-easing-decelerate);
}

.page-transition {
  animation: pageTransition 500ms var(--motion-easing-material);
}

/* Background overlays */
.overlay-fade {
  animation: overlayFade 300ms var(--motion-easing-standard);
}
```

## Animation Types

### Micro-interactions (150ms)
```css
/* Button interactions */
.interactive-button {
  transition: all 150ms var(--motion-easing-standard);
}

.interactive-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.interactive-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Card hover */
.card-hover {
  transition: all 150ms var(--motion-easing-standard);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Input focus */
.input-focus {
  transition: border-color 150ms var(--motion-easing-standard);
}

.input-focus:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### Component Transitions (300ms)
```css
/* Modal animations */
@keyframes modalOpen {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes modalClose {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(0.98);
  }
}

/* Drawer animations */
@keyframes drawerOpen {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes drawerClose {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

/* Dropdown animations */
@keyframes dropdownOpen {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dropdownClose {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
```

### Page Transitions (500ms)
```css
@keyframes pageTransition {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pageTransitionReverse {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}
```

## Easing Functions

### Standard Easing
```css
/* Material Design standard easing */
.easing-standard {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Decelerate ending */
.easing-decelerate {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

/* Accelerate starting */
.easing-accelerate {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
```

### Specialized Easing
```css
/* Bounce effect (for celebrations) */
.easing-bounce {
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Material menu dropdown */
.easing-menu {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth spring for cards */
.easing-spring {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Animation Guidelines by Component

### Button Animations
```css
.mobile-button {
  transition: all 150ms var(--motion-easing-standard);
}

.desktop-button {
  transition: all 150ms var(--motion-easing-standard);
}

.button-primary {
  transition: all 150ms var(--motion-easing-accelerate);
}

.button-success {
  transition: all 150ms var(--motion-easing-bounce);
}
```

### Card Animations
```css
.card-interactive {
  transition: all 300ms var(--motion-easing-standard);
}

.card-entrance {
  animation: cardEntrance 300ms var(--motion-easing-material);
}

@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Form Animations
```css
.input-entrance {
  animation: inputEntrance 300ms var(--motion-easing-decelerate);
}

@keyframes inputEntrance {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-validation {
  animation: validationPulse 150ms var(--motion-easing-bounce);
}

@keyframes validationPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
```

### Navigation Animations
```css
.nav-item {
  transition: all 150ms var(--motion-easing-standard);
}

.nav-item-active {
  transition: all 300ms var(--motion-easing-decelerate);
}

.drawer-open {
  animation: drawerOpen 300ms var(--motion-easing-standard);
}

.drawer-close {
  animation: drawerClose 300ms var(--motion-easing-standard);
}
```

## Animation-by-Feature

### Loading States
```css
/* Skeleton loading */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Progress bar */
.progress-bar {
  animation: progress 2s ease-in-out infinite;
}

@keyframes progress {
  0% { width: 0%; }
  50% { width: 50%; }
  100% { width: 100%; }
}
```

### Status Indicators
```css
/* Success animation */
.success-pulse {
  animation: successPulse 300ms var(--motion-easing-bounce);
}

@keyframes successPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Error shake */
.error-shake {
  animation: errorShake 300ms var(--motion-easing-bounce);
}

@keyframes errorShake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

/* Warning pulse */
.warning-pulse {
  animation: warningPulse 500ms var(--motion-easing-bounce);
}

@keyframes warningPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

### Notification Animations
```css
/* Toast entrance */
@keyframes toastEnter {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toastExit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* Toast exit with delay */
.toast-exit-delayed {
  animation: toastExit 300ms var(--motion-easing-standard);
  animation-delay: 3s;
}
```

## Animation Performance Guidelines

### Optimization Strategies
```css
/* Use transform instead of layout properties */
.optimized-animation {
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

/* Hardware-accelerated animations */
.hardware-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Reduce compositor work */
.will-change-transform {
  will-change: transform;
}
```

### Animation Best Practices
1. **Transform properties** over `left`, `top`, `margin`, `width`, `height`
2. **Will-change** only when necessary
3. **Performance testing** for 60fps on target devices
4. **GPU acceleration** for complex animations
5. **Animation cleanup** to prevent memory leaks

## Reduced Motion Support

### Respect for User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
    /* Disable any transitions and animations */
  }
}

/* Exclude specific animations from being disabled */
.reduced-motion-exception {
  animation-duration: var(--motion-duration-smooth);
  transition-duration: var(--motion-duration-smooth);
}
```

### Accessible Alternatives
```jsx
// Controlled component for users who need reduced motion
const ReducedMotionAnimation = ({ children, enabled = true }) => {
  return enabled ? children : <>{children}</>;
};

// Skip animations option
const AnimationToggle = ({ onToggle, isEnabled }) => {
  return (
    <button onClick={() => onToggle(!isEnabled)}>
      {isEnabled ? 'Disable' : 'Enable'} Animations
    </button>
  );
};
```

## Animation Testing

### Visual Regression Testing
```jsx
// Animation testing for Storybook
export const ButtonAnimations = () => {
  return (
    <div>
      <Button animation="hover">Hover me</Button>
      <Button animation="press">Press me</Button>
      <Button animation="focus">Focus me</Button>
    </div>
  );
};
```

### Performance Testing
```javascript
// Animation performance metrics
const measureAnimationPerformance = () => {
  const startTime = performance.now();
  
  // Trigger animation
  element.classList.add('animate');
  
  requestAnimationFrame(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 33.33) { // More than 30fps
      console.warn('Animation performance below 60fps:', duration + 'ms');
    }
  });
};
```

## Animation Documentation Structure

### Animation Categories
1. **Duration Scale**: Quick (150ms), Smooth (300ms), Complex (500ms)
2. **Easing Functions**: Standard, Bounce, Material, Spring
3. **Animation Types**: Micro-interactions, Component transitions, Page transitions
4. **Component-Specific**: Button, Card, Form, Navigation animations
5. **Feature-Specific**: Loading states, Status indicators, Notifications
6. **Performance**: Optimization guidelines
7. **Accessibility**: Reduced motion support
8. **Testing**: Performance and visual regression testing

---

*This Motion Guidelines document provides comprehensive standards for animation and interaction patterns in the AfriTrade marketplace, ensuring smooth, accessible, and performant user experiences across all devices and contexts.*