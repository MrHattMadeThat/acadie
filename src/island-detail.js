import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as F from './french.js';
import { buildDriftwood, buildGull } from './props.js';
import { heightAt, HW, onIsland, season } from './world.js';

// The island's small things (2026-11-19, the user: more detail on the island). None of these is a fact the game
// teaches; they make the place look worked and lived in. The one with a source:
//  - stumps: the island and the nearby mainland were cleared (NPS, "Saint Croix Island Settlement"; docs/SOURCES.md)
//  - the woodpiles shrink through the winter: the shortage of firewood (NPS; docs/SOURCES.md)
// Everything else (the carpenters' work yard, barrels, benches, a wheelbarrow, driftwood, gulls, grass, snowdrifts)
// is ordinary scenery, placed clear of the buildings, gardens, footpaths and the free-roam scenes.
//
// buildIslandDetail returns { setMonth(m), update(dt, t, tide) } and adds door-step wear to `pathSegs`.

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });
function shadowed(o) { o.traverse((m) => { if (m.isMesh) m.castShadow = m.receiveShadow = true; }); return o; }
const colour = (g, c) => {
  const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([col.r, col.g, col.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
};

// a building's (or bed's) footprint: centre, turn, half sizes along its own x and z
function footprint(o) {
  const ry = o.rotation.y;
  o.rotation.y = 0;
  o.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(o);
  o.rotation.y = ry;
  o.updateMatrixWorld(true);
  const c = b.getCenter(new THREE.Vector3());
  // the box is centred on the object's position only roughly; keep its offset in the object's own frame
  return { x: o.position.x, z: o.position.z, ox: c.x - o.position.x, oz: c.z - o.position.z, rot: ry, hx: (b.max.x - b.min.x) / 2, hz: (b.max.z - b.min.z) / 2 };
}
// a point in a footprint's frame (a along its x, b along its z) to the world
function toWorld(fp, a, b) {
  const c = Math.cos(fp.rot), s = Math.sin(fp.rot);
  return [fp.x + a * c + b * s, fp.z - a * s + b * c];
}
function inside(fp, x, z, pad) {
  const c = Math.cos(fp.rot), s = Math.sin(fp.rot), dx = x - fp.x, dz = z - fp.z;
  const a = dx * c - dz * s - fp.ox, b = dx * s + dz * c - fp.oz;
  return Math.abs(a) < fp.hx + pad && Math.abs(b) < fp.hz + pad;
}
const segDist = (x, z, [x0, z0, x1, z1]) => {
  const dx = x1 - x0, dz = z1 - z0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(x - x0 - t * dx, z - z0 - t * dz);
};
const slopeAt = (x, z) => Math.hypot(heightAt(x + 1, z) - heightAt(x - 1, z), heightAt(x, z + 1) - heightAt(x, z - 1)) / 2;

export function buildIslandDetail({ root, buildings, beds, others, pathSegs, square, spots, rand, PLAN_ROT }) {
  const group = new THREE.Group();
  group.name = 'island_detail';
  root.add(group);
  const H = HW();
  const ground = (x, z) => Math.max(heightAt(x, z), H + 0.3);

  const houses = buildings.map((b) => ({ b, fp: footprint(b) }));
  const fps = [...houses.map((h) => h.fp), ...beds.map(footprint), ...others.map(footprint)];
  const taken = []; // [x, z, r] of things placed here
  function clear(x, z, pad = 1) {
    if (!onIsland(x, z)) return false;
    for (const fp of fps) if (inside(fp, x, z, pad)) return false;
    for (const s of pathSegs) if (segDist(x, z, s) < 0.9 + pad) return false;
    if (Math.hypot(x - square[0], z - square[1]) < square[2] + pad) return false;
    for (const [sx, sz, r] of spots) if (Math.hypot(x - sx, z - sz) < r + pad) return false;
    for (const [tx, tz, r] of taken) if (Math.hypot(x - tx, z - tz) < r + pad) return false;
    return true;
  }
  function put(o, x, z, rot = 0, r = 1) {
    o.position.set(x, ground(x, z), z);
    o.rotation.y = rot;
    group.add(o);
    taken.push([x, z, r]);
    return o;
  }

  // ------------------------------------------------------------ door steps: the ground worn bare in front of each door
  // (each building's front, its +z, faces the way Champlain drew it; world.js draws these with the footpaths)
  for (const { fp } of houses) {
    const [x0, z0] = toWorld(fp, fp.ox, fp.oz + fp.hz - 0.3), [x1, z1] = toWorld(fp, fp.ox, fp.oz + fp.hz + 1.6);
    pathSegs.push([x0, z0, x1, z1]);
  }

  // ------------------------------------------------------------ the carpenters' work yard, on flat ground north of the square
  // trestles with a squared timber, a chopping block, sawn planks, logs waiting, and chips on the ground
  const yard = [-23, -121];
  {
    const wood = mat('#8a6a48'), fresh = mat('#c6a878'), bark = mat('#5e4a36');
    const g = new THREE.Group();
    for (const a of [-1.3, 1.3]) {
      const tr = new THREE.Group();
      tr.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 1.1).translate(0, 0.78, 0), wood));
      for (const s of [-1, 1]) for (const e of [-0.42, 0.42]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.86, 0.07).translate(0, 0.39, 0), wood);
        leg.position.set(s * 0.12, 0, e);
        leg.rotation.x = 0;
        leg.rotation.z = s * 0.2;
        tr.add(leg);
      }
      tr.position.x = a;
      g.add(tr);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.26, 0.26).translate(0, 0.98, 0), fresh);
    g.add(beam);
    put(shadowed(g), yard[0], yard[1], PLAN_ROT + 0.1, 3);
    const block = new THREE.Group();
    block.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.55, 9).translate(0, 0.27, 0), bark));
    block.add(new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.02, 9).translate(0, 0.56, 0), fresh));
    const ax = F.axe();
    ax.position.set(-0.05, 0.62, 0);
    ax.rotation.z = -0.5;
    block.add(ax);
    const [bx, bz] = [yard[0] + 2.6, yard[1] + 2.2];
    put(shadowed(block), bx, bz, 0.7, 0.6);
    const planks = F.plankPile(5);
    put(planks, yard[0] - 1.5, yard[1] + 3.5, PLAN_ROT - 0.05, 2);
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2 - i * 0.02, 0.24 - i * 0.02, 3.6, 8).rotateZ(Math.PI / 2), bark);
      const [lx, lz] = [yard[0] - 3.2 + i * 0.1, yard[1] - 1 + i * 0.5];
      log.position.set(lx, ground(lx, lz) + 0.2 + (i === 2 ? 0.36 : 0), lz);
      log.rotation.y = PLAN_ROT + 0.05 * i;
      group.add(shadowed(log));
    }
    taken.push([yard[0] - 3, yard[1], 2.2]);
    // chips and shavings
    const chip = new THREE.BoxGeometry(0.09, 0.015, 0.05);
    const chips = new THREE.InstancedMesh(chip, mat('#cdb487'), 140);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < 140; i++) {
      const r = Math.sqrt(rand()) * 2.6, a = rand() * Math.PI * 2;
      const x = yard[0] + 0.6 + Math.cos(a) * r, z = yard[1] + 0.8 + Math.sin(a) * r * 1.2;
      m4.compose(new THREE.Vector3(x, ground(x, z) + 0.01, z), q.setFromEuler(e.set(0, rand() * 6, 0)), new THREE.Vector3(1 + rand(), 1, 1 + rand()));
      chips.setMatrixAt(i, m4);
    }
    chips.receiveShadow = true;
    group.add(chips);
  }

  // ------------------------------------------------------------ firewood against the back of the houses
  const piles = [];
  const backs = /^(lodging_|carpenters|swiss_quarters|cure|forge)/;
  houses.forEach(({ b, fp }, i) => {
    if (!backs.test(b.name) || i % 2) return; // every other cottage
    const [x, z] = toWorld(fp, fp.ox, fp.oz - fp.hz - 0.55);
    const pile = F.woodpile(0.9);
    pile.position.set(x, ground(x, z), z);
    pile.rotation.y = fp.rot;
    group.add(pile);
    piles.push(pile);
    taken.push([x, z, 1]);
  });

  // ------------------------------------------------------------ barrels by the storehouse, benches by the doors
  const byName = (n) => houses.find((h) => h.b.name === n)?.fp;
  const store = byName('storehouse');
  if (store) for (const [a, b] of [[-3.2, 0.7], [-2.5, 0.75], [-2.85, 1.3], [4.8, 0.7], [5.4, 0.9]]) {
    const [x, z] = toWorld(store, store.ox + a, store.oz + store.hz + b);
    put(F.barrel(), x, z, rand() * 6, 0.5);
  }
  const pub = byName('public_house');
  if (pub) for (const a of [1.6, 2.2]) {
    const [x, z] = toWorld(pub, pub.ox + a, pub.oz + pub.hz + 0.7);
    put(F.barrel(), x, z, rand() * 6, 0.5);
  }
  function bench() {
    const g = new THREE.Group(), wood = mat('#7d5f42');
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.32).translate(0, 0.45, 0), wood));
    for (const x of [-0.7, 0.7]) g.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.43, 0.28).translate(x, 0.21, 0), wood));
    return shadowed(g);
  }
  for (const [n, a] of [['demons_house', -2.6], ['public_house', -2], ['lodging_p', 1.4], ['cure', 3]]) {
    const fp = byName(n);
    if (!fp) continue;
    const [x, z] = toWorld(fp, fp.ox + a, fp.oz + fp.hz + 0.55);
    put(bench(), x, z, fp.rot, 0.8);
  }

  // ------------------------------------------------------------ a wheelbarrow by the gardens south of the houses
  {
    const g = new THREE.Group(), wood = mat('#86663f');
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.38, 0.32, 4, 1, true).rotateY(Math.PI / 4).scale(1.3, 1, 0.9).translate(0.1, 0.5, 0), mat('#86663f', { side: THREE.DoubleSide }));
    g.add(tray);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6).translate(0.1, 0.35, 0), wood));
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.05), wood);
      h.position.set(-0.1, 0.42, s * 0.28);
      h.rotation.z = 0.12;
      g.add(h);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05).translate(0, 0.2, 0), wood);
      leg.position.set(-0.45, 0, s * 0.28);
      g.add(leg);
    }
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 12).rotateX(Math.PI / 2), mat('#5f4630'));
    wheel.position.set(0.95, 0.24, 0);
    g.add(wheel);
    const bed0 = footprint(beds[0]);
    const [x, z] = toWorld(bed0, bed0.ox + bed0.hx + 1.6, bed0.oz + 2);
    put(shadowed(g), x, z, bed0.rot + 1.2, 1.2);
  }

  // ------------------------------------------------------------ stumps across the cleared ground (NPS: the island was cleared)
  {
    const side = new THREE.CylinderGeometry(0.88, 1, 1, 8, 1, true).translate(0, 0.5, 0);
    const top = new THREE.CircleGeometry(0.88, 8).rotateX(-Math.PI / 2).translate(0, 1, 0);
    const flare = new THREE.CylinderGeometry(1, 1.35, 0.25, 8, 1, true).translate(0, 0.02, 0);
    const geo = mergeGeometries([colour(side, '#5a4733'), colour(top, '#b49d78'), colour(flare, '#4f3f2e')]);
    const spotsS = [];
    for (let k = 0; k < 4000 && spotsS.length < 130; k++) {
      const x = -60 + rand() * 120, z = -200 + rand() * 260;
      if (heightAt(x, z) < H + 2 || !clear(x, z, 1.2)) continue;
      spotsS.push([x, z]);
      taken.push([x, z, 1]);
    }
    const stumps = new THREE.InstancedMesh(geo, mat('#ffffff', { vertexColors: true, flatShading: true }), spotsS.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    spotsS.forEach(([x, z], i) => {
      const r = 0.16 + rand() * 0.2, h = 0.25 + rand() * 0.35;
      m4.compose(new THREE.Vector3(x, heightAt(x, z) - 0.05, z), q.setFromEuler(e.set((rand() - 0.5) * 0.15, rand() * 6, (rand() - 0.5) * 0.15)), new THREE.Vector3(r, h, r));
      stumps.setMatrixAt(i, m4);
    });
    stumps.castShadow = stumps.receiveShadow = true;
    group.add(stumps);
  }

  // ------------------------------------------------------------ tufts of long grass, thickest on the banks
  let tufts;
  {
    const blades = [];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3, lean = 0.18;
      const g = new THREE.BufferGeometry();
      const bx = Math.cos(a), bz = Math.sin(a), px = -bz * 0.08, pz = bx * 0.08;
      g.setAttribute('position', new THREE.Float32BufferAttribute([px, 0, pz, -px, 0, -pz, bx * lean, 1, bz * lean], 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute([0.4, 0.48, 0.2, 0.4, 0.48, 0.2, 0.64, 0.72, 0.34], 3));
      g.computeVertexNormals();
      blades.push(g);
    }
    const geo = mergeGeometries(blades);
    const list = [];
    for (let k = 0; k < 9000 && list.length < 1400; k++) {
      const x = -90 + rand() * 180, z = -210 + rand() * 330, h = heightAt(x, z);
      if (h < H + 0.6 || !onIsland(x, z)) continue;
      const steep = slopeAt(x, z);
      if (rand() > 0.25 + steep * 1.4) continue; // the banks keep their long grass; the flat top is grazed short
      if (!clear(x, z, 0.4)) continue;
      list.push([x, h, z]);
    }
    tufts = new THREE.InstancedMesh(geo, mat('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), list.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
    list.forEach(([x, y, z], i) => {
      const s = 0.35 + rand() * 0.4;
      m4.compose(new THREE.Vector3(x, y - 0.03, z), q.setFromEuler(e.set(0, rand() * 6, 0)), new THREE.Vector3(s * 1.4, s, s * 1.4));
      tufts.setMatrixAt(i, m4);
      tufts.setColorAt(i, c.setHSL(0.15 + rand() * 0.06, 0.3, 0.82 + rand() * 0.18));
    });
    tufts.receiveShadow = true;
    group.add(tufts);
  }

  // ------------------------------------------------------------ driftwood above the high-water line
  for (let k = 0, n = 0; k < 6000 && n < 12; k++) {
    const x = -120 + rand() * 260, z = -230 + rand() * 360, h = heightAt(x, z);
    if (h < H + 0.05 || h > H + 0.7 || slopeAt(x, z) > 0.25 || !onIsland(x, z)) continue;
    if (taken.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 12) || spots.some(([sx, sz, r]) => Math.hypot(x - sx, z - sz) < r + 2)) continue;
    const d = buildDriftwood();
    d.scale.setScalar(0.8 + rand() * 0.4);
    put(d, x, z, rand() * 6, 3);
    n++;
  }

  // ------------------------------------------------------------ gulls: some on the shore (they swim when the tide is in), some circling
  const sitting = [], flying = [];
  for (let k = 0, n = 0; k < 6000 && n < 9; k++) {
    const x = -120 + rand() * 260, z = -230 + rand() * 360, h = heightAt(x, z);
    if (h < -H + 0.4 || h > H - 0.3 || !onIsland(x, z) && h > -1) continue;
    if (Math.hypot(x, z + 60) > 230) continue;
    const g = buildGull();
    g.scale.setScalar(1.4);
    g.position.set(x, h, z);
    g.rotation.y = rand() * 6;
    for (const w of g.children) if (w.name.startsWith('wing')) w.rotation.x = (w.name === 'wing_l' ? 1 : -1) * 1.2; // folded
    group.add(g);
    sitting.push({ g, h, phase: rand() * 6 });
    n++;
  }
  for (let i = 0; i < 5; i++) {
    const g = buildGull();
    g.scale.setScalar(1.4);
    group.add(g);
    flying.push({ g, cx: 40 + rand() * 40, cz: -140 + rand() * 120, r: 22 + rand() * 24, y: 14 + rand() * 14, w: (rand() < 0.5 ? -1 : 1) * (0.12 + rand() * 0.08), a: rand() * 6 });
  }

  // ------------------------------------------------------------ snowdrifts along the west wall and north end of each house
  const drifts = [];
  {
    const shape = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2);
    const snowMat = mat('#eef1f5', { roughness: 1 });
    for (const { fp } of houses) for (const [a, b, len, dep, turn] of [
      [fp.ox, fp.oz - fp.hz, fp.hx * 2 + 0.4, 1.1, 0],   // the back (west) wall
      [fp.ox + fp.hx, fp.oz, fp.hz * 2, 0.8, Math.PI / 2], // the north gable
    ]) {
      const [x, z] = toWorld(fp, a, b);
      const m = new THREE.Mesh(shape, snowMat);
      m.scale.set(len, 0.55, dep);
      m.position.set(x, heightAt(x, z) - 0.05, z);
      m.rotation.y = fp.rot + turn;
      m.receiveShadow = true;
      m.visible = false;
      group.add(m);
      drifts.push(m);
    }
  }

  const straw = new THREE.Color('#c9b27a'), green = new THREE.Color('#ffffff');
  return {
    setMonth(m) {
      const snow = season('snow', m), g = season('green', m);
      for (const d of drifts) { d.visible = snow > 0.3; d.scale.y = 0.2 + 0.5 * snow; }
      tufts.visible = snow < 0.6;
      tufts.material.color.copy(straw).lerp(green, g);
      // the firewood runs low through the winter (NPS: a shortage of firewood)
      const left = m < 5 ? 1 : m < 9.5 ? 1 - (m - 5) / 4.5 * 0.7 : m < 11 ? 0.3 : 1;
      for (const p of piles) { p.scale.y = 0.9 * left; p.visible = left > 0.05; }
    },
    update(dt, t, tide) {
      for (const s of sitting) {
        s.g.position.y = Math.max(s.h, tide - 0.06) + (tide > s.h ? Math.sin(t * 1.3 + s.phase) * 0.03 : 0);
        s.g.rotation.y += Math.sin(t * 0.4 + s.phase) * dt * 0.15;
      }
      for (const f of flying) {
        f.a += f.w * dt;
        const x = f.cx + Math.cos(f.a) * f.r, z = f.cz + Math.sin(f.a) * f.r;
        f.g.position.set(x, f.y + Math.sin(t * 0.7 + f.a) * 1.5, z);
        // the body lies along +x: face along the circle
        const dx = -Math.sin(f.a) * Math.sign(f.w), dz = Math.cos(f.a) * Math.sign(f.w);
        f.g.rotation.y = Math.atan2(-dz, dx);
        f.g.rotation.x = -0.25 * Math.sign(f.w); // banking into the turn
        const flap = Math.sin(t * 5 + f.a * 3) > 0.6 ? Math.sin(t * 12) * 0.5 : 0.08; // mostly gliding
        for (const w of f.g.children) if (w.name.startsWith('wing')) w.rotation.x = (w.name === 'wing_l' ? 1 : -1) * flap;
      }
    },
  };
}
