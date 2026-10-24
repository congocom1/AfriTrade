import { createParts } from '../parts.js';
import { createMaterials } from '../materials.js';

/** 5.5kW diesel generator: frame, engine, alternator, tank, control panel. */
export function buildGenerator(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const frame = P.group([
    P.box(1.3, 0.06, 0.06, M.darkMetal, [0, 0.06, -0.28]),
    P.box(1.3, 0.06, 0.06, M.darkMetal, [0, 0.06, 0.28]),
    P.box(0.06, 0.06, 0.56, M.darkMetal, [-0.6, 0.06, 0]),
    P.box(0.06, 0.06, 0.56, M.darkMetal, [0.6, 0.06, 0]),
    P.box(0.06, 0.06, 0.56, M.darkMetal, [0.15, 0.06, 0]),
    P.cyl(0.05, 0.05, 0.03, M.plasticBlack, [-0.5, 0.03, -0.28], [Math.PI / 2, 0, 0]),
    P.cyl(0.05, 0.05, 0.03, M.plasticBlack, [0.5, 0.03, -0.28], [Math.PI / 2, 0, 0]),
    P.cyl(0.05, 0.05, 0.03, M.plasticBlack, [-0.5, 0.03, 0.28], [Math.PI / 2, 0, 0]),
    P.cyl(0.05, 0.05, 0.03, M.plasticBlack, [0.5, 0.03, 0.28], [Math.PI / 2, 0, 0]),
  ]);

  const engine = P.group([
    P.box(0.46, 0.3, 0.34, M.darkMetal, [-0.22, 0.26, 0]),
    P.box(0.3, 0.12, 0.3, M.darkMetal, [-0.22, 0.45, 0]),
    ...P.repeat(6, (i) => P.cyl(0.012, 0.012, 0.06, M.steel, [-0.42 + i * 0.08, 0.5, -0.14])),
    P.cyl(0.055, 0.055, 0.34, M.steel, [0.16, 0.28, 0]),
    ...P.repeat(8, (i) => P.torus(0.062, 0.006, M.darkMetal, [0.16, 0.14 + i * 0.04, 0])),
    P.cyl(0.06, 0.06, 0.02, M.steel, [0.34, 0.28, 0], [0, 0, Math.PI / 2]),
    P.cyl(0.02, 0.02, 0.16, M.darkMetal, [-0.3, 0.62, -0.1]),
    P.cyl(0.028, 0.028, 0.05, M.darkMetal, [-0.3, 0.72, -0.1]),
    P.cyl(0.09, 0.09, 0.05, M.plasticDark, [0.42, 0.28, 0], [0, 0, Math.PI / 2]),
  ]);

  const tank = P.group([
    P.cyl(0.13, 0.13, 0.52, M.plasticRed, [0, 0.62, 0.04], [0, 0, Math.PI / 2]),
    P.cyl(0.132, 0.132, 0.02, M.plasticDark, [-0.2, 0.62, 0.04], [0, 0, Math.PI / 2]),
    P.cyl(0.132, 0.132, 0.02, M.plasticDark, [0.2, 0.62, 0.04], [0, 0, Math.PI / 2]),
    P.cyl(0.026, 0.026, 0.03, M.plasticDark, [0.1, 0.75, 0.04]),
    P.cyl(0.03, 0.03, 0.012, M.brass, [0.1, 0.77, 0.04]),
    P.box(0.04, 0.2, 0.04, M.darkMetal, [0, 0.42, 0.04]),
  ]);

  const panel = P.group([
    P.roundedBox(0.26, 0.24, 0.06, 0.01, M.plasticDark, [0.5, 0.44, 0.24]),
    P.roundedBox(0.13, 0.07, 0.008, 0.006, M.screenLit, [0.46, 0.5, 0.275]),
    P.cyl(0.018, 0.018, 0.02, M.plasticBlack, [0.57, 0.5, 0.275], [Math.PI / 2, 0, 0]),
    P.cyl(0.018, 0.018, 0.02, M.plasticBlack, [0.57, 0.42, 0.275], [Math.PI / 2, 0, 0]),
    P.cyl(0.022, 0.022, 0.02, M.plasticRed, [0.43, 0.38, 0.275], [Math.PI / 2, 0, 0]),
    P.cyl(0.022, 0.022, 0.02, M.plasticBlack, [0.51, 0.38, 0.275], [Math.PI / 2, 0, 0]),
    P.cyl(0.008, 0.008, 0.04, M.plasticGrey, [0.58, 0.62, 0.24]),
  ]);

  return P.group([frame, engine, tank, panel]);
}

