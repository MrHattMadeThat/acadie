import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as F from './french.js';
import { heightAt, HW, season } from './world.js';
import { CALENDAR } from './content.js';

// Everything on the river that the story needs, built once and set for each stop and month.
// Positions are local metres (east +x, north -z, the island at the origin), measured with scripts/probe.mjs.
//
//   The habitation sits on the island's high ground, laid out after Champlain's 1613 plan: buildings around a square
//   with a tree in the middle, a palisade, gardens, an oven, and a chapel outside the buildings. The plan may be
//   tidier than what was really built (University of Maine notes this); here it is drawn as Champlain drew it.

export const PLACES = {
  habitation: [4, -80],
  ship: [215, -75],
  camp: [-925, -5],      // a Peskotomuhkati summer camp on the west shore (a representative spot, not a known site)
  campBeach: [-878, 32],
  marchBeach: [-90, -42], // where the canoes come ashore on the island in March 1605
  cemetery: [44, 34],
  gardens: [0, 0],
  cannon: [56, 6],
  flake: [60, -46],
};

// Camera for each stop: eye and look-at, in world metres. `y` values are above the ground at that point.
export const VIEWS = {
  title: { eye: [60, 30, 900], look: [0, 10, -60] },
  opening: { eye: [1900, 230, 3900], look: [300, 0, 600] },
  trade: { eye: [234, 7.5, -66], look: [219, 1.2, -76] },
  plan: { eye: [222, 14, -64], look: [10, 12, -70] },
  island: { eye: [96, 44, 112], look: [6, 7, -38] },
  winter: { eye: [330, 170, 380], look: [-10, 0, -70] },
  sickness: { eye: [62, 13, 56], look: [36, 7, 28] },
  neighbours: { eye: [-116, 11, -14], look: [-88, 4.5, -42] },
  leaving: { eye: [268, 42, 46], look: [130, 6, -80] },
  acadie: { eye: [900, 1800, 2600], look: [0, 0, 0] },
};

function tag(text, cls = '') {
  const d = document.createElement('div');
  d.className = `tag ${cls}`;
  d.textContent = text;
  return new CSS2DObject(d);
}

const GLOW = new THREE.Color('#ffcf70');
function glow(obj, on) {
  obj?.traverse((o) => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) if (m.emissive) { m.emissive.copy(GLOW); m.emissiveIntensity = on ? 0.45 : 0; }
  });
}

let puffTex;
function puffTexture() {
  if (puffTex) return puffTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.5, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (puffTex = new THREE.CanvasTexture(c));
}
// A thin column of smoke. Returns a stepper; set `.on` to show or hide it.
function smoke(parent, at, { count = 12, rise = 0.6, life = 9, size = 2.2, wind = [0.25, 0, -0.1] } = {}) {
  const puffs = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTexture(), color: '#bdb6ae', transparent: true, depthWrite: false, opacity: 0 }));
    m.userData.age = (i / count) * life;
    parent.add(m);
    puffs.push(m);
  }
  const s = (dt) => {
    for (const m of puffs) {
      m.visible = s.on;
      const a = (m.userData.age = (m.userData.age + dt) % life) / life;
      m.position.set(at[0] + wind[0] * a * life, at[1] + rise * a * life, at[2] + wind[2] * a * life);
      m.scale.setScalar(0.4 + size * a);
      m.material.opacity = Math.sin(Math.PI * Math.min(1, a * 1.4)) * 0.32 * (1 - a);
    }
  };
  s.on = true;
  return s;
}

const ground = (x, z) => Math.max(heightAt(x, z), HW() + 0.3);
function place(obj, x, z, rotY = 0, parent) {
  obj.position.set(x, ground(x, z), z);
  obj.rotation.y = rotY;
  parent.add(obj);
  return obj;
}

