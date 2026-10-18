# Three.js Experiences

## Overview
Three.js integration guidelines for 3D product visualization experiences in the AfriTrade marketplace. These experiences enable immersive product browsing while maintaining accessibility and performance across all devices.

## Integration Architecture

### Three.js Setup
```javascript
// Three.js scene initialization
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true 
});

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

container.appendChild(renderer.domElement);
```

### React Three Fiber Alternative
```jsx
// React Three Fiber integration
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const ProductViewer3D = ({ product }) => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <OrbitControls enableZoom={true} enablePan={false} />
      
      <product-model url={product.model_url} />
      <product-environment url={product.environment_url} />
      
      <Shadow />
    </Canvas>
  );
};
```

## 3D Product Viewer

### Core Features
- **Product Rotation**: Orbit controls for 360° product viewing
- **Zoom**: Smooth zoom in/out for product details
- **Pan**: Horizontal/vertical panning around product
- **Hotspots**: Interactive points highlighting key product features
- **Material Switching**: Change colors/materials in real-time
- **Annotations**: Product specification callouts

### Implementation
```jsx
const ProductViewer3D = ({ 
  product, 
  onModelLoad, 
  onHotspotClick,
  hotspots = [],
  modelScale = 1 
}) => {
  const sceneRef = useRef(null);
  const modelRef = useRef(null);
  
  const handleModelLoad = (model) => {
    modelRef.current = model;
    model.scale.set(modelScale, modelScale, modelScale);
    sceneRef.current.add(model);
    onModelLoad?.(model);
  };
  
  const handleHotspotClick = (hotspotId) => {
    onHotspotClick?.(hotspotId);
    // Camera animation to hotspot position
    const hotspot = hotspots.find(h => h.id === hotspotId);
    if (hotspot && sceneRef.current) {
      sceneRef.current.position.copy(hotspot.position);
    }
  };
  
  return (
    <Canvas>
      <model
        url={product.model_url}
        loader={GLTFLoader}
        onLoad={handleModelLoad}
        receiveShadow
        castShadow
      />
      {hotspots.map(hotspot => (
        <ProductHotspot key={hotspot.id} hotspot={hotspot} onClick={handleHotspotClick} />
      ))}
    </Canvas>
  );
};
```

## Performance Optimization

### Model Loading
```jsx
// Lazy loading for 3D models
const LazyModelLoader = ({ url, children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  const handleIntersection = ([entry]) => {
    if (entry.isIntersecting && !isLoaded) {
      setIsLoaded(true);
    }
  };
  
  return (
    <div ref={observer}>
      {isLoaded && children}
      {!isLoaded && <ModelPlaceholder />}
      {error && <ModelError onRetry={() => setError(null)} />}
    </div>
  );
};
```

### Asset Optimization
```javascript
// GLTF/GLB optimization
const gltfOptimizer = {
  dracoCompression: true,
  meshoptCompression: true,
  textureCompression: 'basis',
  maxTextureSize: 2048,
  quantization: {
    position: 16,
    normal: 12,
    color: 8,
    uv: 12
  }
};

// Model fallback strategy
const MODEL_FALLBACK_STRATEGY = {
  low: '2D image carousel',
  medium: 'Low-poly model',
  high: 'Full detail model'
};
```

### Memory Management
```jsx
useEffect(() => {
  // Dispose Three.js resources
  const disposeResources = () => {
    if (renderer) {
      renderer.dispose();
    }
    if (scene) {
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
  };
  
  return () => disposeResources();
}, []);
```

## Three.js Components

### ProductHotspot Component
```jsx
const ProductHotspot = ({ hotspot, onClick }) => {
  return (
    <mesh position={hotspot.position}>
      <sphereGeometry args={[0.05]} />
      <meshBasicMaterial color={hotspot.color || '#000000'} />
      <meshOnClick={() => onClick(hotspot.id)} />
    </mesh>
  );
};
```

### Material Switcher Component
```jsx
const MaterialSwitcher = ({ materials, currentMaterial, onMaterialChange }) => {
  return (
    <div className="material-switcher">
      {materials.map(material => (
        <button
          key={`material-${material.id}`}
          onClick={() => onMaterialChange(material.id)}
          className={`material-button ${currentMaterial === material.id ? 'active' : ''}`}
          style={{
            backgroundColor: material.color,
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: currentMaterial === material.id ? '2px solid #fff' : 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          aria-label={material.name}
        />
      ))}
    </div>
  );
};
```

### Annotation Component
```jsx
const ProductAnnotation = ({ 
  position, 
  text, 
  onClick, 
  alwaysVisible = false 
}) => {
  return (
    <div className={`annotation ${alwaysVisible ? 'visible' : 'hidden'}`}>
      <div className="annotation-content">
        <span className="annotation-text">{text}</span>
        <button onClick={onClick} className="annotation-close">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
```

## Fallback Strategies