/** 200A inverter welding machine with leads, holder and ground clamp. */
export function buildWelder(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const shell = new THREE.MeshStandardMaterial({ color: 0xd85a20, roughness: 0.45, metalness: 0.25 });

  const body = P.group([
    P.roundedBox(0.4, 0.3, 0.22, 0.018, shell),
    P.roundedBox(0.38, 0.09, 0.2, 0.012, M.plasticDark, [0, -0.1, 0]),
    P.roundedBox(0.16, 0.07, 0.006, 0.005, M.screenLit, [-0.06, 0.06, 0.112]),
    P.cyl(0.028, 0.028, 0.02, M.plasticBlack, [0.11, 0.06, 0.115], [Math.PI / 2, 0, 0]),
    P.cyl(0.012, 0.012, 0.014, M.led, [0.11, 0.06, 0.126], [Math.PI / 2, 0, 0]),
    P.cyl(0.016, 0.016, 0.022, M.copper, [-0.11, -0.04, 0.115], [Math.PI / 2, 0, 0]),
    P.cyl(0.016, 0.016, 0.022, M.copper, [0.02, -0.04, 0.115], [Math.PI / 2, 0, 0]),
    ...P.repeat(6, (i) => P.box(0.3, 0.006, 0.002, M.plasticDark, [0, 0.11 + i * 0.012, 0.111])),
    P.box(0.02, 0.14, 0.02, M.plasticDark, [-0.2, 0.02, 0.09], [0, 0, 0.2]),
    P.box(0.02, 0.14, 0.02, M.plasticDark, [0.2, 0.02, 0.09], [0, 0, -0.2]),
    P.box(0.34, 0.02, 0.02, M.plasticDark, [0, 0.17, 0.09]),
  ]);

  const cableA = P.tube([[-0.11, -0.04, 0.12], [-0.3, -0.1, 0.2], [-0.34, -0.16, 0.34], [-0.16, -0.15, 0.42]], 0.009, M.rubber);
  const holder = P.group([
    P.cyl(0.016, 0.02, 0.12, M.plasticDark, [-0.05, -0.14, 0.46], [0, 0, Math.PI / 2]),
    P.cyl(0.006, 0.006, 0.07, M.copper, [-0.13, -0.14, 0.46], [0, 0, Math.PI / 2]),
    P.box(0.03, 0.02, 0.03, M.copper, [0.03, -0.14, 0.46]),
  ]);

  const cableB = P.tube([[0.02, -0.04, 0.12], [0.24, -0.1, 0.24], [0.34, -0.15, 0.36]], 0.009, M.rubber);
  const clamp = P.group([
    P.box(0.05, 0.012, 0.05, M.copper, [0.38, -0.16, 0.38]),
    P.box(0.012, 0.05, 0.012, M.copper, [0.38, -0.14, 0.36]),
    P.box(0.012, 0.05, 0.012, M.copper, [0.38, -0.14, 0.4]),
    P.box(0.04, 0.03, 0.006, M.plasticYellow, [0.38, -0.13, 0.44]),
  ]);

  return P.group([body, cableA, holder, cableB, clamp]);
}

