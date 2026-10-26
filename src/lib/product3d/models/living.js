import { createParts } from '../parts.js';
import { createMaterials } from '../materials.js';

/** 6-seater dining table set. */
export function buildDiningSet(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const chair = (x, z, rotY) => {
    const group = P.group([
      P.box(0.44, 0.04, 0.44, M.wood, [0, 0.45, 0]),
      P.box(0.44, 0.46, 0.035, M.wood, [0, 0.68, -0.2]),
      P.box(0.36, 0.03, 0.03, M.woodDark, [0, 0.6, -0.19]),
      P.box(0.36, 0.03, 0.03, M.woodDark, [0, 0.72, -0.19]),
      ...[[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([lx, lz]) =>
        P.box(0.04, 0.44, 0.04, M.wood, [lx, 0.22, lz]),
      ),
    ]);
    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    return group;
  };

  const table = P.group([
    P.box(1.8, 0.05, 0.9, M.wood, [0, 0.75, 0]),
    P.box(1.72, 0.06, 0.82, M.woodDark, [0, 0.7, 0]),
    ...[[-0.82, -0.37], [0.82, -0.37], [-0.82, 0.37], [0.82, 0.37]].map(([lx, lz]) =>
      P.box(0.07, 0.72, 0.07, M.woodDark, [lx, 0.36, lz]),
    ),
  ]);

  return P.group([
    table,
    chair(-0.55, -0.72, Math.PI),
    chair(0.55, -0.72, Math.PI),
    chair(-0.55, 0.72, 0),
    chair(0.55, 0.72, 0),
    chair(-1.2, 0, Math.PI / 2),
    chair(1.2, 0, -Math.PI / 2),
  ]);
}

/** Solid wood 3-seater sofa with cushions. */
export function buildSofa(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  return P.group([
    P.roundedBox(2, 0.3, 0.9, 0.05, M.photoShell(2, 0.9) || M.fabric, [0, 0.25, 0]),
    P.roundedBox(1.6, 0.42, 0.2, 0.05, M.fabric, [0, 0.62, -0.34], [-0.06, 0, 0]),
    P.roundedBox(0.22, 0.5, 0.9, 0.06, M.fabric, [-1, 0.36, 0]),
    P.roundedBox(0.22, 0.5, 0.9, 0.06, M.fabric, [1, 0.36, 0]),
    P.roundedBox(0.24, 0.06, 0.82, 0.03, M.fabric, [-1, 0.62, 0]),
    P.roundedBox(0.24, 0.06, 0.82, 0.03, M.fabric, [1, 0.62, 0]),
    ...P.repeat(3, (i) =>
      P.group([
        P.roundedBox(0.58, 0.16, 0.62, 0.05, M.fabricCream, [-0.6 + i * 0.6, 0.48, 0.06]),
        P.roundedBox(0.56, 0.4, 0.16, 0.05, M.fabricCream, [-0.6 + i * 0.6, 0.72, -0.26], [-0.12, 0, 0]),
      ]),
    ),
    ...[[-0.88, -0.36], [0.88, -0.36], [-0.88, 0.36], [0.88, 0.36]].map(([lx, lz]) =>
      P.cyl(0.03, 0.038, 0.1, M.woodDark, [lx, 0.05, lz], [0, 0, 0], 16),
    ),
    P.box(1.98, 0.02, 0.02, M.fabricCream, [0, 0.41, 0.44]),
  ]);
}

/** Handwoven raffia floor basket. */
export function buildBasket(THREE) {
  const P = createParts(THREE);
  const raffia = new THREE.MeshStandardMaterial({ color: 0xd9c39a, roughness: 0.95 });
  const raffiaDark = new THREE.MeshStandardMaterial({ color: 0xbfa275, roughness: 0.95 });

  const body = P.at(new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.22, 0.42, 40, 1, true), raffia), [0, 0.22, 0]);

  const rings = P.repeat(9, (i) => {
    const t = i / 8;
    const radius = 0.22 + t * 0.07;
    return P.torus(radius, 0.009, i % 2 ? raffiaDark : raffia, [0, 0.02 + i * 0.05, 0], [Math.PI / 2, 0, 0], Math.PI * 2);
  });

  const ribs = P.repeat(24, (i) => {
    const angle = (i / 24) * Math.PI * 2;
    const radius = 0.255;
    return P.box(0.018, 0.42, 0.006, raffiaDark, [Math.cos(angle) * radius, 0.22, Math.sin(angle) * radius], [0, -angle, 0.055]);
  });

  const handle = (side) =>
    P.torus(0.075, 0.014, raffia, [side * 0.29, 0.35, 0], [0, Math.PI / 2, 0], Math.PI);

  return P.group([
    body,
    ...rings,
    ...ribs,
    P.torus(0.29, 0.022, raffiaDark, [0, 0.42, 0], [Math.PI / 2, 0, 0]),
    P.cyl(0.22, 0.22, 0.022, raffiaDark, [0, 0.011, 0], [0, 0, 0], 32),
    handle(1),
    handle(-1),
  ]);
}

