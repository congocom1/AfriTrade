/**
 * Shared materials for the procedural product models.
 * Created once per build from the lazy-loaded three.js namespace.
 */

// The viewer loads the product's real photo and hands it over before a model
// builds, so screens and printed faces show the actual product instead of flat
// colour. Null keeps the original studio-material look.
let PHOTO = null;

export function setProductPhoto(texture) {
  PHOTO = texture || null;
}

/** Crops the photo to the panel's own aspect so nothing is squashed. */
function coverFit(THREE, texture, panelWidth, panelHeight) {
  const fitted = texture.clone();
  fitted.needsUpdate = true;
  fitted.wrapS = THREE.ClampToEdgeWrapping;
  fitted.wrapT = THREE.ClampToEdgeWrapping;
  const imageAspect = (texture.image?.width || 1) / (texture.image?.height || 1);
  const panelAspect = panelWidth / panelHeight;
  if (imageAspect > panelAspect) {
    fitted.repeat.set(panelAspect / imageAspect, 1);
    fitted.offset.set((1 - panelAspect / imageAspect) / 2, 0);
  } else {
    fitted.repeat.set(1, imageAspect / panelAspect);
    fitted.offset.set(0, (1 - imageAspect / panelAspect) / 2);
  }
  return fitted;
}

export function createMaterials(THREE) {
  const standard = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05, ...extra });

  // Printed face: sack, carton, label. Plain paper when no photo is loaded.
  const photoPanel = (w, h) =>
    PHOTO
      ? new THREE.MeshStandardMaterial({ map: coverFit(THREE, PHOTO, w, h), roughness: 0.58, metalness: 0.04 })
      : standard(0xe9e3d6, { roughness: 0.88 });

  // Screen: the photo doubles as the light source, so it reads as switched on.
  const screenPhoto = (w, h) => {
    if (!PHOTO) {
      return standard(0x123a5e, { roughness: 0.2, metalness: 0.1, emissive: 0x0b2a45, emissiveIntensity: 0.7 });
    }
    const map = coverFit(THREE, PHOTO, w, h);
    return new THREE.MeshStandardMaterial({
      map,
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: 0.4,
      roughness: 0.14,
      metalness: 0.12,
    });
  };

  return {
    steel: standard(0xb4bac1, { roughness: 0.34, metalness: 0.9 }),
    alu: standard(0xd2d7dd, { roughness: 0.3, metalness: 0.85 }),
    darkMetal: standard(0x3b4046, { roughness: 0.45, metalness: 0.75 }),
    chrome: standard(0xe6eaee, { roughness: 0.12, metalness: 1 }),
    copper: standard(0xb87333, { roughness: 0.35, metalness: 0.85 }),
    brass: standard(0xc9a45c, { roughness: 0.3, metalness: 0.9 }),

    rubber: standard(0x1b1e22, { roughness: 0.94, metalness: 0 }),
    tyre: standard(0x15181b, { roughness: 0.96, metalness: 0 }),
    grip: standard(0x24282d, { roughness: 0.88, metalness: 0 }),

    plasticBlack: standard(0x2a2e33, { roughness: 0.55 }),
    plasticDark: standard(0x1a1d21, { roughness: 0.5 }),
    plasticWhite: standard(0xf1f3f5, { roughness: 0.42 }),
    plasticGrey: standard(0x9aa1a9, { roughness: 0.6 }),
    plasticRed: standard(0xbe3628, { roughness: 0.5 }),
    plasticBlue: standard(0x1f5fa8, { roughness: 0.5 }),
    plasticGreen: standard(0x1f7a4d, { roughness: 0.5 }),
    plasticYellow: standard(0xdfa600, { roughness: 0.5 }),
    plasticOrange: standard(0xd85a20, { roughness: 0.5 }),

    screen: standard(0x0a1120, { roughness: 0.14, metalness: 0.25 }),
    screenLit: standard(0x123a5e, { roughness: 0.2, metalness: 0.1, emissive: 0x0b2a45, emissiveIntensity: 0.7 }),
    led: standard(0x8fe3ff, { roughness: 0.2, emissive: 0x3fb6e6, emissiveIntensity: 1.4 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xcfe6f5, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.32 }),

    wood: standard(0x9a6b3f, { roughness: 0.72 }),
    woodDark: standard(0x5c3b23, { roughness: 0.74 }),
    woodLight: standard(0xc79a63, { roughness: 0.7 }),

    fabric: standard(0x63798c, { roughness: 0.96 }),
    fabricCream: standard(0xe4dccd, { roughness: 0.96 }),
    fabricGreen: standard(0x2f6b57, { roughness: 0.96 }),
    fabricOrange: standard(0xcf6a22, { roughness: 0.96 }),
    fabricYellow: standard(0xe3ae37, { roughness: 0.96 }),
    fabricRed: standard(0x9e3a2f, { roughness: 0.96 }),
    leather: standard(0x4a3527, { roughness: 0.62 }),

    paper: standard(0xd7cbb3, { roughness: 0.92 }),
    paperWhite: standard(0xf2f0ea, { roughness: 0.92 }),
    woven: standard(0xe9e2d3, { roughness: 0.95 }),
    ceramic: standard(0xf6f6f4, { roughness: 0.24 }),

    label: standard(0xfbfbf8, { roughness: 0.82 }),
    accent: standard(0x008066, { roughness: 0.45 }),
    accentOrange: standard(0xe4572e, { roughness: 0.5 }),

    photoPanel,
    screenPhoto,
  };
}