/** Manual maize sheller with hopper, drum, crank and stand. */
export function buildMaizeSheller(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const shell = new THREE.MeshStandardMaterial({ color: 0x2f6b57, roughness: 0.45, metalness: 0.3 });

  const body = P.group([
    P.cyl(0.16, 0.16, 0.44, shell, [0, 0.62, 0], [0, 0, 0], 28),
    P.cyl(0.17, 0.17, 0.03, M.darkMetal, [0, 0.41, 0]),
    P.cyl(0.24, 0.13, 0.24, shell, [0, 0.96, 0], [0, 0, 0], 28),
    P.torus(0.24, 0.012, M.darkMetal, [0, 1.07, 0]),
    P.cyl(0.13, 0.13, 0.02, M.darkMetal, [0, 0.84, 0]),
    P.box(0.26, 0.09, 0.18, M.darkMetal, [0.2, 0.46, 0], [0, 0, -0.35]),
    P.box(0.24, 0.02, 0.16, M.plasticDark, [0.24, 0.42, 0], [0, 0, -0.35]),
  ]);

  const crank = P.group([
    P.cyl(0.13, 0.13, 0.03, M.darkMetal, [-0.19, 0.68, 0], [0, 0, Math.PI / 2], 24),
    ...P.repeat(6, (i) => P.box(0.02, 0.24, 0.008, M.steel, [-0.175, 0.68, 0], [(i * Math.PI) / 6, 0, 0])),
    P.box(0.05, 0.24, 0.03, M.darkMetal, [-0.24, 0.8, 0]),
    P.cyl(0.02, 0.02, 0.12, M.plasticBlack, [-0.24, 0.95, 0], [0, 0, 0]),
    P.cyl(0.028, 0.028, 0.1, M.plasticBlack, [-0.24, 1.01, 0]),
  ]);

  const leg = (x, z) =>
    P.group([
      P.box(0.035, 0.44, 0.035, M.steel, [x, 0.22, z]),
      P.box(0.3, 0.025, 0.025, M.steel, [x * 0.5, 0.08, z]),
    ]);

  return P.group([body, crank, leg(-0.16, -0.16), leg(0.16, -0.16), leg(-0.16, 0.16), leg(0.16, 0.16)]);
}

/** 2 inch petrol water pump. */
export function buildWaterPump(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const shell = new THREE.MeshStandardMaterial({ color: 0xbe3628, roughness: 0.45, metalness: 0.3 });

  return P.group([
    P.box(0.42, 0.3, 0.3, M.darkMetal, [-0.16, 0.26, 0]),
    P.box(0.28, 0.1, 0.26, M.darkMetal, [-0.16, 0.45, 0]),
    P.roundedBox(0.36, 0.16, 0.26, 0.02, shell, [-0.1, 0.6, 0]),
    P.cyl(0.026, 0.026, 0.03, M.plasticDark, [-0.1, 0.69, 0]),
    P.cyl(0.028, 0.028, 0.012, M.brass, [-0.1, 0.71, 0]),
    P.cyl(0.06, 0.06, 0.12, M.plasticBlack, [-0.3, 0.5, 0.14], [Math.PI / 2, 0, 0]),
    P.cyl(0.075, 0.075, 0.02, M.steel, [-0.3, 0.5, 0.2], [Math.PI / 2, 0, 0]),
    P.cyl(0.13, 0.13, 0.14, M.darkMetal, [0.14, 0.26, 0], [0, 0, Math.PI / 2]),
    P.cyl(0.05, 0.05, 0.16, M.darkMetal, [0.14, 0.36, 0]),
    ...P.repeat(4, (i) => P.torus(0.056, 0.008, M.steel, [0.14, 0.2 + i * 0.04, 0])),
    P.cyl(0.055, 0.055, 0.14, M.steel, [0.14, 0.2, 0.19], [Math.PI / 2, 0, 0]),
    P.cyl(0.06, 0.06, 0.02, M.steel, [0.14, 0.2, 0.27], [Math.PI / 2, 0, 0]),
    P.cyl(0.05, 0.05, 0.12, M.steel, [0.14, 0.2, -0.19], [Math.PI / 2, 0, 0]),
    P.cyl(0.09, 0.09, 0.04, M.plasticDark, [0.24, 0.3, 0], [0, 0, Math.PI / 2]),
    ...P.repeat(3, (i) => P.torus(0.092, 0.006, M.plasticDark, [0.245 + i * 0.012, 0.3, 0])),
    P.box(0.03, 0.4, 0.03, M.steel, [-0.42, 0.3, 0.14], [0, 0, 0.25]),
    P.box(0.03, 0.4, 0.03, M.steel, [-0.42, 0.3, -0.14], [0, 0, 0.25]),
    P.cyl(0.014, 0.014, 0.34, M.plasticBlack, [-0.5, 0.5, 0], [0, 0, Math.PI / 2]),
    P.box(0.7, 0.05, 0.05, M.steel, [0, 0.06, -0.17]),
    P.box(0.7, 0.05, 0.05, M.steel, [0, 0.06, 0.17]),
    P.cyl(0.05, 0.05, 0.04, M.rubber, [-0.3, 0.05, -0.17], [Math.PI / 2, 0, 0]),
    P.cyl(0.05, 0.05, 0.04, M.rubber, [0.3, 0.05, -0.17], [Math.PI / 2, 0, 0]),
    P.cyl(0.05, 0.05, 0.04, M.rubber, [-0.3, 0.05, 0.17], [Math.PI / 2, 0, 0]),
    P.cyl(0.05, 0.05, 0.04, M.rubber, [0.3, 0.05, 0.17], [Math.PI / 2, 0, 0]),
  ]);
}

