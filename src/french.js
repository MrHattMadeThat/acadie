import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Procedural stand-ins for the French side of the story: the ship, the habitation's buildings, and the trade goods.
// Sizes are in metres. Each model's root is named, and parts a question can point at are named too.

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
function shadowed(obj) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return obj;
}

// ------------------------------------------------------------------ textures

function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Vertical boards with dark gaps: the walls of the habitation.
let boardTex;
function boards() {
  return (boardTex ||= canvasTex(128, 128, (g) => {
    for (let i = 0; i < 8; i++) {
      const v = 150 + rnd() * 40;
      g.fillStyle = `rgb(${v},${v * 0.82},${v * 0.6})`;
      g.fillRect(i * 16, 0, 16, 128);
      g.fillStyle = 'rgba(60,40,25,0.55)';
      g.fillRect(i * 16, 0, 1.5, 128);
      for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(90,65,40,${0.1 + rnd() * 0.15})`; g.fillRect(i * 16 + 3 + rnd() * 10, rnd() * 128, 1, 8 + rnd() * 30); }
    }
  }));
}
// Rows of wooden shingles.
let shingleTex;
function shingles() {
  return (shingleTex ||= canvasTex(128, 128, (g) => {
    g.fillStyle = '#6d5a48'; g.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) for (let i = 0; i < 9; i++) {
      const v = 80 + rnd() * 40;
      g.fillStyle = `rgb(${v},${v * 0.86},${v * 0.72})`;
      g.fillRect(i * 16 - (r % 2) * 8, r * 16, 15, 15);
      g.fillStyle = 'rgba(30,20,10,0.5)';
      g.fillRect(i * 16 - (r % 2) * 8, r * 16 + 14, 16, 2);
    }
  }));
}

// ------------------------------------------------------------------ buildings

// A timber house with a steep roof and a chimney. `w` along the ridge, `d` across, `h` to the eaves.
export function house({ w = 8, d = 5, h = 2.6, roof = 0.85, chimney = true, name = 'house', tint = '#ffffff' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const wallMat = mat(tint, { map: boards() });
  wallMat.map = boards().clone();
  wallMat.map.repeat.set(w / 2.5, h / 2.5);
  wallMat.map.needsUpdate = true;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), wallMat);
  walls.name = `${name}_walls`;
  // gable roof: a prism along x
  const rh = (d / 2) * roof * 2;
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2 - 0.35, 0); shape.lineTo(0, rh); shape.lineTo(d / 2 + 0.35, 0); shape.lineTo(-d / 2 - 0.35, 0);
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: w + 0.5, bevelEnabled: false }).translate(0, 0, -(w + 0.5) / 2).rotateY(Math.PI / 2).translate(0, h, 0);
  const roofMat = mat('#ffffff', { map: shingles().clone() });
  roofMat.map.repeat.set(w / 3, rh / 2);
  roofMat.map.needsUpdate = true;
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.name = `${name}_roof`;
  root.add(walls, roofMesh);
  // a door and two shuttered windows on the long side facing +z
  const dark = mat('#3e2c1e');
  root.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.08).translate(-w * 0.15, 0.9, d / 2 + 0.02), dark));
  for (const x of [w * 0.15, w * 0.35]) root.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.08).translate(x, h * 0.6, d / 2 + 0.02), dark));
  if (chimney) {
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.8, rh + 1.4, 0.8).translate(w / 2 - 1, h + (rh + 1.4) / 2 - 0.4, 0), mat('#8a8178'));
    ch.name = `${name}_chimney`;
    root.add(ch);
    root.userData.chimneyTop = [w / 2 - 1, h + rh + 1.1, 0];
  }
  // stone footing that stays when the building is taken down
  const foot = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3).translate(0, 0.05, 0), mat('#8c877e'));
  foot.name = `${name}_footing`;
  foot.userData.stays = true;
  root.add(foot);
  return shadowed(root);
}

// A bread oven: a clay dome.
export function oven() {
  const root = new THREE.Group();
  root.name = 'oven';
  root.add(new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.8, 1.2), mat('#a7795a')));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.3).translate(0, 0.3, 1.6), mat('#3a2a20')));
  return shadowed(root);
}

// A small chapel with a cross on the gable.
export function chapel() {
  const root = house({ w: 7, d: 4.5, h: 2.8, roof: 1, chimney: false, name: 'chapel', tint: '#f0e6d6' });
  const wood = mat('#5b4532');
  const cross = mergeGeometries([new THREE.BoxGeometry(0.16, 1.5, 0.16).translate(0, 0.75, 0), new THREE.BoxGeometry(0.8, 0.16, 0.16).translate(0, 1.05, 0)]);
  const m = new THREE.Mesh(cross, wood);
  m.position.set(3.4, 2.8 + 4.5 * 0.5 * 2 * 1 - 0.2, 0);
  root.add(m);
  return shadowed(root);
}

// A plain wooden grave cross.
export function graveCross() {
  return new THREE.Mesh(
    mergeGeometries([new THREE.BoxGeometry(0.1, 1.0, 0.08).translate(0, 0.5, 0), new THREE.BoxGeometry(0.5, 0.08, 0.08).translate(0, 0.72, 0)]),
    mat('#6d5844'),
  );
}

// A palisade: pointed stakes along a polyline of [x, z] points, each standing on groundAt(x, z).
export function palisade(points, height = 2.6, groundAt = () => 0) {
  const geos = [];
  for (let k = 1; k < points.length; k++) {
    const [x0, z0] = points[k - 1], [x1, z1] = points[k];
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 0.32);
    for (let i = 0; i < n; i++) {
      const t = i / n, h = height * (0.9 + rnd() * 0.18);
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = groundAt(x, z) - 0.4;
      geos.push(new THREE.CylinderGeometry(0.15, 0.17, h + 0.4, 5).translate(x, y + (h + 0.4) / 2, z));
      geos.push(new THREE.ConeGeometry(0.16, 0.4, 5).translate(x, y + h + 0.6, z));
    }
  }
  const m = new THREE.Mesh(mergeGeometries(geos), mat('#7d6a52'));
  m.name = 'palisade';
  return shadowed(m);
}

// Garden beds: dark rows with green that grows with `growth` (0 bare earth, 1 full).
export function garden(w = 14, d = 10, rows = 7) {
  const root = new THREE.Group();
  root.name = 'garden';
  root.add(new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d).translate(0, 0.02, 0), mat('#5d4532')));
  const green = mat('#5e8a3a');
  const plants = [];
  for (let r = 0; r < rows; r++) {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 0.25, d / rows * 0.55).translate(0, 0.18, -d / 2 + (r + 0.5) * (d / rows)), mat('#6b4f38'));
    root.add(bed);
    const pl = new THREE.Mesh(new THREE.BoxGeometry(w - 1.4, 0.35, d / rows * 0.4).translate(0, 0.4, -d / 2 + (r + 0.5) * (d / rows)), green);
    plants.push(pl);
    root.add(pl);
  }
  root.userData.grow = (g) => plants.forEach((p) => { p.visible = g > 0.05; p.scale.set(1, Math.max(0.05, g), 1); });
  // a low wattle fence
  const fence = [];
  for (const [x, z, L, rot] of [[0, -d / 2, w, 0], [0, d / 2, w, 0], [-w / 2, 0, d, Math.PI / 2], [w / 2, 0, d, Math.PI / 2]]) {
    fence.push(new THREE.BoxGeometry(L, 0.7, 0.08).translate(0, 0.35, 0).rotateY(rot).translate(x, 0, z));
  }
  root.add(new THREE.Mesh(mergeGeometries(fence), mat('#8a7354')));
  return shadowed(root);
}

// A cannon on a wooden carriage.
export function cannon() {
  const root = new THREE.Group();
  root.name = 'cannon';
  const iron = mat('#3b3d40', { metalness: 0.6, roughness: 0.5 });
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 2.2, 10).rotateZ(Math.PI / 2).translate(0.3, 0.75, 0), iron));
  const wood = mat('#6e5238');
  root.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.7).translate(-0.1, 0.45, 0), wood));
  for (const x of [-0.5, 0.4]) for (const z of [-0.42, 0.42]) root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 10).rotateX(Math.PI / 2).translate(x, 0.28, z), wood));
  return shadowed(root);
}

// A tree in the middle of the square (Champlain's plan shows one).
export function squareTree() {
  const root = new THREE.Group();
  root.name = 'square_tree';
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 5, 7).translate(0, 2.5, 0), mat('#6b5a48')));
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1).translate(0, 6, 0), mat('#5d7e3a'));
  crown.name = 'square_tree_crown';
  root.add(crown);
  return shadowed(root);
}

// A stack of firewood.
export function woodpile(n = 1) {
  const g = [];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - r; i++) g.push(new THREE.CylinderGeometry(0.13, 0.13, 1.1, 6).rotateX(Math.PI / 2).translate((i - (5 - r) / 2) * 0.27, 0.13 + r * 0.24, 0));
  const m = new THREE.Mesh(mergeGeometries(g), mat('#8b6e4e'));
  m.name = 'woodpile';
  m.scale.setScalar(n);
  return shadowed(m);
}

// A barrel (cider, salt, flour...).
export function barrel() {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.85, 12, 3).translate(0, 0.43, 0), mat('#8a6440'));
  const P = m.geometry.attributes.position;
  for (let i = 0; i < P.count; i++) { const k = 1 + 0.12 * Math.cos(((P.getY(i) - 0.43) / 0.43) * Math.PI / 2); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); }
  m.geometry.computeVertexNormals();
  m.name = 'barrel';
  return shadowed(m);
}

// ------------------------------------------------------------------ trade goods and fish

// A bundle of beaver pelts: flat oval skins in a pile.
export function pelts() {
  const root = new THREE.Group();
  root.name = 'pelts';
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 14).scale(1, 1, 0.75), mat(i % 2 ? '#5a3d28' : '#6b4a30', { roughness: 1 }));
    m.position.set((rnd() - 0.5) * 0.15, 0.04 + i * 0.05, (rnd() - 0.5) * 0.15);
    m.rotation.y = rnd() * 3;
    root.add(m);
  }
  return shadowed(root);
}
export function axe() {
  const root = new THREE.Group();
  root.name = 'axe';
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.7, 6).rotateZ(Math.PI / 2).translate(0, 0.04, 0), mat('#8b6b48')));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.2).translate(0.33, 0.04, 0.05), mat('#55585c', { metalness: 0.7, roughness: 0.4 })));
  return shadowed(root);
}
export function knife() {
  const root = new THREE.Group();
  root.name = 'knife';
  root.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.035).translate(-0.08, 0.02, 0), mat('#6b4a30')));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.035).translate(0.08, 0.02, 0), mat('#a8acb0', { metalness: 0.8, roughness: 0.3 })));
  return shadowed(root);
}
export function cloth() {
  const root = new THREE.Group();
  root.name = 'cloth';
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 12).rotateZ(Math.PI / 2).translate(0, 0.13, 0), mat('#a63a2e')));
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12).rotateZ(Math.PI / 2).translate(0, 0.13, 0.27), mat('#2f4f8a')));
  return shadowed(root);
}
// Split cod drying on a flake (a raised rack of poles and boughs).
export function codFlake(len = 4) {
  const root = new THREE.Group();
  root.name = 'cod_flake';
  const pole = mat('#8b7356');
  const g = [];
  for (const x of [-len / 2 + 0.2, 0, len / 2 - 0.2]) for (const z of [-0.7, 0.7]) g.push(new THREE.CylinderGeometry(0.05, 0.06, 1.0, 5).translate(x, 0.5, z));
  g.push(new THREE.BoxGeometry(len, 0.06, 1.6).translate(0, 1.0, 0));
  root.add(new THREE.Mesh(mergeGeometries(g), pole));
  const fish = mat('#e2d6b8', { roughness: 0.9 });
  for (let i = 0; i < Math.floor(len * 3); i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 4).rotateX(Math.PI / 2).scale(1, 0.12, 1), fish);
    m.position.set(-len / 2 + 0.3 + (i % Math.floor(len * 1.5)) * 0.66, 1.06, i < len * 1.5 ? -0.35 : 0.35);
    m.rotation.y = (rnd() - 0.5) * 0.3;
    root.add(m);
  }
  return shadowed(root);
}

// ------------------------------------------------------------------ boats

// A loft between cross-sections: a smooth hull from bow (u=0) to stern (u=1).
function loft(L, B, D, { sheer = (u) => 0, width = (u) => 1, nu = 40, nv = 10 } = {}) {
  const pos = [], idx = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu, w = (B / 2) * width(u), top = D + sheer(u);
    for (let j = 0; j <= nv; j++) {
      const a = (j / nv - 0.5) * Math.PI; // around the hull from port gunwale, under the keel, to starboard
      const k = Math.sign(a) * Math.pow(Math.abs(Math.sin(a)), 0.7); // fuller sides than a plain ellipse
      pos.push(-L / 2 + u * L, top * (1 - Math.cos(a)), k * w);
    }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * (nv + 1) + j, b = a + nv + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A small ocean-going ship of about 1600, at anchor with its sails furled. Bow toward -x.
export function ship({ length = 22 } = {}) {
  const L = length, B = L * 0.3, D = L * 0.16;
  const root = new THREE.Group();
  root.name = 'ship';
  const width = (u) => Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05 + 0.02)), 0.55) * (u > 0.7 ? 1 - (u - 0.7) * 0.6 : 1);
  const sheer = (u) => 0.9 * Math.pow(1 - u * 2, 2) * (u < 0.5 ? 0.8 : 0) + (u > 0.72 ? (u - 0.72) * 9 : 0);
  const hullGeo = loft(L, B, D, { width, sheer });
  const hullMat = mat('#4a3a2c', { side: THREE.DoubleSide, map: boards().clone() });
  hullMat.map.rotation = Math.PI / 2;
  hullMat.map.repeat.set(4, 10);
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.position.y = -D * 0.55; // waterline
  hullMesh.name = 'ship_hull';
  root.add(hullMesh);
  // a deck, a raised stern castle and a little forecastle
  const deckY = D * 0.45;
  root.add(new THREE.Mesh(new THREE.BoxGeometry(L * 0.86, 0.2, B * 0.82).translate(0, deckY, 0), mat('#a88a63')));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(L * 0.24, 2.2, B * 0.78).translate(L * 0.36, deckY + 1.1, 0), mat('#6a4f36', { map: boards() })));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(L * 0.12, 1.2, B * 0.6).translate(-L * 0.38, deckY + 0.6, 0), mat('#6a4f36', { map: boards() })));
  // masts and yards with furled sails
  const spar = mat('#5c4632'), canvas = mat('#e8e0cc');
  const masts = [[-L * 0.28, 13], [0.02 * L, 17], [L * 0.33, 10]];
  for (const [x, h] of masts) {
    root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, h, 8).translate(x, deckY + h / 2, 0), spar));
    for (const f of [0.55, 0.85]) {
      if (h < 12 && f > 0.6) continue;
      const yl = B * (f > 0.6 ? 0.8 : 1.15);
      root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, yl, 6).rotateX(Math.PI / 2).translate(x, deckY + h * f, 0), spar));
      root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, yl * 0.9, 8).rotateX(Math.PI / 2).translate(x + 0.15, deckY + h * f - 0.2, 0), canvas));
    }
  }
  // bowsprit
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, L * 0.4, 6).rotateZ(Math.PI / 2 - 0.35).translate(-L * 0.6, deckY + 2.2, 0), spar));
  root.userData.deckY = deckY;
  return shadowed(root);
}

// A shallop: the open boat the French used to row and sail between ship and shore.
export function shallop() {
  const root = new THREE.Group();
  root.name = 'shallop';
  const g = loft(7, 2.1, 0.9, { width: (u) => Math.pow(Math.sin(Math.PI * (u * 0.92 + 0.04)), 0.6), sheer: (u) => 0.2 * Math.pow(1 - 2 * u, 2) });
  const m = new THREE.Mesh(g, mat('#6b5440', { side: THREE.DoubleSide }));
  m.position.y = -0.35;
  root.add(m);
  for (const x of [-1.5, 0, 1.5]) root.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.6).translate(x, 0.35, 0), mat('#8a7050')));
  return shadowed(root);
}

// Boards in a bundle, for the move to Port Royal.
export function boardBundle() {
  const g = [];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) g.push(new THREE.BoxGeometry(3.2, 0.06, 0.28).translate(0, 0.04 + k * 0.07, (i - 1.5) * 0.3));
  const m = new THREE.Mesh(mergeGeometries(g), mat('#b59a72'));
  m.name = 'boards';
  return shadowed(m);
}
