import { createParts } from '../parts.js';
import { createMaterials } from '../materials.js';

/** 450W monocrystalline solar panel on a tilted stand. */
export function buildSolarPanel(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const W = 1.96;
  const D = 0.99;
  const T = 0.055;

  const panel = P.group([
    P.box(W, T, D, M.alu),
    P.box(W - 0.07, T * 0.6, D - 0.07, M.screen, [0, T * 0.3, 0]),
    ...P.repeat(10, (row) =>
      P.repeat(6, (col) => {
        const cw = (D - 0.11) / 6;
        const ch = (W - 0.11) / 10;
        return P.box(ch - 0.01, 0.005, cw - 0.01, M.screenLit, [
          -(W - 0.11) / 2 + ch * (row + 0.5),
          T * 0.36,
          -(D - 0.11) / 2 + cw * (col + 0.5),
        ]);
      }),
    ).flat(),
    P.box(W, 0.035, 0.05, M.alu, [0, -T * 0.55, -D * 0.3]),
    P.box(W, 0.035, 0.05, M.alu, [0, -T * 0.55, D * 0.3]),
    P.box(0.13, 0.035, 0.09, M.plasticDark, [0, -T * 0.6, D * 0.14]),
    P.tube([[0, -T * 0.6, D * 0.14], [0.1, -T * 0.6, D * 0.3]], 0.008, M.plasticBlack),
  ]);
  panel.rotation.x = -0.2;
  panel.position.y = 0.42;

  const leg = (x) =>
    P.group([
      P.cyl(0.018, 0.018, 0.42, M.alu, [x, 0.21, D * 0.2]),
      P.cyl(0.018, 0.018, 0.44, M.alu, [x, 0.22, -D * 0.12], [0.18, 0, 0]),
      P.box(0.05, 0.02, 0.5, M.alu, [x, 0.012, D * 0.04]),
    ]);

  return P.group([panel, leg(-W * 0.36), leg(W * 0.36)]);
}

/** 200Ah deep-cycle battery with carry handles and terminal posts. */
export function buildSolarBattery(THREE) {
  const P = createParts(THREE);
  const M = createMaterials(THREE);

  const L = 0.52;
  const H = 0.24;
  const D = 0.24;

  const body = P.group([
    P.roundedBox(L, H, D, 0.02, M.plasticDark),
    P.box(L - 0.02, 0.02, D - 0.02, M.plasticBlack, [0, H / 2, 0]),
    P.box(L - 0.16, 0.09, 0.006, M.label, [0, -0.005, D / 2 + 0.002]),
    P.box(L - 0.16, 0.016, 0.008, M.accent, [0, 0.055, D / 2 + 0.003]),
    P.box(L - 0.16, 0.012, 0.008, M.accentOrange, [0, -0.055, D / 2 + 0.003]),
  ]);

  const terminal = (x, material) =>
    P.group([
      P.cyl(0.016, 0.016, 0.035, M.brass, [x, H / 2 + 0.024, D * 0.28]),
      P.cyl(0.024, 0.024, 0.008, material, [x, H / 2 + 0.042, D * 0.28]),
    ]);

  const caps = P.repeat(6, (i) => P.cyl(0.014, 0.014, 0.012, M.plasticGrey, [-L / 2 + 0.09 + i * 0.07, H / 2 + 0.012, -D * 0.2]));

  const handle = (x) =>
    P.group([
      P.torus(0.055, 0.008, M.plasticBlack, [x, H / 2 - 0.01, 0], [0, Math.PI / 2, 0], Math.PI),
      P.box(0.012, 0.02, 0.03, M.plasticBlack, [x, H / 2 - 0.04, -0.055]),
      P.box(0.012, 0.02, 0.03, M.plasticBlack, [x, H / 2 - 0.04, 0.055]),
    ]);

  const ribs = P.repeat(4, (i) => P.box(0.012, H * 0.7, 0.004, M.plasticBlack, [-L / 2 + 0.13 + i * 0.09, 0, -D / 2 - 0.002]));

  return P.group([body, ...caps, ...ribs, handle(-L / 2 + 0.06), handle(L / 2 - 0.06), terminal(-L * 0.22, M.plasticRed), terminal(L * 0.22, M.plasticBlack)]);
}