/** 1.5kW cassava grinding mill: hopper, chamber, motor, belt guard, trolley. */
export function buildGrindingMill(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const shell = new THREE.MeshStandardMaterial({ color: 0x1f7a4d, roughness: 0.5, metalness: 0.25 });

  const head = P.group([
    P.cyl(0.2, 0.2, 0.2, shell, [-0.24, 0.86, 0], [0, 0, 0], 28),
    P.cyl(0.21, 0.21, 0.03, M.darkMetal, [-0.24, 0.75, 0]),
    P.cyl(0.3, 0.19, 0.2, M.steel, [-0.24, 1.06, 0], [0, 0, 0], 28),
    P.torus(0.3, 0.014, M.darkMetal, [-0.24, 1.16, 0]),
    P.cyl(0.12, 0.12, 0.03, M.darkMetal, [-0.24, 0.96, 0]),
    P.box(0.26, 0.1, 0.2, M.steel, [-0.24, 0.7, 0.22], [0.4, 0, 0]),
    P.box(0.24, 0.02, 0.18, M.plasticDark, [-0.24, 0.66, 0.3], [0.4, 0, 0]),
  ]);

  const motor = P.group([
    P.cyl(0.11, 0.11, 0.3, M.darkMetal, [0.16, 0.6, 0], [0, 0, Math.PI / 2]),
    ...P.repeat(10, (i) => P.torus(0.115, 0.006, M.steel, [0.03 + i * 0.03, 0.6, 0])),
    P.cyl(0.05, 0.05, 0.06, M.darkMetal, [-0.03, 0.6, 0], [0, 0, Math.PI / 2]),
    P.cyl(0.09, 0.09, 0.03, M.steel, [-0.05, 0.6, 0], [0, 0, Math.PI / 2]),
    P.roundedBox(0.16, 0.14, 0.16, 0.02, M.darkMetal, [0.16, 0.72, 0]),
    P.cyl(0.02, 0.02, 0.12, M.plasticBlack, [0.16, 0.84, 0]),
    P.box(0.06, 0.1, 0.06, M.plasticDark, [-0.24, 0.6, 0.06], [0, 0, 0.3]),
    P.cyl(0.1, 0.1, 0.02, M.steel, [-0.06, 0.72, 0], [0, 0, Math.PI / 2]),
  ]);

  const trolley = P.group([
    P.box(0.9, 0.05, 0.5, M.darkMetal, [0, 0.42, 0]),
    P.box(0.05, 0.42, 0.05, M.darkMetal, [-0.42, 0.22, -0.22]),
    P.box(0.05, 0.42, 0.05, M.darkMetal, [0.42, 0.22, -0.22]),
    P.box(0.05, 0.42, 0.05, M.darkMetal, [-0.42, 0.22, 0.22]),
    P.box(0.05, 0.42, 0.05, M.darkMetal, [0.42, 0.22, 0.22]),
    P.cyl(0.14, 0.14, 0.06, M.rubber, [-0.42, 0.14, 0.22], [Math.PI / 2, 0, 0], 24),
    P.cyl(0.14, 0.14, 0.06, M.rubber, [-0.42, 0.14, -0.22], [Math.PI / 2, 0, 0], 24),
    P.cyl(0.05, 0.05, 0.03, M.steel, [-0.42, 0.14, 0.26], [Math.PI / 2, 0, 0], 20),
    P.cyl(0.05, 0.05, 0.03, M.steel, [-0.42, 0.14, -0.26], [Math.PI / 2, 0, 0], 20),
    P.box(0.03, 0.03, 0.44, M.darkMetal, [-0.5, 0.3, 0], [0, 0, 0.35]),
    P.box(0.03, 0.03, 0.44, M.darkMetal, [0.5, 0.3, 0], [0, 0, -0.35]),
    P.cyl(0.016, 0.016, 0.3, M.plasticBlack, [-0.58, 0.5, 0], [Math.PI / 2, 0, 0]),
  ]);

  return P.group([head, motor, trolley]);
}

