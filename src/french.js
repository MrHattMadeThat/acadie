import * as THREE from 'three';
import { asWaterMask } from './props.js';
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
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.8, rh + 1.4, 0.8).translate(w / 2 - 1, h + (rh + 1.4) / 2 - 0.4, 0), masonry());
    ch.name = `${name}_chimney`;
    root.add(ch);
    root.userData.chimneyTop = [w / 2 - 1, h + rh + 1.1, 0];
  }
  // stone footing that stays when the building is taken down
  const foot = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3).translate(0, 0.05, 0), masonry());
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

// Soil, woven hurdles and planting all use the same local terrain sampler.
export function garden(w, d, rows, ground, formal = false) {
  const root = new THREE.Group();
  root.name = 'garden';
  function surface(x, z, width, depth, lift, ridge = 0) {
    const g = new THREE.PlaneGeometry(width, depth, Math.ceil(width / 0.5), Math.max(4, Math.ceil(depth / 0.5))).rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const offset = pos.getZ(i);
      const px = x + pos.getX(i), pz = z + offset;
      pos.setXYZ(i, px, ground(px, pz) + lift + ridge * Math.cos(Math.PI * offset / depth), pz);
    }
    g.computeVertexNormals();
    return g;
  }
  root.add(new THREE.Mesh(surface(0, 0, w, d, 0.075), mat(formal ? '#b19b76' : '#836543')));
  const beds = [], foliage = [], colors = [], mature = [];
  function plant(x, z, y) {
    const size = 0.17 + 0.12 * rnd(), angle = rnd() * Math.PI;
    const tint = new THREE.Color().setHSL(0.19 + rnd() * 0.055, 0.31, 0.29 + rnd() * 0.14);
    for (let k = 0; k < 4; k++) {
      const a = angle + k * Math.PI / 2, dx = Math.cos(a), dz = Math.sin(a);
      const leaf = [[0, 0, 0], [dx * .55 - dz * .32, .9, dz * .55 + dx * .32],
        [dx, 1.15, dz], [dx * .55 + dz * .32, .9, dz * .55 - dx * .32]];
      for (const j of [0, 1, 2, 0, 2, 3]) {
        const [lx, ly, lz] = leaf[j];
        foliage.push(x + lx * size * .3, y + ly * size * .2, z + lz * size * .3);
        mature.push(x + lx * size, y + ly * size, z + lz * size);
        colors.push(tint.r, tint.g, tint.b);
      }
    }
  }
  if (formal) {
    const bw = w / 2 - 0.85, bd = d / 2 - 0.85;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * w / 4, cz = sz * d / 4;
      beds.push(surface(cx, cz, bw, bd, .16));
      // Dotted diagonals and borders echo the motifs in the engraved beds.
      for (let x = -.44; x <= .45; x += .4 / bw) for (let z = -.44; z <= .45; z += .4 / bd) {
        if (Math.abs(Math.abs(x) - Math.abs(z)) > .045 && Math.max(Math.abs(x), Math.abs(z)) < .39) continue;
        const px = cx + x * bw, pz = cz + z * bd;
        plant(px, pz, ground(px, pz) + .17);
      }
    }
  } else {
    const pitch = (d - .8) / rows;
    for (let r = 0; r < rows; r++) {
      const z = -d / 2 + .4 + (r + .5) * pitch;
      beds.push(surface(0, z, w - .9, pitch * .68, .09, .15));
      for (let x = -w / 2 + .7; x < w / 2 - .5; x += .45) plant(x, z, ground(x, z) + .24);
    }
  }
  root.add(new THREE.Mesh(mergeGeometries(beds), mat('#64462f')));
  const crops = new THREE.BufferGeometry();
  crops.setAttribute('position', new THREE.Float32BufferAttribute(foliage, 3));
  crops.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  crops.morphAttributes.position = [new THREE.Float32BufferAttribute(mature, 3)];
  crops.computeVertexNormals();
  const leaves = new THREE.Mesh(crops, mat('#ffffff', { vertexColors: true, side: THREE.DoubleSide }));
  root.add(leaves);
  root.userData.grow = growth => {
    leaves.visible = growth > .05;
    leaves.morphTargetInfluences[0] = growth;
  };
  const hurdle = [];
  function rail(x, z, ex, ez) {
    const n = Math.ceil(Math.hypot(ex - x, ez - z) / 1.15);
    for (let i = 0; i <= n; i++) {
      const px = x + (ex - x) * i / n, pz = z + (ez - z) * i / n, y = ground(px, pz);
      hurdle.push(new THREE.CylinderGeometry(.047, .062, .78, 5).translate(px, y + .32, pz));
      if (i === n) break;
      const nx = px + (ex - x) / n, nz = pz + (ez - z) / n, ny = ground(nx, nz);
      for (let k = 0; k < 4; k++) {
        const weave = (i + k) % 2 ? .045 : -.045;
        const ox = ez === z ? 0 : weave, oz = ex === x ? 0 : weave;
        const start = new THREE.Vector3(px + ox, y + .14 + k * .14, pz + oz);
        const end = new THREE.Vector3(nx - ox, ny + .14 + k * .14, nz - oz);
        const dir = end.clone().sub(start);
        const g = new THREE.CylinderGeometry(.032, .039, dir.length(), 5);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
        const mid = start.lerp(end, .5);
        hurdle.push(g.translate(mid.x, mid.y, mid.z));
      }
    }
  }
  rail(-w/2, -d/2, w/2, -d/2);
  rail(-w/2, -d/2, -w/2, d/2);
  rail(w/2, -d/2, w/2, d/2);
  rail(-w/2, d/2, -.6, d/2);
  rail(.6, d/2, w/2, d/2);
  root.add(new THREE.Mesh(mergeGeometries(hurdle), mat('#816447')));
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
  const limbs = [], clusters = [];
  const up = new THREE.Vector3(0, 1, 0);
  function limb(a, b, r0, r1) {
    const dir = b.clone().sub(a);
    const g = new THREE.CylinderGeometry(r1, r0, dir.length(), 7);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()));
    const mid = a.clone().lerp(b, .5);
    limbs.push(g.translate(mid.x, mid.y, mid.z));
  }
  const fork = new THREE.Vector3(.24, 3.6, -.12);
  limb(new THREE.Vector3(), fork, .46, .27);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, spread = 1.2 + rnd() * 1.5;
    const end = new THREE.Vector3(Math.cos(a)*spread, 5 + rnd()*2.4, Math.sin(a)*spread);
    const bend = end.clone().lerp(fork, .42);
    bend.y -= .55;
    limb(fork, bend, .19, .12);
    limb(bend, end, .12, .05);
    const g = new THREE.IcosahedronGeometry(1, 1).scale(1.55, 1.4 + rnd(), 1.65).translate(end.x, end.y, end.z);
    const pos = g.attributes.position, shades = [];
    for (let j = 0; j < pos.count; j += 3) {
      const light = .68 + rnd()*.32;
      for (let k = 0; k < 3; k++) shades.push(light, light, light*.92);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(shades, 3));
    clusters.push(g);
  }
  root.add(new THREE.Mesh(mergeGeometries(limbs), mat('#67503c')));
  const crown = new THREE.Mesh(mergeGeometries(clusters), mat('#719344', { vertexColors: true, flatShading: true }));
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