export async function buildScene(scene, make) {
  const root = new THREE.Group();
  root.name = 'story';
  scene.add(root);
  const smokes = [];

  // ---------------------------------------------------------------- the habitation

  const hab = new THREE.Group();
  hab.name = 'habitation';
  root.add(hab);
  const [hx, hz] = PLACES.habitation;
  // [name, x, z (relative to the square's centre), rotY, size, order built]
  const plan = [
    ['storehouse', 0, -32, 0, { w: 18, d: 6.5, h: 3, tint: '#efe4d0' }, 0],
    ['demons_house', -24, -8, Math.PI / 2, { w: 12, d: 7, h: 3.2, tint: '#f6eedf' }, 1],
    ['public_house', -24, 16, Math.PI / 2, { w: 11, d: 6, h: 2.8 }, 2],
    ['swiss_quarters', 24, -10, -Math.PI / 2, { w: 14, d: 6, h: 2.6 }, 1],
    ['carpenters', 24, 15, -Math.PI / 2, { w: 10, d: 5.5, h: 2.6 }, 2],
    ['forge', 12, 32, Math.PI, { w: 6, d: 4.5, h: 2.4 }, 3],
    ['lodging_a', -9, 32, Math.PI, { w: 9, d: 5, h: 2.6 }, 3],
    ['lodging_b', -4, -46, Math.PI, { w: 9, d: 5, h: 2.6 }, 3],
    ['kitchen', 18, -46, 0, { w: 6, d: 4.5, h: 2.4 }, 2],
    ['lodging_c', -27, -36, Math.PI / 2, { w: 8, d: 5, h: 2.5 }, 3],
    ['lodging_d', 28, -36, -Math.PI / 2, { w: 7, d: 5, h: 2.5 }, 3],
    ['lodging_e', -28, 38, Math.PI / 2, { w: 7, d: 5, h: 2.5 }, 3],
    ['lodging_f', 29, 37, -Math.PI / 2, { w: 7, d: 5, h: 2.5 }, 3],
  ];
  const buildings = [];
  for (const [name, x, z, rot, size, order] of plan) {
    const b = F.house({ ...size, name });
    place(b, hx + x, hz + z, rot, hab);
    b.userData.order = order;
    buildings.push(b);
    if (b.userData.chimneyTop) {
      const v = new THREE.Vector3(...b.userData.chimneyTop).applyEuler(b.rotation).add(b.position);
      smokes.push(Object.assign(smoke(root, [v.x, v.y, v.z]), { kind: 'chimney' }));
    }
  }
  const ov = place(F.oven(), hx - 2, hz + 46, 0, hab);
  ov.userData.order = 2;
  buildings.push(ov);
  const tree = place(F.squareTree(), hx, hz - 2, 0, hab);
  // the palisade closes the open corners of the square and runs along the side facing the channel
  const pal = F.palisade([[hx + 36, hz - 52], [hx + 36, hz + 46], [hx + 20, hz + 50]], 2.6, ground);
  hab.add(pal);
  const palisade = new THREE.Group();
  palisade.name = 'palisade';
  hab.remove(pal); palisade.add(pal); hab.add(palisade);
  palisade.userData.order = 2;
  buildings.push(palisade);

  const gardens = new THREE.Group();
  gardens.name = 'gardens';
  root.add(gardens);
  const gardenBeds = [];
  for (const [x, z, w, d, r] of [[-14, -12, 16, 11, 0.1], [10, -6, 14, 10, -0.15], [-4, 12, 18, 12, 0.05]]) {
    const g = F.garden(w, d);
    place(g, PLACES.gardens[0] + x, PLACES.gardens[1] + z, r, gardens);
    gardenBeds.push(g);
  }

  const chap = F.chapel();
  place(chap, PLACES.cemetery[0] - 12, PLACES.cemetery[1] - 6, 0.3, root);
  chap.userData.order = 3;
  buildings.push(chap);
  const crosses = [];
  for (let i = 0; i < 35; i++) {
    const c = F.graveCross();
    const row = Math.floor(i / 7), col = i % 7;
    c.position.set(PLACES.cemetery[0] + col * 1.6 - 2, 0, PLACES.cemetery[1] + row * 1.9 + 2);
    c.position.y = ground(c.position.x, c.position.z) - 0.05;
    c.rotation.y = 0.3 + (Math.random() - 0.5) * 0.1;
    c.visible = false;
    root.add(c);
    crosses.push(c);
  }

  const gun = F.cannon();
  place(gun, ...PLACES.cannon, -0.6, root);
  gun.position.y += 0.1;
  const flake = F.codFlake(5);
  place(flake, ...PLACES.flake, 0.4, root);
  const wood = F.woodpile(1.6);
  place(wood, hx + 33, hz - 4, 0, root);

  // ---------------------------------------------------------------- the ship and the trade beside it

  const ship = F.ship();
  ship.position.set(PLACES.ship[0], 0, PLACES.ship[1]);
  ship.rotation.y = -1.9; // bow upriver, to the north-north-west
  root.add(ship);
  const deck = new THREE.Group(); // on deck, at the waist on the side facing the camera
  deck.position.set(1.2, ship.userData.deckY + 0.1, -2.2);
  ship.add(deck);
  const kettle = await make('trade_kettle');
  kettle.position.set(-0.8, 0, 0);
  kettle.scale.setScalar(2.2);
  const ax = F.axe(); ax.position.set(0.1, 0, 0.1); ax.scale.setScalar(2);
  const cl = F.cloth(); cl.position.set(1.0, 0, -0.1); cl.scale.setScalar(1.6);
  const kn = F.knife(); kn.position.set(0.3, 0, 0.5); kn.scale.setScalar(2.2);
  for (const b of [F.barrel(), F.barrel()]) { b.position.set(-2.4 + Math.random(), 0, -0.6 + Math.random()); deck.add(b); }
  deck.add(kettle, ax, cl, kn);
  const tradeCanoe = await make('canoe_birch');
  tradeCanoe.name = 'trade_canoe';
  const peltPile = F.pelts();
  peltPile.scale.setScalar(1.3);
  peltPile.position.set(0, 0.25, 0);
  tradeCanoe.add(peltPile);
  root.add(tradeCanoe);
  const shallop = F.shallop();
  root.add(shallop);

  // ---------------------------------------------------------------- a Peskotomuhkati summer camp, and the March canoes

  const camp = new THREE.Group();
  camp.name = 'summer_camp';
  root.add(camp);
  const [cx, cz] = PLACES.camp;
  for (const [x, z, r] of [[0, 0, 0], [9, 6, 1], [-7, 9, 2], [3, 15, 0.5]]) place(await make('wigwam'), cx + x, cz + z, r, camp);
  const rack = await make('fish_rack');
  if (rack) place(rack, cx + 14, cz + 18, 0.6, camp);
  const fire = smoke(root, [cx + 2, ground(cx + 2, cz + 7) + 0.6, cz + 7], { size: 1.6 });
  fire.kind = 'camp';
  smokes.push(fire);
  const beachCanoes = [];
  for (const [x, z, r] of [[0, 0, 0.5], [4, 3, 0.7], [-3, 5, 0.4]]) {
    const c = await make('canoe_birch');
    place(c, PLACES.campBeach[0] + x, PLACES.campBeach[1] + z, r, camp);
    beachCanoes.push(c);
  }
  const march = new THREE.Group();
  march.name = 'march_canoes';
  root.add(march);
  for (const [x, z, r] of [[0, 0, 1.2], [5, 4, 1.4]]) {
    const c = await make('canoe_birch');
    place(c, PLACES.marchBeach[0] + x, PLACES.marchBeach[1] + z, r, march);
    // bundles of fresh meat, wrapped in hide
    for (let k = 0; k < 3; k++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6).scale(1.3, 0.7, 1), new THREE.MeshStandardMaterial({ color: '#7a5a3e', roughness: 1 }));
      b.position.set((k - 1) * 0.9, 0.3, 0);
      b.castShadow = true;
      c.add(b);
    }
  }

  // ---------------------------------------------------------------- place names

  const labels = [
    ['St. Croix Island', 0, 30, -120, 'place'],
    ['West shore (Maine today)', -900, 60, -200, 'place shore'],
    ['East shore (New Brunswick today)', 1100, 80, -300, 'place shore'],
    ['To Passamaquoddy Bay', 700, 20, 1800, 'place water'],
  ].map(([text, x, y, z, cls]) => {
    const t = tag(text, cls);
    t.position.set(x, Math.max(heightAt(x, z), 0) + y, z);
    root.add(t);
    return t;
  });

  // ---------------------------------------------------------------- state

  const picks = ['pelts', 'trade_kettle', 'axe', 'cloth', 'storehouse', 'gardens', 'palisade', 'cannon'];
  const pickObj = { pelts: peltPile, trade_kettle: kettle, axe: ax, cloth: cl, storehouse: buildings[0], gardens, palisade, cannon: gun };
  for (const [n, o] of Object.entries(pickObj)) o.name = n;

  const st = { month: 0, stop: null, dismantle: 0, dismantling: false, built: 3, lit: [] };
  const roofSnow = new THREE.Color('#e9edf2');

  function setMonth(m) {
    st.month = m;
    const cal = CALENDAR[Math.round(m)];
    const snow = season('snow', m);
    // snow on the roofs (a white roof drops its shingle texture) and over the garden beds
    for (const b of buildings) b.traverse((o) => {
      if (o.isMesh && /_roof$/.test(o.name)) {
        const u = o.material.userData;
        u.base ||= o.material.color.clone();
        u.map ||= o.material.map;
        const white = snow > 0.5;
        if ((o.material.map === null) !== white) { o.material.map = white ? null : u.map; o.material.needsUpdate = true; }
        o.material.color.copy(white ? roofSnow : u.base);
      }
    });
    gardens.traverse((o) => {
      if (!o.isMesh) return;
      o.material.userData.base ||= o.material.color.clone();
      o.material.color.copy(o.material.userData.base).lerp(roofSnow, snow * 0.9);
    });
    // what was standing: in June 1604 the first buildings are going up
    st.built = m < 0.5 ? 1 : 3;
    // gardens: planted the first summer, bare in winter, growing again in 1605
    const grow = m < 3 ? 0.3 + m * 0.25 : m < 10 ? 0 : m < 11 ? 0.1 : Math.min(1, 0.25 + (m - 11) * 0.3);
    gardenBeds.forEach((g) => g.userData.grow(grow));
    camp.visible = cal.camp === 'coast';
    march.visible = Math.round(m) === 9;
    const dead = cal.dead;
    crosses.forEach((c, i) => { c.visible = i < dead; });
    for (const s of smokes) s.on = s.kind === 'camp' ? camp.visible : m >= 3 && m <= 11 && st.dismantle < 0.2;
    tree.getObjectByName('square_tree_crown').material.color.set(season('leaves', m) > 0.3 ? '#5d7e3a' : '#7b7068');
    if (st.stop === 'winter') ship.visible = m < 3 || m > 11;
    applyBuilt();
  }
  function applyBuilt() {
    for (const b of buildings) b.visible = b.userData.order <= st.built || st.built >= 3;
  }

  // the ship and the boats beside it
  const tmpV = new THREE.Vector3();
  function placeBoats() {
    const s = ship;
    tmpV.set(1.5, 0, -6.4).applyEuler(s.rotation).add(s.position);
    tradeCanoe.position.set(tmpV.x, 0, tmpV.z);
    tradeCanoe.rotation.y = s.rotation.y;
    tmpV.set(-6, 0, 7.5).applyEuler(s.rotation).add(s.position);
    shallop.position.set(tmpV.x, 0, tmpV.z);
    shallop.rotation.y = s.rotation.y + 0.2;
  }

  function setStop(id, month) {
    st.stop = id;
    const s = id;
    tradeCanoe.visible = s === 'trade' || s === 'plan';
    ship.visible = ['trade', 'plan', 'island', 'leaving', 'winter'].includes(s) && !(s === 'winter' && st.month > 2 && st.month < 12);
    st.dismantling = s === 'leaving';
    if (s !== 'leaving') st.dismantle = 0;
    labels.forEach((l) => { l.visible = ['island', 'winter', 'neighbours', 'acadie'].includes(s); });
    labels[0].visible = s === 'winter' || s === 'neighbours';
    setMonth(month);
    highlight(null);
  }

  function highlight(names) {
    st.lit.forEach((o) => glow(o, false));
    st.lit = [names].flat().filter(Boolean).map((n) => pickObj[n]).filter(Boolean);
    st.lit.forEach((o) => glow(o, true));
  }

  // Taking the buildings apart: walls and roofs lift off, fly out to the ship, and only the stone footings stay.
  const flyParts = [];
  for (const b of buildings) b.traverse((o) => {
    if (o.isMesh && !o.userData.stays && o.parent === b) flyParts.push({ o, b, home: o.position.clone(), homeS: o.scale.clone(), delay: Math.random() * 0.5 });
  });
  const shipDeck = new THREE.Vector3(), worldHome = new THREE.Vector3(), localTarget = new THREE.Vector3();
  function stepDismantle(dt) {
    if (st.dismantling) st.dismantle = Math.min(1, st.dismantle + dt / 9);
    ship.localToWorld(shipDeck.set(0, ship.userData.deckY + 1, 0));
    for (const p of flyParts) {
      const k = THREE.MathUtils.clamp((st.dismantle - p.delay * 0.6) / 0.4, 0, 1);
      if (k <= 0) { p.o.position.copy(p.home); p.o.scale.copy(p.homeS); p.o.visible = true; continue; }
      p.b.localToWorld(worldHome.copy(p.home));
      const e = k * k * (3 - 2 * k);
      localTarget.lerpVectors(worldHome, shipDeck, e);
      localTarget.y += Math.sin(Math.PI * e) * 30;
      p.b.worldToLocal(localTarget);
      p.o.position.copy(localTarget);
      p.o.scale.copy(p.homeS).multiplyScalar(1 - e * 0.85);
      p.o.visible = k < 1;
    }
  }

  placeBoats();
  setStop('trade', 0);

  return {
    picks,
    setStop,
    setMonth,
    get month() { return st.month; },
    react(e) {
      if (e.type === 'select' || e.type === 'option') highlight(e.pick);
      if (e.type === 'item-correct') highlight(null);
      if (e.type === 'task-done' || e.type === 'task-start') highlight(null);
    },
    update(dt, t, tide) {
      ship.position.y = tide + Math.sin(t * 0.6) * 0.08;
      ship.rotation.z = Math.sin(t * 0.5) * 0.012;
      tradeCanoe.position.y = tide + Math.sin(t * 0.9 + 1) * 0.05;
      shallop.position.y = tide + Math.sin(t * 0.8 + 2) * 0.06;
      for (const s of smokes) s(dt);
      stepDismantle(dt);
    },
    pickable: (name) => pickObj[name],
  };
}
