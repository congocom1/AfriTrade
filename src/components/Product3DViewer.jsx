import React, { useEffect, useRef, useState } from 'react';
import { Box } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { getProduct3DBuilder } from '@/lib/product3d/registry';

/**
 * 3D product viewer (experience layer, never mandatory).
 * - modelKey -> geometry built in the browser by the product 3D library.
 * - modelUrl -> a GLTF/GLB file, kept for products that ship one.
 * - Load or WebGL failure -> falls back to the photo, never a blank canvas.
 * - prefers-reduced-motion -> static first frame, no auto-rotate.
 * three.js is lazy-imported so the main bundle stays untouched.
 */
export default function Product3DViewer({ modelKey, modelUrl, fallbackImage, title }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!modelKey && !modelUrl) return;
    let cancelled = false;
    let renderer = null;
    let resizeObserver = null;
    let raf = 0;
    const disposables = [];

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
        renderer.toneMappingExposure = 1.05;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, w / h, 0.05, 100);

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
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far = 24;
        key.shadow.camera.left = -5;
        key.shadow.camera.right = 5;
        key.shadow.camera.top = 5;
        key.shadow.camera.bottom = -5;
        key.shadow.bias = -0.0009;
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.5);
        fill.position.set(-4, 2, -3);
        scene.add(fill);
        const rim = new THREE.DirectionalLight(0xffffff, 0.75);
        rim.position.set(-2, 3, -5);
        scene.add(rim);

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.16 }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        disposables.push(ground.geometry, ground.material);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minPolarAngle = 0.15;
        controls.maxPolarAngle = Math.PI / 2.04;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        controls.autoRotate = !reduced;
        controls.autoRotateSpeed = 1.4;

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
        ground.position.y = -halfHeight - 0.002;
        camera.position.set(0, halfHeight * 0.85 + 0.25, 3.3);
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
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      disposables.forEach((d) => d?.dispose?.());
      if (renderer) {
        renderer.dispose();
        renderer.domElement?.remove();
        renderer = null;
      }
    };
  }, [modelKey, modelUrl]);

  if ((!modelKey && !modelUrl) || failed) {
    return <Image src={fallbackImage} alt={title} className="h-full w-full object-cover" />;
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" role="img" aria-label={`Vue 3D — ${title}`} />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary">
          <Box className="h-6 w-6 animate-pulse text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Chargement de la vue 3D…</p>
        </div>
      )}
    </div>
  );
}