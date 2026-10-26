import { createParts } from '../parts.js';
import { createMaterials } from '../materials.js';

/** 265/65 R17 tyre with rim, spokes and tread blocks. */
export function buildTyre(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const tyre = P.torus(0.302, 0.086, M.tyre);
  tyre.scale.set(1, 1, 1.55);

  const tread = P.repeat(44, (i) => {
    const angle = (i / 44) * Math.PI * 2;
    return P.group([
      P.box(0.028, 0.02, 0.11, M.grip, [Math.cos(angle) * 0.383, Math.sin(angle) * 0.383, 0.055], [0, 0, angle]),
      P.box(0.028, 0.02, 0.11, M.grip, [Math.cos(angle) * 0.383, Math.sin(angle) * 0.383, -0.055], [0, 0, angle]),
      P.box(0.03, 0.016, 0.02, M.grip, [Math.cos(angle) * 0.39, Math.sin(angle) * 0.39, 0], [0, 0, angle]),
    ]);
  });

  const rim = P.group([
    P.cyl(0.216, 0.216, 0.2, M.alu, [0, 0, 0], [Math.PI / 2, 0, 0], 40),
    P.torus(0.205, 0.016, M.alu, [0, 0, 0.1]),
    P.torus(0.205, 0.016, M.alu, [0, 0, -0.1]),
    P.cyl(0.16, 0.16, 0.006, M.alu, [0, 0, 0.1], [Math.PI / 2, 0, 0], 32),
    ...P.repeat(5, (i) => {
      const angle = (i / 5) * Math.PI * 2;
      return P.box(0.03, 0.13, 0.03, M.alu, [Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, 0.1], [0, 0, angle + Math.PI / 2]);
    }),
    P.cyl(0.06, 0.06, 0.09, M.alu, [0, 0, 0.09], [Math.PI / 2, 0, 0], 28),
    P.cyl(0.032, 0.032, 0.02, M.steel, [0, 0, 0.14], [Math.PI / 2, 0, 0], 20),
    ...P.repeat(5, (i) => {
      const angle = (i / 5) * Math.PI * 2 + Math.PI / 5;
      return P.cyl(0.014, 0.014, 0.02, M.steel, [Math.cos(angle) * 0.062, Math.sin(angle) * 0.062, 0.14], [Math.PI / 2, 0, 0], 6);
    }),
    P.cyl(0.008, 0.008, 0.05, M.rubber, [0.19, 0.09, 0.1], [Math.PI / 2, 0, 0], 10),
  ]);

  return P.group([tyre, ...tread, rim]);
}

/** Front brake pad set: backing plates, friction material, clips. */
export function buildBrakePads(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const pad = (offset, tilt) => {
    const group = P.group([
      P.roundedBox(0.155, 0.062, 0.006, 0.006, M.steel),
      P.roundedBox(0.145, 0.054, 0.014, 0.006, M.grip, [0, 0, 0.01]),
      P.box(0.14, 0.006, 0.004, M.darkMetal, [0, -0.03, 0.012]),
      P.box(0.02, 0.05, 0.004, M.steel, [0.07, 0.01, 0.004]),
      P.cyl(0.008, 0.008, 0.01, M.steel, [-0.06, -0.02, -0.006], [Math.PI / 2, 0, 0], 12),
      P.cyl(0.008, 0.008, 0.01, M.steel, [0.06, -0.02, -0.006], [Math.PI / 2, 0, 0], 12),
    ]);
    group.position.set(offset[0], offset[1], offset[2]);
    group.rotation.set(tilt[0], tilt[1], tilt[2]);
    return group;
  };

  return P.group([pad([-0.1, 0.031, 0], [0, 0, 0]), pad([0.1, 0.031, 0.02], [0, -0.12, 0])]);
}

/** Corrugated roofing sheet, 3 m long. */
export function buildRoofingSheet(THREE) {
  const P = createParts(THREE);
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.36, metalness: 0.9 });

  const ribs = P.repeat(10, (i) => P.cyl(0.05, 0.05, 3, steel, [-0.45 + i * 0.1, 0, 0], [Math.PI / 2, 0, 0], 20));
  const crests = P.repeat(10, (i) => P.cyl(0.046, 0.046, 3, steel, [-0.45 + i * 0.1, 0.045, 0], [Math.PI / 2, 0, 0], 20));

  const sheet = P.group([...ribs, ...crests]);
  sheet.rotation.z = 0.012;

  return P.group([
    sheet,
    P.box(0.06, 0.02, 3, steel, [-0.5, 0.03, 0]),
    P.box(0.06, 0.02, 3, steel, [0.5, 0.03, 0]),
  ]);
}

