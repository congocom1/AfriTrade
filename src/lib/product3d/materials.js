/**
 * Shared materials for the procedural product models.
 * Created once per build from the lazy-loaded three.js namespace.
 */
export function createMaterials(THREE) {
  const standard = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05, ...extra });

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
  };
}