### For Devices Without WebGL
```jsx
const ProductViewerFallback = ({ product }) => {
  const [webglSupported, setWebglSupported] = useState(true);
  
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebglSupported(!!gl);
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);
  
  if (!webglSupported) {
    return (
      <div className="fallback-viewer">
        <h3>3D model unavailable</h3>
        <p>Your device does not support WebGL. View product images instead.</p>
        <ImageGallery images={product.images} />
      </div>
    );
  }
  
  return <ProductViewer3D product={product} />;
};
```

### Progressive Enhancement
```javascript
// Quality levels based on device capability
const QUALITY_LEVELS = {
  high: {
    antialias: true,
    shadows: true,
    shadowsType: THREE.PCFSoftShadowMap,
    maxTextureSize: 2048,
    pixelRatio: window.devicePixelRatio
  },
  medium: {
    antialias: false,
    shadows: true,
    shadowsType: THREE.PCFShadowMap,
    maxTextureSize: 1024,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
  },
  low: {
    antialias: false,
    shadows: false,
    maxTextureSize: 512,
    pixelRatio: 1
  }
};

const getQualityLevel = () => {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const memory = navigator.deviceMemory || 4;
  
  if (memory >= 8 && devicePixelRatio >= 2) return 'high';
  if (memory >= 4 && devicePixelRatio >= 1.5) return 'medium';
  return 'low';
};
```

## Accessibility for 3D Experiences

### Screen Reader Support
```jsx
<Canvas>
  {/* ARIA-labels for 3D elements */}
  <mesh 
    aria-label="Product 3D model"
    role="img"
    aria-describedby="product-description"
  >
    {/* Product model content */}
  </mesh>
  
  {/* Alternative text for non-WebGL devices */}
  <div className="sr-only">
    Interactive 3D product view. Rotate to view from all angles. Use hotspots to view product details.
  </div>
</Canvas>
```

### Keyboard Navigation
```jsx
const KeyboardControls = ({ onRotate, onZoom, onPan }) => {
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        onRotate(-0.1);
        e.preventDefault();
        break;
      case 'ArrowRight':
        onRotate(0.1);
        e.preventDefault();
        break;
      case 'ArrowUp':
        onZoom(1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        onZoom(-1);
        e.preventDefault();
        break;
    }
  };
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRotate, onZoom, onPan]);
  
  return null;
};
```

### Motion Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  .three-canvas {
    animation: none !important;
    transition: none !important;
  }
  
  .product-hotspot {
    animation: none !important;
    transition: none !important;
  }
}
```

## Performance Guidelines

### Frame Rate Targets
```javascript
// Performance monitoring
const FRAME_RATE_TARGET = 60;
const FRAME_TIME_TARGET = 1000 / FRAME_RATE_TARGET; // ~16.67ms

const monitorFrameRate = () => {
  let lastTime = performance.now();
  let frameCount = 0;
  
  const measure = (currentTime) => {
    frameCount++;
    if (currentTime - lastTime >= 1000) {
      const fps = frameCount;
      if (fps < FRAME_RATE_TARGET) {
        console.warn(`Low frame rate: ${fps} fps`);
        // Automatically reduce quality
      }
      frameCount = 0;
      lastTime = currentTime;
    }
    requestAnimationFrame(measure);
  };
  
  requestAnimationFrame(measure);
};
```

### Bundle Size Optimization
```javascript
// Three.js tree shaking
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  BoxGeometry,
  MeshBasicMaterial
} from 'three';

// Or use three/examples/jsm for specific modules
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
```

## Device Capability Detection

### WebGL Support Detection
```javascript
const detectWebGLSupport = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};

const detectDeviceCapability = () => {
  return {
    webgl: detectWebGLSupport(),
    memory: navigator.deviceMemory || 4,
    cores: navigator.hardwareConcurrency || 4,
    pixelRatio: window.devicePixelRatio || 1,
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
};
```

## Three.js Documentation Structure

### Three.js Experience Sections
1. **Overview**: Three.js integration philosophy
2. **Architecture**: Scene setup and component structure
3. **Core Components**: ProductViewer3D, Hotspot, Annotation
4. **Performance**: Optimization and fallback strategies
5. **Accessibility**: Screen reader and keyboard support
6. **Testing**: Frame rate and bundle size validation

### Related Documentation
- **DESIGN_SYSTEM.md**: Core design system principles
- **BRAND_IDENTITY.md**: Brand application guidelines
- **TYPOGRAPHY_SYSTEM.md**: Typography specifications
- **COMPONENT_LIBRARY.md**: Component inventory
- **DASHBOARD_DESIGN_SPEC.md**: Dashboard layout patterns
- **MOBILE_DESIGN_SPEC.md**: Mobile-specific patterns
- **MOTION_GUIDELINES.md**: Animation guidelines
- **ASSET_MANIFEST.md**: Asset inventory
- **VISUAL_QA_REPORT.md**: Visual testing guidelines
- **ACCESSIBILITY_REPORT.md**: WCAG compliance

---

*This Three.js Experiences document provides comprehensive guidelines for 3D product visualization in the AfriTrade marketplace, ensuring performant, accessible, and engaging user experiences across all devices.*