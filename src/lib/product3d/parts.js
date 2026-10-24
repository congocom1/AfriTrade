/**
 * Geometry helpers shared by every product model.
 * three.js is passed in (never imported here) so the library stays out of the main bundle.
 */
export function createParts(THREE) {
  const at = (mesh, pos = [0, 0, 0], rot = [0, 0, 0]) => {
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    return mesh;
  };

  const box = (w, h, d, material, pos, rot) => at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material), pos, rot);

  const cyl = (rTop, rBottom, h, material, pos, rot, segments = 32) =>
    at(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), material), pos, rot);

  const sphere = (r, material, pos, scale, segments = 24) => {
    const mesh = at(new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), material), pos);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    return mesh;
  };

  const capsule = (r, length, material, pos, rot) =>
    at(new THREE.Mesh(new THREE.CapsuleGeometry(r, length, 6, 20), material), pos, rot);

  const torus = (r, tube, material, pos, rot, arc = Math.PI * 2) =>
    at(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 14, 44, arc), material), pos, rot);

  const cone = (r, h, material, pos, rot, segments = 32) =>
    at(new THREE.Mesh(new THREE.ConeGeometry(r, h, segments), material), pos, rot);

  const plane = (w, h, material, pos, rot) =>
    at(new THREE.Mesh(new THREE.PlaneGeometry(w, h), material), pos, rot);

  const lathe = (profile, material, segments = 40) => {
    const points = profile.map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.Mesh(new THREE.LatheGeometry(points, segments), material);
  };

  const tube = (points, radius, material, closed = false) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])), closed);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 10, closed), material);
  };

  const roundedBox = (w, h, d, radius, material, pos, rot) => {
    const r = Math.min(radius, w / 2.2, h / 2.2);
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const bevel = Math.min(r * 0.5, d / 3);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.004, d - bevel * 2),
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 8,
    });
    geometry.center();
    return at(new THREE.Mesh(geometry, material), pos, rot);
  };

  const repeat = (count, fn) => Array.from({ length: count }, (_, index) => fn(index));

  const group = (children = []) => {
    const g = new THREE.Group();
    children.filter(Boolean).forEach((child) => g.add(child));
    return g;
  };

  return { at, box, cyl, sphere, capsule, torus, cone, plane, lathe, tube, roundedBox, repeat, group };
}