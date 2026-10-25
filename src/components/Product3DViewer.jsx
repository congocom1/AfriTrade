import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { getProduct3DBuilder } from '@/lib/product3d/registry';
import { setProductPhoto } from '@/lib/product3d/materials';

/**
 * 3D product viewer (experience layer, never mandatory).
 * - modelKey -> geometry built in the browser by the product 3D library.
 * - modelUrl -> a GLTF/GLB file, kept for products that ship one.
 * - Load or WebGL failure -> falls back to the photo, never a blank canvas.
 * - prefers-reduced-motion -> static first frame, no auto-rotate.
 * three.js is lazy-imported so the main bundle stays untouched.
 */
export default function Product3DViewer({ modelKey, modelUrl, fallbackImage, photo, title, interactive = true }) {
  const { t } = useTranslation();
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    if (!modelKey && !modelUrl) return;
    let cancelled = false;
    let renderer = null;
    let resizeObserver = null;
    let raf = 0;
    let hintTimer = 0;
    const disposables = [];
    setHintVisible(true);

    (async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
        if (cancelled || !mountRef.current) return;

        const mount = mountRef.current;
        const w = mount.clientWidth || 400;
        const h = mount.clientHeight || 400;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, w / h, 0.05, 100);

        const fitToMount = () => {
          const nextWidth = mount.clientWidth || 400;
          const nextHeight = mount.clientHeight || 400;
          renderer.setSize(nextWidth, nextHeight);
          camera.aspect = nextWidth / nextHeight;
          camera.updateProjectionMatrix();
        };
        resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fitToMount);
        resizeObserver?.observe(mount);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3ab, 1.4));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(3, 5, 4);
        key.castShadow = true;
        // Tight shadow frustum: the model is ~2.4 units across, so the map
        // stays sharp around it instead of spreading over an empty 10-unit box.
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far = 24;
        key.shadow.camera.left = -2.6;
        key.shadow.camera.right = 2.6;
        key.shadow.camera.top = 2.6;
        key.shadow.camera.bottom = -2.6;
        key.shadow.bias = -0.0009;
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.5);
        fill.position.set(-4, 2, -3);
        scene.add(fill);
        const rim = new THREE.DirectionalLight(0xffffff, 0.75);
        rim.position.set(-2, 3, -5);
        scene.add(rim);

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.22 }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        disposables.push(ground.geometry, ground.material);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enabled = interactive;
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minPolarAngle = 0.15;
        controls.maxPolarAngle = Math.PI / 2.04;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        controls.autoRotate = !reduced;
        controls.autoRotateSpeed = 0.9;
        controls.addEventListener('start', () => setHintVisible(false));
        hintTimer = window.setTimeout(() => setHintVisible(false), 6000);

        // The product's own photo is the model's texture source: body shell,
        // screens and printed faces, plus the reflections on metal and glass.
        // fallbackImage stays a flat photo fallback, never a model texture.
        const photoUrl = photo;
        let photoTexture = null;
        if (photoUrl) {
          photoTexture = await new Promise((resolve) => {
            new THREE.TextureLoader()
              .setCrossOrigin('anonymous')
              .load(
                photoUrl,
                (texture) => {
                  texture.colorSpace = THREE.SRGBColorSpace;
                  texture.wrapS = THREE.ClampToEdgeWrapping;
                  texture.wrapT = THREE.ClampToEdgeWrapping;
                  resolve(texture);
                },
                undefined,
                () => resolve(null),
              );
          });
        }
        if (photoTexture) {
          const pmrem = new THREE.PMREMGenerator(renderer);
          const environment = pmrem.fromEquirectangular(photoTexture).texture;
          pmrem.dispose();
          scene.environment = environment;
          scene.environmentIntensity = 0.3;
          disposables.push(photoTexture, environment);
        }
        setProductPhoto(photoTexture);

        let object = null;
        if (modelUrl) {
          const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
          object = await new Promise((resolve, reject) => {
            new GLTFLoader().load(modelUrl, (gltf) => resolve(gltf.scene), undefined, reject);
          });
        } else {
          const build = getProduct3DBuilder(modelKey);
          if (!build) throw new Error(`Unknown 3D model: ${modelKey}`);
          object = build(THREE);
          setProductPhoto(null);
        }
        if (cancelled) return;

        object.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = true;
          o.receiveShadow = true;
          if (o.geometry) disposables.push(o.geometry);
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => disposables.push(m));
        });

        const bounds = new THREE.Box3().setFromObject(object);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.4 / maxDim;
        object.position.sub(center);
        object.scale.setScalar(scale);
        scene.add(object);

        const halfHeight = (size.y * scale) / 2;
        // Display mode (no controls) raises the model so an overlay card in the
        // lower part of the frame never hides it.
        const lift = interactive ? 0 : halfHeight * 0.45;
        object.position.y += lift;
        ground.position.y = -halfHeight - 0.002 + lift;
        camera.position.set(0, halfHeight * 0.8 + 0.2, 3.15);
        controls.target.set(0, 0, 0);
        controls.minDistance = 1.4;
        controls.maxDistance = 9;
        controls.update();

        setLoading(false);

        const loop = () => {
          if (cancelled) return;
          controls.update();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setProductPhoto(null);
      cancelAnimationFrame(raf);
      window.clearTimeout(hintTimer);
      resizeObserver?.disconnect();
      disposables.forEach((d) => d?.dispose?.());
      if (renderer) {
        renderer.dispose();
        renderer.domElement?.remove();
        renderer = null;
      }
    };
  }, [modelKey, modelUrl, interactive]);

  if ((!modelKey && !modelUrl) || failed) {
    return <Image src={fallbackImage} alt={title} className="h-full w-full object-cover" />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {interactive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,hsl(var(--card)),hsl(var(--secondary)))]"
        />
      )}
      <div
        ref={mountRef}
        className={`relative h-full w-full ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
        role="img"
        aria-label={`${t('productDetail.view3d')} — ${title}`}
      />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary">
          <Box className="h-6 w-6 animate-pulse text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{t('productDetail.loading3d')}</p>
        </div>
      )}
      {interactive && !loading && hintVisible && (
        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
          {t('productDetail.dragHint')}
        </p>
      )}
    </div>
  );
}