// A small ocean-going ship of about 1600, like the one on Champlain's 1613 map: a deep hull, a high stern castle,
// three masts, square sails on the fore and main and a slanted lateen on the mizzen. Bow toward -x, waterline at y = 0.
// sails: 'furled' (at anchor) or 'set'.
export function ship({ length = 24, sails = 'furled' } = {}) {
  const L = length, B = 7, T = 2.4; // length, beam, draught
  const root = new THREE.Group();
  root.name = 'ship';
  const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const half = (u) => (B / 2) * (u < 0.3 ? Math.pow(Math.sin((u / 0.3) * Math.PI / 2), 0.75) : u > 0.8 ? 1 - 0.3 * ((u - 0.8) / 0.2) : 1);
  const keel = (u) => -T + (u < 0.2 ? Math.pow(1 - u / 0.2, 2) * (T + 1.1) : 0);
  const top = (u) => 1.5 + (u < 0.25 ? 1.3 * Math.pow(1 - u / 0.25, 2) : 0) + 2.9 * sm(0.66, 0.8, u);
  const section = (t) => (t <= 0.72 ? Math.pow(Math.sin((t / 0.72) * Math.PI / 2), 0.55) : 1 - 0.13 * ((t - 0.72) / 0.28));
  const NU = 48, NV = 12;
  const pos = [], col = [], idx = [];
  const tar = new THREE.Color('#2e241c'), wood = new THREE.Color('#6b4a2e'), band = new THREE.Color('#b08a3a'), upper = new THREE.Color('#8a3b2a');
  const cc = new THREE.Color();
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, x = -L / 2 + u * L, hb = half(u), y0 = keel(u), y1 = top(u);
    for (let j = -NV; j <= NV; j++) {
      const t = 1 - Math.abs(j) / NV, side = Math.sign(j) || 1;
      const y = y0 + (y1 - y0) * t;
      pos.push(x, y, side * hb * section(t));
      cc.copy(y < 0.25 ? tar : wood);
      if (y > 1.0 && y < 1.3) cc.copy(band);
      if (u > 0.68 && y > 2.0) cc.copy(upper);
      col.push(cc.r, cc.g, cc.b);
    }
  }
  const row = 2 * NV + 1;
  for (let i = 0; i < NU; i++) for (let j = 0; j < row - 1; j++) {
    const a = i * row + j, b = a + row;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  // the flat stern (transom), a fan over the last section
  const last = NU * row, c0 = pos.length / 3;
  pos.push(L / 2, (keel(1) + top(1)) / 2, 0);
  col.push(upper.r, upper.g, upper.b);
  for (let j = 0; j < row - 1; j++) idx.push(c0, last + j + 1, last + j);
  const hullGeo = new THREE.BufferGeometry();
  hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hullGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  hullGeo.setIndex(idx);
  hullGeo.computeVertexNormals();
  const hull = new THREE.Mesh(hullGeo, mat('#ffffff', { vertexColors: true, side: THREE.DoubleSide }));
  hull.name = 'ship_hull';
  root.add(hull);
  // decks: the waist, the stern castle, the forecastle
  const deckY = 1.2;
  const deckMat = mat('#a88a63');
  root.add(new THREE.Mesh(new THREE.BoxGeometry(L * 0.8, 0.15, B * 0.86).translate(-L * 0.03, deckY, 0), deckMat));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(L * 0.26, 0.15, B * 0.72).translate(L * 0.36, top(0.9) - 0.5, 0), deckMat));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(L * 0.14, 0.15, B * 0.55).translate(-L * 0.36, top(0.1) - 0.45, 0), deckMat));
  // the castle's front wall, with a door
  root.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, top(0.75) - deckY, B * 0.8).translate(L * 0.21, (top(0.75) + deckY) / 2, 0), mat('#6b4a2e', { map: boards() })));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 1.4, 0.8).translate(L * 0.205, deckY + 0.7, 0), mat('#2e241c')));
  // masts, yards and sails
  const spar = mat('#5c4632'), canvas = mat('#ece4cf', { side: THREE.DoubleSide, roughness: 0.95 });
  const lines = [];
  const mast = (u, h) => {
    const x = -L / 2 + u * L;
    root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.26, h, 8).translate(x, deckY + h / 2, 0), spar));
    root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.5, 8).translate(x, deckY + h * 0.72, 0), spar)); // the top
    const hb = half(u) * 0.95;
    for (let k = -2; k <= 2; k++) for (const side of [-1, 1]) lines.push(x, deckY + h * 0.72, 0, x + k * 0.5, 1.6, side * hb);
    lines.push(x, deckY + h, 0, x - 5, deckY + 2, 0); // a stay running forward
    return x;
  };
  const square = (x, y, w, h, set) => {
    root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, w, 6).rotateX(Math.PI / 2).translate(x, y, 0), spar));
    if (set) {
      const g = new THREE.PlaneGeometry(w * 0.95, h, 6, 4);
      const P = g.attributes.position;
      for (let i = 0; i < P.count; i++) {
        const a = P.getX(i) / (w / 2), b = (P.getY(i) + h / 2) / h;
        P.setZ(i, -(1 - a * a) * 0.9 * Math.sin(Math.PI * b * 0.9));
      }
      g.computeVertexNormals();
      root.add(new THREE.Mesh(g.rotateY(Math.PI / 2).translate(x - 0.15, y - h / 2 - 0.1, 0), canvas));
    } else root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, w * 0.85, 8).rotateX(Math.PI / 2).translate(x + 0.2, y - 0.25, 0), canvas));
  };
  const setSails = sails === 'set';
  const fx = mast(0.25, 15), mx = mast(0.5, 19), zx = mast(0.8, 11);
  square(fx, deckY + 15 * 0.62, B * 1.3, 4.4, setSails);
  square(fx, deckY + 15 * 0.95, B * 0.9, 2.6, setSails);
  square(mx, deckY + 19 * 0.6, B * 1.6, 5.6, setSails);
  square(mx, deckY + 19 * 0.94, B * 1.1, 3.2, setSails);
  // the mizzen's lateen yard, slanted fore and aft
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 9, 6).rotateZ(Math.PI / 2 - 0.55).translate(zx, deckY + 11 * 0.65, 0), spar));
  if (setSails) {
    const tri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(zx - 3.7, deckY + 4.6, 0), new THREE.Vector3(zx + 3.7, deckY + 9.8, 0), new THREE.Vector3(zx + 3.4, deckY + 3.4, 0)]);
    tri.computeVertexNormals();
    root.add(new THREE.Mesh(tri, canvas));
  } else root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 7.5, 8).rotateZ(Math.PI / 2 - 0.55).translate(zx + 0.15, deckY + 11 * 0.65 - 0.3, 0), canvas));
  // bowsprit with its spritsail yard
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 9, 6).rotateZ(Math.PI / 2 - 0.3).translate(-L / 2 - 2.6, top(0) + 0.6, 0), spar));
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, B * 0.8, 6).rotateX(Math.PI / 2).translate(-L / 2 - 5.2, top(0) + 1.4, 0), spar));
  lines.push(-L / 2 - 6.6, top(0) + 2, 0, fx, deckY + 15, 0);
  lines.push(fx, deckY + 15, 0, mx, deckY + 19, 0, mx, deckY + 19, 0, zx, deckY + 11, 0);
  const rig = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)), new THREE.LineBasicMaterial({ color: '#3a2e24' }));
  root.add(rig);
  // streamers at the mastheads, and a flag at the stern with a cross, as Champlain drew it
  const flagMat = mat('#f2eee2', { side: THREE.DoubleSide });
  for (const [x, h] of [[fx, 15], [mx, 19], [zx, 11]]) {
    root.add(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.3).translate(1.2, 0, 0).translate(x, deckY + h + 0.2, 0), flagMat));
  }
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.5, 5).translate(L / 2 - 0.3, top(1) + 1.75, 0), spar));
  const flag = new THREE.Group();
  flag.position.set(L / 2 - 0.3, top(1) + 2.7, 0);
  flag.add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5).translate(1.1, 0, 0), flagMat));
  const crossMat = mat('#3a3e52', { side: THREE.DoubleSide });
  flag.add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.22).translate(1.1, 0, 0.01), crossMat));
  flag.add(new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.5).translate(0.8, 0, 0.01), crossMat));
  root.add(flag);
  root.userData.deckY = deckY;
  root.userData.flag = flag;
  return shadowed(root);
}