/** Set of four wax print cushion covers. */
export function buildCushions(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const cushion = (pos, rot, accent) =>
    P.group([
      P.roundedBox(0.45, 0.45, 0.14, 0.045, M.photoShell(0.45, 0.45) || M.fabricCream, pos, rot),
      P.roundedBox(0.4, 0.012, 0.008, 0.004, accent, [pos[0], pos[1] + 0.09, pos[2] + 0.072], rot),
      P.roundedBox(0.4, 0.012, 0.008, 0.004, M.fabricOrange, [pos[0], pos[1] - 0.02, pos[2] + 0.072], rot),
      P.roundedBox(0.4, 0.012, 0.008, 0.004, accent, [pos[0], pos[1] - 0.13, pos[2] + 0.072], rot),
      P.roundedBox(0.012, 0.4, 0.008, 0.004, M.fabricYellow, [pos[0] - 0.16, pos[1], pos[2] + 0.072], rot),
    ]);

  return P.group([
    cushion([0, 0.075, 0], [0, 0, 0], M.fabricGreen),
    cushion([0.02, 0.225, 0], [0, 0.04, 0], M.fabricYellow),
    cushion([-0.36, 0.24, 0.02], [-0.42, 0.3, 0], M.fabricGreen),
    cushion([0.34, 0.24, 0.05], [-0.38, -0.28, 0], M.fabricOrange),
  ]);
}

/** Men's wax print shirt on a hanger. */
export function buildShirt(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const cloth = M.photoShell(0.46, 0.58) || new THREE.MeshStandardMaterial({ color: 0x1f5fa8, roughness: 0.95 });

  const shirt = P.group([
    P.roundedBox(0.46, 0.58, 0.06, 0.02, cloth),
    P.roundedBox(0.5, 0.1, 0.06, 0.02, cloth, [0, 0.3, 0]),
    P.roundedBox(0.16, 0.32, 0.055, 0.02, cloth, [-0.3, 0.14, 0], [0, 0, 0.24]),
    P.roundedBox(0.16, 0.32, 0.055, 0.02, cloth, [0.3, 0.14, 0], [0, 0, -0.24]),
    P.roundedBox(0.15, 0.09, 0.05, 0.015, M.fabricYellow, [-0.12, 0.32, 0.008], [0, 0, 0.5]),
    P.roundedBox(0.15, 0.09, 0.05, 0.015, M.fabricYellow, [0.12, 0.32, 0.008], [0, 0, -0.5]),
    P.roundedBox(0.04, 0.5, 0.02, 0.008, M.fabricYellow, [0, -0.02, 0.032]),
    P.roundedBox(0.11, 0.09, 0.014, 0.006, M.fabricOrange, [0.13, 0.1, 0.034]),
    ...P.repeat(4, (i) =>
      P.roundedBox(0.46, 0.014, 0.006, 0.004, i % 2 ? M.fabricYellow : M.fabricGreen, [0, -0.17 + i * 0.13, 0.033]),
    ),
    ...P.repeat(5, (i) => P.cyl(0.008, 0.008, 0.006, M.plasticWhite, [0, 0.2 - i * 0.11, 0.045], [Math.PI / 2, 0, 0], 12)),
  ]);

  const hanger = P.group([
    P.cyl(0.009, 0.009, 0.44, M.woodDark, [0, 0.42, 0], [0, 0, Math.PI / 2], 16),
    P.cyl(0.007, 0.007, 0.09, M.steel, [0, 0.46, 0], [0, 0, 0.18], 12),
    P.torus(0.035, 0.006, M.steel, [0.03, 0.52, 0], [0, 0, 0], Math.PI * 1.45),
  ]);

  return P.group([shirt, hanger]);
}

