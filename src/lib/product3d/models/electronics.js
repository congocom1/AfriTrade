import { createParts } from '../parts.js';
import { createMaterials } from '../materials.js';

function buildLaptop(THREE, { width = 0.32, depth = 0.22, shell }) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const body = new THREE.MeshStandardMaterial({ color: shell, roughness: 0.35, metalness: 0.55 });

  const base = P.group([
    P.roundedBox(width, 0.014, depth, 0.006, body, [0, 0.007, 0]),
    P.box(width - 0.03, 0.002, depth * 0.45, M.plasticDark, [0, 0.015, -depth * 0.22]),
    ...P.repeat(5, (row) =>
      P.repeat(14, (col) =>
        P.box((width - 0.06) / 14 - 0.002, 0.002, (depth * 0.42) / 5 - 0.003, M.plasticDark, [
          -(width - 0.06) / 2 + ((width - 0.06) / 14) * (col + 0.5),
          0.0155,
          -depth * 0.24 + ((depth * 0.42) / 5) * (row + 0.5),
        ]),
      ),
    ).flat(),
    P.roundedBox(width * 0.28, 0.002, depth * 0.22, 0.004, M.plasticGrey, [0, 0.015, depth * 0.26]),
  ]);

  const lid = P.group([
    P.roundedBox(width, depth * 0.94, 0.008, 0.005, body),
    P.box(width - 0.022, depth * 0.9, 0.004, M.screen, [0, 0, 0.006]),
    P.box(width - 0.06, depth * 0.82, 0.002, M.screenLit, [0, 0.006, 0.009]),
    P.cyl(0.005, 0.005, 0.005, M.plasticDark, [0, depth * 0.42, 0.006], [Math.PI / 2, 0, 0]),
  ]);
  lid.rotation.x = -0.28;
  lid.position.set(0, depth * 0.45, -depth / 2 - 0.004);

  return P.group([base, lid]);
}

/** HP EliteBook style business laptop. */
export const buildLaptopEliteBook = (THREE) => buildLaptop(THREE, { width: 0.32, depth: 0.22, shell: 0xc9ced4 });

/** Lenovo IdeaPad style laptop, slightly larger and darker. */
export const buildLaptopIdeaPad = (THREE) => buildLaptop(THREE, { width: 0.36, depth: 0.25, shell: 0x3d4249 });

function buildPhone(THREE, { cameras, bodyColor, screenColor }) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const body = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.35, metalness: 0.4 });
  const screen = new THREE.MeshStandardMaterial({ color: screenColor, roughness: 0.12, metalness: 0.2, emissive: 0x0d2c4a, emissiveIntensity: 0.55 });

  const W = 0.076;
  const H = 0.164;
  const T = 0.009;

  return P.group([
    P.roundedBox(W, H, T, 0.011, body),
    P.roundedBox(W - 0.005, H - 0.008, 0.002, 0.009, M.plasticDark, [0, 0, T / 2 + 0.001]),
    P.roundedBox(W - 0.012, H - 0.02, 0.001, 0.007, screen, [0, 0.002, T / 2 + 0.002]),
    P.roundedBox(W * 0.34, W * 0.34, 0.004, 0.008, M.plasticDark, [-W * 0.22, H * 0.36, -T / 2 - 0.002]),
    ...P.repeat(cameras, (i) =>
      P.group([
        P.cyl(0.009, 0.009, 0.004, M.chrome, [-W * 0.22 + (i % 2) * 0.02, H * 0.36 - Math.floor(i / 2) * 0.02, -T / 2 - 0.005], [Math.PI / 2, 0, 0]),
        P.cyl(0.005, 0.005, 0.005, M.plasticDark, [-W * 0.22 + (i % 2) * 0.02, H * 0.36 - Math.floor(i / 2) * 0.02, -T / 2 - 0.006], [Math.PI / 2, 0, 0]),
      ]),
    ),
    P.box(0.002, 0.014, 0.003, M.chrome, [W / 2 + 0.0005, H * 0.28, 0]),
    P.box(0.002, 0.02, 0.003, M.chrome, [W / 2 + 0.0005, H * 0.24, 0]),
    P.box(0.012, 0.002, 0.003, M.chrome, [0, -H / 2 + 0.002, 0]),
  ]);
}