// Fittings in the waist shared by the imported vessel and the procedural hull.
export function deckFittings(importedHull) {
  const root = new THREE.Group(), timber = [], cordage = [];
  root.name = 'deck_fittings';
  function line(points, radius, pieces = points.length * 2) {
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), pieces, radius, 5, false);
  }
  // A framed hatch grating beside the foremast.
  for (let i = -3; i <= 3; i++) timber.push(new THREE.BoxGeometry(1.55,.095,.065).translate(-3.7,.09,i*.19));
  for (let i = -4; i <= 4; i++) timber.push(new THREE.BoxGeometry(.07,.09,1.35).translate(-3.7+i*.18,.06,0));
  for (const side of [-1,1]) {
    timber.push(new THREE.BoxGeometry(1.72,.14,.12).translate(-3.7,.08,side*.7));
    timber.push(new THREE.BoxGeometry(.12,.14,1.4).translate(-3.7+side*.8,.08,0));
  }
  // A fall from the yard to the pin rail, with slack flaked down beside it.
  for (const x of [-1.1,.6]) timber.push(new THREE.BoxGeometry(.14,.85,.14).translate(x,.42,2.35));
  timber.push(new THREE.BoxGeometry(2.05,.14,.24).translate(-.25,.78,2.35));
  for (let i=0;i<6;i++) timber.push(new THREE.CylinderGeometry(.042,.034,.34,7).translate(-1+i*.3,.83,2.35));
  cordage.push(line([[-.12,11.7,3.6],[-.6,5.4,2.75],[-.8,1.1,2.3],[-.8,.78,2.34]],.032));
  for (const [cx,cz] of [[-.9,1.48],[3.65,-1.4]]) {
    const pts=[];
    for(let i=0;i<=90;i++){
      const a=i*.31, r=.12+i*.0036;
      pts.push([cx+Math.cos(a)*r,.046,cz+Math.sin(a)*r*.78]);
    }
    cordage.push(line(pts,.032,100));
  }
  if (importedHull) {
    // Ratlines span the outer shrouds, tapering to their common mast attachment.
    for (const [x,h] of [[-6,15],[0,19]]) for (const side of [-1,1]) {
      for (let y=1.1; y<h*.62; y+=.47) {
        const f=(y-.45)/(h*.75-.45), half=.825*(1-f), z=side*(3*(1-f)+.13*f);
        cordage.push(line([[x-half,y,z],[x,y-.035,z],[x+half,y,z]],.02,4));
      }
    }
    // Companion steps lead up the forward face of the raised afterdeck.
    for(let i=0;i<7;i++) timber.push(new THREE.BoxGeometry(.35,.12,.88).translate(4.47+i*.22,.17+i*.27,.8));
    for(const side of [-1,1]) timber.push(line([[4.3,.06,.8+side*.46],[6.12,2.05,.8+side*.46]],.075,2));
    const sternY = x => x<8.8 ? 1.93+(x-6)*.25 : 2.63+(x-8.8)*.0844;
    const sternZ = x => x<8.8 ? 3.05-(x-6)*.09 : 2.8-(x-8.8)*.17;
    for(const side of [-1,1]) {
      const rail=[];
      for(let x=6.25;x<=11.76;x+=1.1) {
        const y=sternY(x), z=side*sternZ(x);
        timber.push(new THREE.BoxGeometry(.095,.86,.095).translate(x,y+.43,z));
        rail.push([x,y+.84,z]);
      }
      timber.push(line(rail,.068,12));
    }
  }
  root.add(new THREE.Mesh(mergeGeometries(timber),mat('#806044')));
  root.add(new THREE.Mesh(mergeGeometries(cordage),mat('#ad9069')));
  return shadowed(root);
}