/** Women's Ankara midi dress on a hanger. */
export function buildDress(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const cloth = M.photoShell(0.34, 0.3) || new THREE.MeshStandardMaterial({ color: 0xb13a63, roughness: 0.95 });

  const bodice = P.group([
    P.roundedBox(0.34, 0.3, 0.15, 0.05, cloth, [0, 0.45, 0]),
    P.roundedBox(0.32, 0.04, 0.16, 0.015, M.fabricYellow, [0, 0.3, 0]),
    P.roundedBox(0.06, 0.2, 0.05, 0.02, cloth, [-0.1, 0.66, 0], [0, 0, 0.1]),
    P.roundedBox(0.06, 0.2, 0.05, 0.02, cloth, [0.1, 0.66, 0], [0, 0, -0.1]),
    ...P.repeat(3, (i) => P.roundedBox(0.34, 0.014, 0.006, 0.004, i % 2 ? M.fabricOrange : M.fabricYellow, [0, 0.4 + i * 0.08, 0.077])),
  ]);

  const skirtBands = [
    [0.392, -0.2],
    [0.331, -0.06],
    [0.27, 0.08],
    [0.209, 0.22],
  ];
  const skirt = P.group([
    P.cyl(0.17, 0.44, 0.62, cloth, [0, 0, 0], [0, 0, 0], 40),
    ...skirtBands.map(([radius, y], i) =>
      P.torus(radius, 0.007, i % 2 ? M.fabricYellow : M.fabricOrange, [0, y, 0], [Math.PI / 2, 0, 0]),
    ),
  ]);
  skirt.position.y = -0.03;

  const hanger = P.group([
    P.cyl(0.009, 0.009, 0.3, M.woodDark, [0, 0.78, 0], [0, 0, Math.PI / 2], 16),
    P.torus(0.035, 0.006, M.steel, [0, 0.85, 0], [0, 0, 0], Math.PI * 1.45),
  ]);

  const dress = P.group([bodice, skirt]);
  dress.position.y = 0.75;

  return P.group([dress, hanger]);
}

/** 100ml argan hair oil bottle. */
export function buildHairOil(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const amber = new THREE.MeshStandardMaterial({ color: 0xb4761f, roughness: 0.24, metalness: 0.1, transparent: true, opacity: 0.88 });

  const bottle = P.lathe([
    [0.002, 0],
    [0.03, 0.004],
    [0.033, 0.02],
    [0.033, 0.085],
    [0.026, 0.1],
    [0.015, 0.112],
    [0.014, 0.135],
  ], amber);

  return P.group([
    bottle,
    P.cyl(0.0345, 0.0345, 0.055, M.photoShell(0.217, 0.055) || M.label, [0, 0.045, 0], [0, 0, 0], 32),
    P.cyl(0.0352, 0.0352, 0.012, M.accent, [0, 0.078, 0], [0, 0, 0], 32),
    P.cyl(0.0352, 0.0352, 0.008, M.accentOrange, [0, 0.018, 0], [0, 0, 0], 32),
    P.cone(0.008, 0.02, M.fabricGreen, [0.012, 0.055, 0.035], [0, 0, -0.4]),
    P.cyl(0.017, 0.017, 0.026, M.plasticDark, [0, 0.147, 0], [0, 0, 0], 28),
    P.torus(0.0165, 0.003, M.plasticDark, [0, 0.158, 0], [Math.PI / 2, 0, 0]),
    P.cyl(0.013, 0.013, 0.01, M.plasticGrey, [0, 0.164, 0], [0, 0, 0], 24),
  ]);
}

/** 250ml shea butter body cream jar. */
export function buildCreamJar(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  return P.group([
    P.cyl(0.046, 0.044, 0.07, M.plasticWhite, [0, 0.035, 0], [0, 0, 0], 40),
    P.cyl(0.0475, 0.0475, 0.01, M.plasticWhite, [0, 0.072, 0], [0, 0, 0], 40),
    P.cyl(0.049, 0.049, 0.024, M.accent, [0, 0.089, 0], [0, 0, 0], 40),
    P.torus(0.048, 0.004, M.accent, [0, 0.077, 0], [Math.PI / 2, 0, 0]),
    P.cyl(0.0492, 0.0492, 0.008, M.accentOrange, [0, 0.1, 0], [0, 0, 0], 40),
    P.cyl(0.0465, 0.0465, 0.03, M.photoShell(0.292, 0.03) || M.label, [0, 0.036, 0], [0, 0, 0], 40),
    P.cyl(0.0472, 0.0472, 0.008, M.accent, [0, 0.05, 0], [0, 0, 0], 40),
    P.cone(0.007, 0.018, M.fabricGreen, [0.015, 0.03, 0.044], [0, 0, -0.5]),
  ]);
}