/** Manual block making machine with a moulded block. */
export function buildBlockMachine(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);
  const shell = new THREE.MeshStandardMaterial({ color: 0x1f5fa8, roughness: 0.5, metalness: 0.25 });

  const frame = P.group([
    ...[-0.34, 0.34].flatMap((x) =>
      [-0.2, 0.2].map((z) => P.box(0.05, 0.62, 0.05, shell, [x, 0.31, z])),
    ),
    P.box(0.78, 0.05, 0.05, shell, [0, 0.62, -0.2]),
    P.box(0.78, 0.05, 0.05, shell, [0, 0.62, 0.2]),
    P.box(0.78, 0.05, 0.05, shell, [0, 0.3, -0.2]),
    P.box(0.78, 0.05, 0.05, shell, [0, 0.3, 0.2]),
    P.box(0.05, 0.05, 0.45, shell, [-0.34, 0.5, 0]),
    P.box(0.05, 0.05, 0.45, shell, [0.34, 0.5, 0]),
  ]);

  const mould = P.group([
    P.box(0.5, 0.02, 0.3, M.darkMetal, [0, 0.2, 0]),
    P.box(0.5, 0.2, 0.02, M.darkMetal, [0, 0.31, 0.14]),
    P.box(0.5, 0.2, 0.02, M.darkMetal, [0, 0.31, -0.14]),
    P.box(0.02, 0.2, 0.3, M.darkMetal, [-0.24, 0.31, 0]),
    P.box(0.02, 0.2, 0.3, M.darkMetal, [0.24, 0.31, 0]),
    P.box(0.46, 0.03, 0.26, M.steel, [0, 0.42, 0]),
    P.box(0.4, 0.16, 0.2, M.plasticGrey, [0, 0.31, 0]),
    P.cyl(0.035, 0.035, 0.17, M.plasticGrey, [-0.1, 0.31, 0]),
    P.cyl(0.035, 0.035, 0.17, M.plasticGrey, [0.1, 0.31, 0]),
  ]);

  const lever = P.group([
    P.box(0.05, 0.05, 0.5, M.darkMetal, [0, 0.44, 0]),
    P.cyl(0.03, 0.03, 0.9, M.darkMetal, [0, 0.46, 0.36], [Math.PI / 2, 0, 0], 20),
    P.cyl(0.07, 0.07, 0.12, M.darkMetal, [0, 0.46, 0.78], [Math.PI / 2, 0, 0], 24),
    P.cyl(0.018, 0.018, 0.22, M.plasticBlack, [0, 0.46, -0.1], [Math.PI / 2, 0, 0]),
    P.cyl(0.024, 0.024, 0.16, M.plasticBlack, [0, 0.46, -0.24], [Math.PI / 2, 0, 0]),
    P.cyl(0.05, 0.05, 0.04, M.steel, [0, 0.44, 0.2], [Math.PI / 2, 0, 0], 20),
  ]);

  return P.group([frame, mould, lever]);
}