/** 50 kg Portland cement sack with a printed band. */
export function buildCementSack(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const kraft = new THREE.MeshStandardMaterial({ color: 0xbaa88a, roughness: 0.92 });

  const sack = (y, tilt) => {
    const group = P.group([
      P.roundedBox(0.56, 0.16, 0.36, 0.035, M.photoShell(0.56, 0.16) || kraft),
      P.roundedBox(0.5, 0.03, 0.3, 0.014, kraft, [0, 0.085, 0]),
      P.roundedBox(0.48, 0.014, 0.28, 0.006, M.paperWhite, [0, 0.105, 0]),
      P.box(0.3, 0.07, 0.006, M.photoPanel(0.3, 0.07), [0, 0, 0.181]),
      P.roundedBox(0.3, 0.02, 0.008, 0.004, M.accent, [0, 0.028, 0.183]),
      P.roundedBox(0.3, 0.014, 0.008, 0.004, M.accentOrange, [0, -0.03, 0.183]),
      ...P.repeat(7, (i) => P.box(0.02, 0.002, 0.002, M.paperWhite, [-0.09 + i * 0.03, 0.108, 0.001])),
    ]);
    group.position.y = y;
    group.rotation.set(tilt[0], tilt[1], tilt[2]);
    return group;
  };

  return P.group([sack(0.08, [0, 0, 0]), sack(0.245, [0, 0.06, 0.01])]);
}

/** Kraft carton 40x30x30 cm with open flaps and tape. */
export function buildCarton(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const W = 0.4;
  const H = 0.3;
  const D = 0.3;
  const flap = (w, d, x, z, rx, rz) => P.box(w, 0.006, d, M.paper, [x, H / 2 + 0.004, z], [rx, 0, rz]);

  return P.group([
    P.box(W, H, D, M.photoShell(W, H) || M.paper, [0, H / 2, 0]),
    flap(W, D / 2, 0, -D / 4, -1.35, 0),
    flap(W, D / 2, 0, D / 4, 1.35, 0),
    flap(D, W / 2, -W / 4, 0, 0, -1.35),
    flap(D, W / 2, W / 4, 0, 0, 1.35),
    P.box(0.07, 0.004, D + 0.02, M.plasticGrey, [0, H / 2 + 0.008, 0]),
    P.box(W + 0.002, 0.06, 0.002, M.paperWhite, [0, H * 0.4, -D / 2 - 0.002]),
    P.box(W * 0.6, 0.03, 0.003, M.accent, [0, H * 0.4, -D / 2 - 0.003]),
    P.box(0.14, 0.09, 0.002, M.photoPanel(0.14, 0.09), [W / 2 + 0.002, H * 0.6, 0], [0, Math.PI / 2, 0]),
    P.box(W + 0.004, 0.004, 0.004, M.paperWhite, [0, H * 0.55, -D / 2 - 0.001]),
    P.box(W + 0.004, 0.004, 0.004, M.paperWhite, [0, H * 0.25, -D / 2 - 0.001]),
  ]);
}

/** Bundle of 100 polypropylene 50 kg sacks. */
export function buildSacks(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const woven = new THREE.MeshStandardMaterial({ color: 0xece7dc, roughness: 0.95 });

  const sack = (pos, rot) => {
    const group = P.group([
      P.roundedBox(0.62, 0.13, 0.4, 0.03, M.photoShell(0.62, 0.13) || woven),
      P.roundedBox(0.5, 0.03, 0.3, 0.012, woven, [0, 0.07, 0]),
      P.roundedBox(0.46, 0.01, 0.26, 0.004, M.plasticGrey, [0, 0.088, 0]),
      P.box(0.2, 0.05, 0.004, M.photoPanel(0.2, 0.05), [0, 0, 0.201]),
      P.roundedBox(0.2, 0.014, 0.006, 0.004, M.accent, [0, 0.018, 0.202]),
      P.box(0.6, 0.002, 0.004, M.paperWhite, [0, -0.02, 0.202]),
    ]);
    group.position.set(pos[0], pos[1], pos[2]);
    group.rotation.set(rot[0], rot[1], rot[2]);
    return group;
  };

  return P.group([
    sack([0, 0.065, 0], [0, 0.03, 0]),
    sack([0.03, 0.195, -0.02], [0, -0.05, 0]),
    sack([-0.02, 0.325, 0.02], [0, 0.07, 0]),
    sack([0.02, 0.455, -0.01], [0, -0.03, 0]),
    P.torus(0.22, 0.008, M.plasticGrey, [0.01, 0.26, 0], [Math.PI / 2, 0, 0], Math.PI * 1.35),
    sack([0.5, 0.065, 0.12], [0.1, 0.6, 0]),
  ]);
}