/** itel A70 — entry level, single rear camera. */
export const buildPhoneItel = (THREE) => buildPhone(THREE, { cameras: 1, bodyColor: 0x1e2a44, screenColor: 0x0a1730 });

/** Tecno Spark 20C — triple rear camera. */
export const buildPhoneTecno = (THREE) => buildPhone(THREE, { cameras: 3, bodyColor: 0x123b2e, screenColor: 0x07281f });

/** 43" smart LED television on its stand. */
export function buildTelevision(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const W = 0.96;
  const H = 0.56;

  return P.group([
    P.roundedBox(W, H, 0.026, 0.008, M.plasticDark),
    P.box(W - 0.014, H - 0.014, 0.004, M.screen, [0, 0, 0.014]),
    P.box(W - 0.03, H - 0.05, 0.002, M.screenLit, [0, 0.004, 0.017]),
    P.box(W * 0.5, 0.006, 0.004, M.plasticGrey, [0, -H / 2 + 0.004, 0.014]),
    P.box(0.05, 0.22, 0.03, M.darkMetal, [0, -H / 2 - 0.1, 0]),
    P.roundedBox(0.34, 0.016, 0.2, 0.008, M.plasticDark, [0, -H / 2 - 0.21, 0]),
    P.box(0.02, 0.006, 0.006, M.led, [W / 2 - 0.03, -H / 2 + 0.012, 0.016]),
    P.box(W - 0.2, 0.012, 0.01, M.plasticGrey, [0, -H / 2 + 0.02, -0.016]),
  ]);
}

/** JBL PartyBox style party speaker with light rings. */
export function buildSpeaker(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const W = 0.3;
  const H = 0.55;
  const D = 0.32;

  const drivers = (y, r) =>
    P.group([
      P.torus(r, 0.012, M.plasticBlack, [0, y, D / 2 + 0.002]),
      P.cyl(r, r, 0.012, M.grip, [0, y, D / 2 - 0.002], [Math.PI / 2, 0, 0]),
      P.cone(r * 0.55, 0.05, M.plasticDark, [0, y, D / 2 - 0.03], [Math.PI / 2, 0, 0]),
      P.torus(r * 0.62, 0.008, M.led, [0, y, D / 2 + 0.008]),
    ]);

  return P.group([
    P.roundedBox(W, H, D, 0.022, M.plasticDark),
    drivers(-H * 0.16, 0.1),
    drivers(H * 0.2, 0.062),
    P.box(W * 0.9, 0.02, 0.012, M.plasticGrey, [0, H * 0.44, D / 2 - 0.002]),
    P.cyl(0.006, 0.006, W * 0.7, M.plasticBlack, [0, H / 2 + 0.02, 0], [0, 0, Math.PI / 2]),
    P.roundedBox(W * 0.5, 0.05, 0.02, 0.008, M.plasticBlack, [0, -H / 2 + 0.035, D / 2 + 0.006]),
    P.cyl(0.014, 0.014, 0.012, M.plasticGrey, [0, -H / 2 + 0.035, D / 2 + 0.018], [Math.PI / 2, 0, 0]),
    P.box(W * 0.14, 0.006, 0.004, M.led, [-W * 0.2, -H / 2 + 0.035, D / 2 + 0.017]),
    P.torus(0.03, 0.01, M.plasticBlack, [-W / 2 + 0.01, -H / 2 + 0.02, 0], [0, 0, 0], Math.PI * 0.5),
    P.torus(0.03, 0.01, M.plasticBlack, [W / 2 - 0.01, -H / 2 + 0.02, 0], [0, 0, 0], Math.PI * 0.5),
    P.box(W * 0.6, 0.004, 0.2, M.plasticBlack, [0, -H / 2 - 0.004, 0]),
  ]);
}