// A shallop: the open boat the French used to row and sail between ship and shore.
export function shallop() {
  const root = new THREE.Group();
  root.name = 'shallop';
  const width = u => Math.pow(Math.sin(Math.PI * u), .68);
  const sheer = u => .2 * (1 - 2*u)**2;
  const g = loft(7, 2.1, .9, { width, sheer }).translate(0, -.35, 0);
  root.add(new THREE.Mesh(g, mat('#795738', { side: THREE.DoubleSide })));
  const rims = [], ribs = [], stations = [], indices = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40, x = (u - .5)*7, z = 1.05*width(u), y = .55 + sheer(u);
    stations.push(x,y,-z, x,y,z);
    if (i < 40) indices.push(2*i,2*i+1,2*i+2, 2*i+1,2*i+3,2*i+2);
    if (i > 2 && i < 38 && i % 4 === 0) {
      const points = [];
      for (let j = -5; j <= 5; j++) {
        const a = j * Math.PI / 10;
        points.push(new THREE.Vector3(x, -.32 + (.9+sheer(u))*(1-Math.cos(a)), Math.sign(a)*Math.abs(Math.sin(a))**.7*z*.96));
      }
      ribs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, .036, 5, false));
    }
  }
  for (const side of [0, 3]) {
    const edge = [];
    for (let i=side; i<stations.length; i+=6) edge.push(new THREE.Vector3().fromArray(stations,i));
    rims.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge), 40, .047, 6, false));
  }
  for (const x of [-1.5, 0, 1.5]) {
    const u = x/7 + .5, seatY = .29;
    const a = Math.acos(1 - (seatY+.35)/(.9+sheer(u)));
    const span = 2.1*width(u)*Math.sin(a)**.7 - .065;
    ribs.push(new THREE.BoxGeometry(.32,.075,span).translate(x,seatY,0));
  }
  root.add(new THREE.Mesh(mergeGeometries(rims.concat(ribs)), mat('#b28a5b')));
  shadowed(root);
  const cover = new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(stations,3));
  cover.setIndex(indices);
  const mask = asWaterMask(new THREE.Mesh(cover));
  mask.name = 'water_mask';
  root.add(mask);
  return root;
}

