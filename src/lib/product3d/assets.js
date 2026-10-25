/**
 * Real 3D model files.
 *
 * Most products use a model the browser builds from geometry. A product can
 * also ship an actual .glb/.gltf file (Product.model_3d_url) and the viewer
 * renders that instead, with the file's own materials and animation.
 *
 * These demo files exist so the file path is browsable before sellers upload
 * their own. Every url is public and CORS-enabled, so three.js loads it
 * straight from the CDN. Replace them with your own uploads as they arrive.
 */
const SAMPLE = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

export const DEMO_MODEL_FILES = [
  {
    key: 'file-sheen-chair',
    label: 'Sheen Chair',
    family: 'Furniture',
    url: `${SAMPLE}/SheenChair/glTF-Binary/SheenChair.glb`,
  },
  {
    key: 'file-boom-box',
    label: 'Boom Box',
    family: 'Electronics',
    url: `${SAMPLE}/BoomBox/glTF-Binary/BoomBox.glb`,
  },
  {
    key: 'file-water-bottle',
    label: 'Water Bottle',
    family: 'Home & decor',
    url: `${SAMPLE}/WaterBottle/glTF-Binary/WaterBottle.glb`,
  },
  {
    key: 'file-lantern',
    label: 'Lantern',
    family: 'Home & decor',
    url: `${SAMPLE}/Lantern/glTF-Binary/Lantern.glb`,
  },
  {
    key: 'file-toy-car',
    label: 'Toy Car',
    family: 'Automotive parts',
    url: `${SAMPLE}/ToyCar/glTF-Binary/ToyCar.glb`,
  },
];

/** Credit shown with the demo files, so their licence is traceable. */
export const DEMO_MODEL_CREDIT = 'Khronos glTF Sample Assets (CC BY 4.0)';