/** Sokany 3-in-1 blender: motor base, ribbed jug, lid. */
export function buildBlender(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const base = P.group([
    P.cyl(0.062, 0.075, 0.1, M.plasticGrey, [0, 0.05, 0]),
    P.cyl(0.062, 0.062, 0.02, M.plasticDark, [0, 0.11, 0]),
    P.cyl(0.03, 0.03, 0.012, M.chrome, [0, 0.126, 0]),
    P.roundedBox(0.05, 0.03, 0.012, 0.006, M.plasticDark, [0.07, 0.05, 0]),
    P.cyl(0.014, 0.014, 0.008, M.chrome, [0.07, 0.05, 0.008], [Math.PI / 2, 0, 0]),
    P.box(0.028, 0.005, 0.004, M.led, [-0.058, 0.075, 0.02]),
  ]);

  const jug = P.group([
    P.cyl(0.052, 0.058, 0.24, M.glass, [0, 0.25, 0]),
    ...P.repeat(4, (i) => P.torus(0.056, 0.003, M.plasticGrey, [0, 0.17 + i * 0.05, 0])),
    P.cyl(0.056, 0.052, 0.014, M.plasticBlack, [0, 0.372, 0]),
    P.cone(0.03, 0.035, M.plasticDark, [0, 0.396, 0]),
    P.cyl(0.01, 0.01, 0.012, M.plasticBlack, [0, 0.418, 0]),
    P.roundedBox(0.016, 0.2, 0.02, 0.008, M.plasticBlack, [0.066, 0.26, 0]),
    P.box(0.05, 0.006, 0.05, M.steel, [0, 0.135, 0], [0, Math.PI / 4, 0]),
  ]);

  return P.group([base, jug]);
}

/** Hisense 220L double door fridge. */
export function buildFridge(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const W = 0.55;
  const H = 1.45;
  const D = 0.6;
  const shell = new THREE.MeshStandardMaterial({ color: 0xdfe3e7, roughness: 0.42, metalness: 0.35 });

  return P.group([
    P.roundedBox(W, H, D, 0.014, shell),
    P.roundedBox(W - 0.006, H * 0.3, 0.012, 0.008, shell, [0, H * 0.34, D / 2 + 0.006]),
    P.roundedBox(W - 0.006, H * 0.66, 0.012, 0.008, shell, [0, -H * 0.16, D / 2 + 0.006]),
    P.box(W - 0.05, 0.004, 0.006, M.plasticGrey, [0, H * 0.19, D / 2 + 0.008]),
    P.cyl(0.012, 0.012, 0.26, M.chrome, [-W * 0.38, H * 0.32, D / 2 + 0.022]),
    P.cyl(0.012, 0.012, 0.42, M.chrome, [-W * 0.38, -H * 0.16, D / 2 + 0.022]),
    P.box(0.14, 0.05, 0.006, M.label, [W * 0.2, H * 0.42, D / 2 + 0.008]),
    P.box(0.1, 0.008, 0.006, M.accent, [W * 0.2, H * 0.47, D / 2 + 0.009]),
    P.box(0.02, 0.008, 0.004, M.led, [W * 0.2, H * 0.4, D / 2 + 0.009]),
    ...P.repeat(4, (i) => P.cyl(0.018, 0.018, 0.03, M.plasticDark, [-W * 0.36 + i * (W * 0.72 / 3), -H / 2 - 0.012, D * 0.32])),
    P.box(W * 0.8, 0.01, D * 0.7, M.plasticGrey, [0, -H * 0.48, 0]),
    P.box(W * 0.9, 0.5, 0.012, M.plasticGrey, [0, -H * 0.1, -D / 2 - 0.008]),
  ]);
}