// Boards in a bundle, for the move to Port Royal.
export function boardBundle() {
  const g = [];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) g.push(new THREE.BoxGeometry(3.2, 0.06, 0.28).translate(0, 0.04 + k * 0.07, (i - 1.5) * 0.3));
  const m = new THREE.Mesh(mergeGeometries(g), mat('#b59a72'));
  m.name = 'boards';
  return shadowed(m);
}

// ------------------------------------------------------------------ buildings from Champlain's plan of the habitation

// Plastered walls with dark timber framing: the look of the larger houses on the plan.
let frameTex;
function framed() {
  return (frameTex ||= canvasTex(128, 128, (g) => {
    g.fillStyle = '#e9e1cf'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(150,130,100,${rnd() * 0.08})`; g.fillRect(rnd() * 128, rnd() * 128, 3, 3); }
    g.fillStyle = '#5a4332';
    for (const x of [0, 42, 85]) g.fillRect(x, 0, 7, 128);
    g.fillRect(0, 0, 128, 7); g.fillRect(0, 62, 128, 6); g.fillRect(0, 122, 128, 6);
    g.save(); g.translate(46, 66); g.rotate(-0.85); g.fillRect(0, 0, 70, 5); g.restore();
  }));
}
const wallMaterial = (kind, w, h) => {
  const m = mat('#ffffff', { map: (kind === 'framed' ? framed() : boards()).clone() });
  m.map.repeat.set(Math.max(1, w / (kind === 'framed' ? 3 : 2.5)), Math.max(1, h / (kind === 'framed' ? 3 : 2.5)));
  m.map.needsUpdate = true;
  return m;
};
const roofMaterial = (w, h) => {
  const m = mat('#ffffff', { map: shingles().clone() });
  m.map.repeat.set(Math.max(1, w / 3), Math.max(1, h / 2));
  m.map.needsUpdate = true;
  return m;
};
// a gable roof prism: ridge along x, `w` long, `d` across, `rh` high, sitting at y0
function gableRoof(w, d, rh, y0, overhang = 0.3) {
  // Separate thin roof boards leave the timber gable visible beneath the eaves.
  const half = d / 2 + overhang, pitch = Math.atan2(rh, half);
  const sides = [-1, 1].map(side => new THREE.BoxGeometry(w + overhang * 2, .16, Math.hypot(half, rh))
    .rotateX(side * pitch).translate(0, y0 + rh / 2, side * half / 2));
  return mergeGeometries(sides);
}
let stoneTex;
function masonry() {
  stoneTex ||= canvasTex(128, 128, g => {
    g.fillStyle = '#665f53';
    g.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 8; row++) {
      for (let i = -1; i < 5; i++) {
        const v = Math.floor(117 + rnd() * 39), x = i * 32 + (row % 2) * 16, y = row * 16;
        g.fillStyle = `rgb(${v},${v-6},${v-16})`;
        g.beginPath();
        g.moveTo(x + 2, y + 3); g.lineTo(x + 29, y + 1); g.lineTo(x + 31, y + 11);
        g.lineTo(x + 26, y + 15); g.lineTo(x + 1, y + 14); g.closePath(); g.fill();
      }
    }
  });
  return mat('#ffffff', { map: stoneTex });
}
function chimney(root, x, y, z, h, name) {
  const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.8).translate(x, y + h / 2, z), masonry());
  const cap = new THREE.BoxGeometry(.98, .19, .98).translate(x, y + h, z);
  c.geometry = mergeGeometries([c.geometry, cap]);
  c.name = `${name}_chimney`;
  root.add(c);
  (root.userData.chimneys ||= []).push([x, y + h + 0.3, z]);
}
function footing(root, w, d, name) {
  const f = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3).translate(0, 0.05, 0), masonry());
  f.name = `${name}_footing`;
  f.userData.stays = true;
  root.add(f);
}
function doorsAndWindows(root, xs, y, z, size = [0.7, 0.6]) {
  const dark = mat('#3e2c1e');
  for (const [x, kind] of xs) {
    const door = kind === 'door', w = door ? .95 : size[0], h = door ? 1.9 : size[1], cy = door ? .95 : y;
    const panel = new THREE.BoxGeometry(w, h, .13).translate(x, cy, z);
    root.add(new THREE.Mesh(panel, door ? wallMaterial('boards', 1, 2) : dark));
    const trim = [];
    for (const side of [-1, 1]) {
      trim.push(new THREE.BoxGeometry(.095, h + .15, .17).translate(x + side * w / 2, cy, z + .035));
      trim.push(new THREE.BoxGeometry(w + .22, .105, .19).translate(x, cy + side * h / 2, z + .035));
    }
    if (!door) {
      trim.push(new THREE.BoxGeometry(.055, h, .08).translate(x, cy, z + .09));
      trim.push(new THREE.BoxGeometry(w, .05, .08).translate(x, cy, z + .09));
    }
    root.add(new THREE.Mesh(mergeGeometries(trim), mat('#70523b')));
  }
}

// A row of gable-fronted units, as Champlain drew the forge and carpenters' row and the lodgings: each unit has its
// own steep roof with its gable facing the street (+z). `chimneys` lists which units have one.
export function rowHouse({ units = 4, unitW = 4.4, d = 7, h = 3, name = 'row', kind = 'boards', chimneys = [0, 2] } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const W = units * unitW;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(W, h, d).translate(0, h / 2, 0), wallMaterial(kind, W, h));
  walls.name = `${name}_walls`;
  root.add(walls);
  const rh = unitW * 0.95;
  for (let i = 0; i < units; i++) {
    const x = -W / 2 + unitW * (i + 0.5);
    // the roof's ridge runs back from the street, so the gable faces front
    const roof = new THREE.Mesh(gableRoof(d, unitW, rh, h, 0.15).rotateY(Math.PI / 2).translate(x, 0, 0), roofMaterial(d, rh));
    roof.name = `${name}_roof`;
    root.add(roof);
    // the gable end's triangle of wall
    const tri = new THREE.Shape();
    tri.moveTo(-unitW / 2, 0); tri.lineTo(0, rh); tri.lineTo(unitW / 2, 0); tri.lineTo(-unitW / 2, 0);
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(tri).translate(x, h, d / 2 + 0.01), wallMaterial(kind, unitW, rh));
    gable.name = `${name}_gable`;
    root.add(gable);
    const rear = gable.clone();
    rear.geometry = gable.geometry.clone().rotateY(Math.PI).translate(2 * x, 0, 0);
    root.add(rear);
    doorsAndWindows(root, [[x - unitW * 0.18, 'door'], [x + unitW * 0.22, 'win']], h * 0.62, d / 2 + 0.02);
    root.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.08).translate(x, h + rh * 0.4, d / 2 + 0.03), mat('#3e2c1e')));
    if (chimneys.includes(i)) chimney(root, x, h + rh * 0.4, -d / 4, rh * 0.75 + 1, name);
  }
  footing(root, W, d, name);
  return shadowed(root);
}

// A one-ridge house: long side to the street (+z), gable ends left and right.
export function hall({ w = 10, d = 6, h = 3, name = 'hall', kind = 'boards', chimneyAt = 0.35, doors = null } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), wallMaterial(kind, w, h));
  walls.name = `${name}_walls`;
  root.add(walls);
  const rh = d * 0.9;
  const roof = new THREE.Mesh(gableRoof(w, d, rh, h), roofMaterial(w, rh));
  roof.name = `${name}_roof`;
  root.add(roof);
  for (const side of [-1, 1]) {
    const tri = new THREE.Shape();
    tri.moveTo(-d / 2, 0); tri.lineTo(0, rh); tri.lineTo(d / 2, 0); tri.lineTo(-d / 2, 0);
    const g = new THREE.Mesh(new THREE.ShapeGeometry(tri).rotateY(side * Math.PI / 2).translate(side * (w / 2 + 0.01), h, 0), wallMaterial(kind, d, rh));
    g.material.side = THREE.DoubleSide;
    g.name = `${name}_gable`;
    root.add(g);
  }
  doorsAndWindows(root, doors || [[-w * 0.2, 'door'], [w * 0.1, 'win'], [w * 0.32, 'win'], [-w * 0.4, 'win']], h * 0.6, d / 2 + 0.02);
  if (chimneyAt != null) chimney(root, w * chimneyAt, h + rh * 0.35, -d * 0.12, rh * 0.7 + 1.2, name);
  footing(root, w, d, name);
  return shadowed(root);
}

// The house of the Sieur de Mons (A on the plan): the grandest building, two storeys of framed walls under a steep
// pavilion roof, with a dormer and a little lantern on top, and a tall narrow wing beside it.
export function demonsHouse() {
  const root = new THREE.Group();
  root.name = 'demons_house';
  const w = 9, d = 8, h = 5.6;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), wallMaterial('framed', w, h));
  walls.name = 'demons_house_walls';
  root.add(walls);
  // a pavilion roof: four steep faces up to a short ridge
  const rh = 5.2;
  const g = new THREE.CylinderGeometry(0.5, 1, rh, 4, 1).rotateY(Math.PI / 4).scale(w * 0.78, 1, d * 0.78).translate(0, h + rh / 2, 0);
  const roof = new THREE.Mesh(g, roofMaterial(w, rh));
  roof.name = 'demons_house_roof';
  root.add(roof);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.7, 2.2, 6).translate(0, h + rh + 1.1, 0), mat('#5d5148'));
  lantern.name = 'demons_house_lantern';
  root.add(lantern);
  const dormer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.4).translate(0, h + 1.2, d / 2 - 0.6), wallMaterial('framed', 1.4, 1.5));
  root.add(dormer);
  const dr = new THREE.Mesh(gableRoof(1.4, 1.6, 1.0, h + 1.95, 0.1).rotateY(Math.PI / 2).translate(0, 0, d / 2 - 0.6), roofMaterial(1.6, 1));
  dr.name = 'demons_house_roof';
  root.add(dr);
  doorsAndWindows(root, [[0, 'door'], [-2.6, 'win'], [2.6, 'win']], 1.7, d / 2 + 0.02, [0.8, 0.9]);
  doorsAndWindows(root, [[-2.6, 'win'], [0, 'win'], [2.6, 'win']], 4.2, d / 2 + 0.02, [0.8, 0.9]);
  chimney(root, w * 0.3, h + 1.5, -d * 0.2, 4.5, 'demons_house');
  chimney(root, -w * 0.3, h + 1.5, -d * 0.2, 4.5, 'demons_house');
  footing(root, w, d, 'demons_house');
  return shadowed(root);
}

// The well (G on the plan): a stone ring with a wooden frame and a bucket.
export function well() {
  const root = new THREE.Group();
  root.name = 'well';
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.9, 14, 1, true).translate(0, 0.45, 0), mat('#8f877c', { side: THREE.DoubleSide })));
  root.add(new THREE.Mesh(new THREE.CircleGeometry(0.8, 14).rotateX(-Math.PI / 2).translate(0, 0.3, 0), mat('#1e2a30')));
  const wood = mat('#6e5238');
  for (const x of [-0.8, 0.8]) root.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12).translate(x, 1.1, 0), wood));
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 8).rotateZ(Math.PI / 2).translate(0, 1.9, 0), wood));
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.3, 8).translate(0.2, 1.1, 0), wood));
  return shadowed(root);
}

// The bake house (H): a small house with the bread oven built onto its back.
export function bakehouse() {
  const root = hall({ w: 7, d: 5, h: 2.6, name: 'bakehouse', chimneyAt: -0.3, doors: [[-1, 'door'], [1.6, 'win']] });
  const o = oven();
  o.position.set(1, 0, -3.2);
  o.scale.setScalar(1.3);
  root.add(o);
  return root;
}

// An earth platform faced with wicker gabions, with cannon on it (C and D on the map).
export function battery(guns = 2) {
  const root = new THREE.Group();
  root.name = 'battery';
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.4, 1.1, 10).translate(0, 0.35, 0), mat('#7d6a52', { roughness: 1 })));
  const wicker = mat('#8a6e44', { roughness: 1 });
  for (let i = 0; i < 9; i++) {
    const a = -1.3 + (i / 8) * 2.6;
    root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8).translate(Math.sin(a) * 4.2, 1.5, Math.cos(a) * 4.2), wicker));
  }
  for (let k = 0; k < guns; k++) {
    const c = cannon();
    c.rotation.y = -Math.PI / 2;
    c.position.set((k - (guns - 1) / 2) * 2.4, 0.9, 1.6);
    root.add(c);
  }
  return shadowed(root);
}

// The water mill de Mons had started on the west shore (I): a small mill house with a wheel. `wheel` turns.
export function waterMill() {
  const root = hall({ w: 6, d: 5, h: 3, name: 'mill', chimneyAt: null, doors: [[-1.2, 'door'], [1.4, 'win']] });
  const wheel = new THREE.Group();
  const wood = mat('#6e5238');
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.12, 6, 18), wood));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    wheel.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.7).translate(0, 1.85, 0).rotateZ(a), wood));
  }
  wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 8).rotateX(Math.PI / 2), wood));
  wheel.position.set(3.6, 1.7, 0);
  wheel.rotation.y = Math.PI / 2;
  root.add(wheel);
  root.userData.wheel = wheel;
  return shadowed(root);
}

// The place where they made charcoal (L): an earth-covered mound of wood, smouldering.
export function charcoalMound() {
  const root = new THREE.Group();
  root.name = 'charcoal';
  root.add(new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.7, 1), mat('#3b3530', { roughness: 1 })));
  const wood = mat('#8b6e4e');
  for (let i = 0; i < 6; i++) root.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6).rotateZ(Math.PI / 2).translate(3.4, 0.15 + i * 0.22, (i % 3 - 1) * 0.3), wood));
  return shadowed(root);
}

// A plank, for people carrying boards.
export function plankPile(n = 6) {
  const g = [];
  for (let i = 0; i < n; i++) g.push(new THREE.BoxGeometry(3.6, 0.06, 0.3).translate((i % 2) * 0.2, 0.05 + i * 0.065, (i % 3 - 1) * 0.32));
  const m = new THREE.Mesh(mergeGeometries(g), mat('#b59a72'));
  m.name = 'planks';
  return shadowed(m);
}

// A boulder for the rocky shoals around the island (G on the map).
export function boulderGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const k = 0.75 + 0.4 * Math.abs(Math.sin(P.getX(i) * 3.1 + P.getZ(i) * 2.3));
    P.setXYZ(i, P.getX(i) * k, P.getY(i) * k * 0.6, P.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}