/** Digital blood pressure monitor with cuff. */
export function buildBloodPressureMonitor(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const cuffFabric = new THREE.MeshStandardMaterial({ color: 0x3b4a5a, roughness: 0.95 });

  const body = P.group([
    P.roundedBox(0.12, 0.1, 0.04, 0.014, M.photoShell(0.12, 0.1) || M.plasticWhite),
    P.roundedBox(0.07, 0.04, 0.006, 0.006, M.screenLit, [0, 0.022, 0.021]),
    P.cyl(0.012, 0.012, 0.008, M.plasticGrey, [-0.03, -0.03, 0.021], [Math.PI / 2, 0, 0], 20),
    P.cyl(0.012, 0.012, 0.008, M.plasticGrey, [0, -0.03, 0.021], [Math.PI / 2, 0, 0], 20),
    P.cyl(0.012, 0.012, 0.008, M.plasticRed, [0.03, -0.03, 0.021], [Math.PI / 2, 0, 0], 20),
    P.roundedBox(0.1, 0.012, 0.006, 0.004, M.accent, [0, 0.036, 0.021]),
    P.cyl(0.008, 0.008, 0.02, M.plasticGrey, [-0.06, -0.02, 0], [0, 0, Math.PI / 2], 16),
  ]);

  const cuff = P.group([
    P.cyl(0.062, 0.062, 0.14, cuffFabric, [0, 0, 0], [0, 0, 0], 32),
    P.cyl(0.066, 0.066, 0.02, M.plasticGrey, [0, 0.075, 0], [0, 0, 0], 32),
    P.roundedBox(0.1, 0.05, 0.012, 0.006, M.plasticDark, [0.05, 0.02, 0.045]),
    P.box(0.06, 0.004, 0.01, M.plasticGrey, [0.03, 0.0, 0.055]),
  ]);
  cuff.children[0].geometry.dispose();
  cuff.children[0].geometry = new THREE.CylinderGeometry(0.062, 0.062, 0.14, 32, 1, true);
  cuff.position.set(0.16, 0.07, 0);
  cuff.rotation.set(0, 0, Math.PI / 2);

  const tube = P.tube([[0.055, -0.015, 0], [0.1, -0.03, 0.03], [0.14, 0.0, 0.02], [0.16, 0.02, 0]], 0.005, M.rubber);

  return P.group([body, cuff, tube]);
}

/** Fingertip pulse oximeter. */
export function buildOximeter(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const shell = new THREE.MeshStandardMaterial({ color: 0x2b6fa8, roughness: 0.42, metalness: 0.15 });

  const lower = P.group([
    P.capsule(0.018, 0.05, shell, [0, 0, 0], [Math.PI / 2, 0, 0]),
    P.roundedBox(0.03, 0.012, 0.05, 0.005, M.plasticDark, [0, 0.014, -0.006]),
    P.cyl(0.006, 0.006, 0.008, M.plasticGrey, [0, 0.014, 0.02], [Math.PI / 2, 0, 0], 16),
  ]);

  const upper = P.group([
    P.capsule(0.018, 0.05, shell, [0, 0, 0], [Math.PI / 2, 0, 0]),
    P.roundedBox(0.03, 0.006, 0.026, 0.004, M.screenLit, [0, 0.014, -0.012]),
  ]);
  upper.position.set(0, 0.036, 0.002);
  upper.rotation.set(-0.34, 0, 0);

  return P.group([
    lower,
    upper,
    P.cyl(0.01, 0.01, 0.03, M.plasticGrey, [0, 0.018, 0.03], [0, 0, Math.PI / 2], 18),
    P.torus(0.012, 0.003, M.steel, [0, 0.018, 0.03], [Math.PI / 2, 0, 0]),
    P.roundedBox(0.032, 0.006, 0.01, 0.003, M.accent, [0, -0.014, -0.012]),
  ]);
}