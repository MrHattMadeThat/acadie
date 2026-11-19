import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as F from './french.js';
import { Crowd } from './people.js';
import { heightAt, HW, season } from './world.js';
import { CALENDAR } from './content.js';
import { SCENES } from './stories.js';
import { buildIslandDetail } from './island-detail.js';

// Everything on the river that the story needs, built once and set for each stop and month.
// Positions are local metres (east +x, north -z, the island at the origin). Use scripts/probe.mjs for ground heights.
//
// Two maps from Champlain's Voyages (1613) set the layout:
//  - his map of the island ("Isle de sainte Croix"), fitted onto the real outline by scripts/champlain-fit.mjs: the
//    habitation (A) at the north end, gardens (B), the cemetery (E) and chapel (F) south of it, a cannon on a little
//    islet off the south end (C) and on a platform at the north end (D), rocky shoals (G), a small islet (H, Little
//    Dochet), and on the mainland the water mill (I), the charcoal place (L) and gardens west (M) and east (N). His
//    river is drawn far narrower than it is, so the mainland sites sit on the real shores in the same directions.
//  - his plan of the habitation ("Habitation de l'isle ste croix"), laid out letter by letter below. Its top is taken as
//    west (as on the island map), so the buildings face east, toward the channel. The plan may be tidier than what was
//    built (University of Maine notes this); here it is drawn as Champlain drew it.

export const PLACES = {
  ship: [215, -75],
  shipLoading: [104, -120], // August 1605: brought in close to the landing to load the boards (deep enough to float at low tide)
  camp: [1150, -640],      // a Peskotomuhkati summer camp on the east shore (a representative spot, not a known site)
  campBeach: [1133, -601], // drawn up above the top of the tide
  // On the island these follow Champlain's map, fitted to the island's real (mid-tide) outline: south of the
  // habitation the cemetery (E) toward the west shore, the gardens (B) toward the east, the chapel (F) south of both.
  marchBeach: [-73, -45.8], // where Peskotomuhkati canoes come ashore on the island in the spring of 1605 (drawn up to the top of the tide)
  landing: [30, -110],     // the beach below the habitation, on the channel side
  islandGardens: [12, -60], // B
  cemetery: [-30, -62],    // E
  chapel: [-25, -36],      // F
  batterySouth: [-14, 105], // C, on the little islet the sand spit runs to (cut off at high tide)
  batteryNorth: [-6, -184], // D, at the north end
  mill: [-955, 490],       // I, at the mouth of Beaver Brook
  charcoal: [-965, 70],    // L
  gardensWest: [-880, -10], // M
  gardensEast: [1345, -100], // N
  flake: [30, -40],
};

// The plan of the habitation: plan pixels (the 1308 px scan) to world metres. The plan's right is north along the
// island, its bottom is east. It sits where the island is wide enough for it, just south of the narrow north end
// (the north end itself is only 30-60 m across).
// Across the island (east-west) it is 0.1 m a pixel: the island is no wider. Along the island it is spread a little
// (2026-11-18, the user: room to walk between the buildings, less bunched at the north end): 0.13 m a pixel, measured
// from plan x = 900 so the north end stays where it was and the rest opens out to the south. That makes the compound
// about 65 m across and 90 m long, with a walkway between houses that touched on the plan.
const PLAN = { cx: 632, cy: 500, scale: 0.1, along: 0.13, pin: 900, at: [-25, -118] };
const NORTH = new THREE.Vector2(-0.226, -0.974).normalize();
const EAST = new THREE.Vector2(-NORTH.y, NORTH.x); // (0.974, -0.226)
const PLAN_ROT = Math.atan2(-NORTH.y, NORTH.x); // turns a model's +x to north and its +z (its front) to east
function plan(px, py) {
  const u = (PLAN.pin - PLAN.cx) * PLAN.scale + (px - PLAN.pin) * PLAN.along, v = (py - PLAN.cy) * PLAN.scale;
  return [PLAN.at[0] + u * NORTH.x + v * EAST.x, PLAN.at[1] + u * NORTH.y + v * EAST.y];
}

// Camera for each stop: eye and look-at, in world metres.
export const VIEWS = {
  title: { eye: [105, 76, 73], look: [-12, 8, -100] },
  opening: { eye: [1900, 230, 3900], look: [300, 0, 600] },
  trade: { eye: [243, 11, -62], look: [217, 2.9, -75] },
  plan: { eye: [214, 15, -58], look: [-25, 14, -116] },
  island: { eye: [72, 46, -40], look: [-27, 8, -122] },
  winter: { eye: [360, 200, 330], look: [-10, 0, -40] },
  sickness: { eye: [8, 22, -24], look: [-27, 13, -56] },
  neighbours: { eye: [-108, 11, -14], look: [-76, 3.5, -42] },
  leaving: { eye: [120, 80, 100], look: [92, 5, -116] },
  acadie: { eye: [900, 1800, 2600], look: [0, 0, 0] },
};

function tag(text, cls = '') {
  const d = document.createElement('div');
  d.className = `tag ${cls}`;
  d.textContent = text;
  return new CSS2DObject(d);
}
function letterTag(letter, text) {
  const d = document.createElement('div');
  d.className = 'tag letter';
  d.innerHTML = '<b></b><span></span>';
  d.firstChild.textContent = letter;
  d.lastChild.textContent = text;
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
// The tide (world.js) runs between -0.75 HW and +0.75 HW, about -2.2 m to +2.2 m. Buildings and props are set with
// ground(), which lifts anything below high water up to it; that is why nothing may be put on the beach with it (it
// hangs in the air at low tide). People, and the things the free-roam scenes set down, stand on the real ground
// instead, and must be above +2.2 m so the tide never reaches them.
const stand = (x, z) => heightAt(x, z);
// A boat drawn up on a beach: on the ground, tipped to the slope along her length (local x) and across her. When
// the tide comes in over her she floats, level (update() runs `beached`).
const beached = [];
function beach(obj, x, z, rotY, parent, len = 5, beam = 1.2) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const bow = heightAt(x + c * len / 2, z - s * len / 2), stern = heightAt(x - c * len / 2, z + s * len / 2);
  const port = heightAt(x + s * beam / 2, z + c * beam / 2), stbd = heightAt(x - s * beam / 2, z - c * beam / 2);
  obj.position.set(x, (bow + stern + port + stbd) / 4 - 0.05, z);
  obj.rotation.order = 'YXZ';
  obj.rotation.set(-Math.atan2(port - stbd, beam), rotY, Math.atan2(bow - stern, len));
  obj.userData.beached = { y: obj.position.y, rx: obj.rotation.x, rz: obj.rotation.z, ph: x * 0.7 + z };
  beached.push(obj);
  parent.add(obj);
  return obj;
}
function place(obj, x, z, rotY = 0, parent) {
  obj.position.set(x, ground(x, z), z);
  obj.rotation.y = rotY;
  parent.add(obj);
  return obj;
}
// Keep the threshold above the high side and carry the masonry down to the slope.
function settle(obj, x, z, rotY, w, d) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  let low = Infinity, high = -Infinity;
  for (let i = 0; i <= Math.ceil(w); i++) for (let j = 0; j <= Math.ceil(d); j++) {
    const a = w * (i / Math.ceil(w) - .5), b = d * (j / Math.ceil(d) - .5);
    const y = heightAt(x + a*c + b*s, z - a*s + b*c);
    low = Math.min(low, y);
    high = Math.max(high, y);
  }
  obj.position.set(x, high + .04, z);
  obj.rotation.y = rotY;
  const foot = obj.children.find(o => o.userData.stays);
  if (foot) {
    const depth = high - low + .5;
    foot.geometry.dispose();
    foot.geometry = new THREE.BoxGeometry(w + .3, depth, d + .3).translate(0, .12 - depth / 2, 0);
    const {position, normal, uv} = foot.geometry.attributes;
    for (let i = 0; i < uv.count; i++) {
      const side = Math.abs(normal.getX(i)) > .5, top = Math.abs(normal.getY(i)) > .5;
      uv.setXY(i, (side ? position.getZ(i) : position.getX(i)) / 2, (top ? position.getZ(i) : position.getY(i)) / 1.6);
    }
  }
}

const rand = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const pick = (a) => a[Math.floor(rand() * a.length)];

export async function buildScene(scene, make) {
  const root = new THREE.Group();
  root.name = 'story';
  scene.add(root);
  const smokes = [];
  const letters = { map: [], plan: [] }; // Champlain's letters, for the two maps

  // ---------------------------------------------------------------- the habitation, from the plan

  const hab = new THREE.Group();
  hab.name = 'habitation';
  root.add(hab);
  const buildings = [];
  // letter, name, plan x, plan y, model, footprint [w, d] for settling, extra turn, what it was (for the letter tags)
  const H = [
    ['C', 'storehouse', 805, 168, () => F.hall({ w: 22, d: 7, h: 3.4, name: 'storehouse', chimneyAt: null, doors: [[-6, 'door'], [-2, 'door'], [3, 'win'], [7, 'win']] }), [22, 7], 0, 'the storehouse'],
    ['D', 'swiss_quarters', 530, 200, () => F.hall({ w: 11, d: 6, h: 3, name: 'swiss_quarters' }), [11, 6], 0, 'the Swiss soldiers'],
    ['E', 'forge', 375, 425, () => F.rowHouse({ units: 1, unitW: 4.6, d: 7, name: 'forge', chimneys: [0] }), [4.6, 7], 0, 'the forge'],
    ['F', 'carpenters', 480, 425, { units: 4, unitW: 4.2, d: 7, chimneys: [1, 3] }, [16.8, 7], 0, 'the carpenters'],
    ['A', 'demons_house', 822, 365, () => F.demonsHouse(), [9, 8], 0, 'the Sieur de Mons'],
    ['B', 'public_house', 905, 362, () => F.hall({ w: 9, d: 5, h: 4.4, name: 'public_house', kind: 'framed', chimneyAt: 0.3 }), [9, 5], Math.PI / 2, 'the public house, for rainy days'],
    ['Q', 'lodging_q', 430, 545, { units: 4, unitW: 4.4, d: 7, chimneys: [0, 2, 3] }, [17.6, 7], 0, 'Boulay and other craftsmen'],
    ['P', 'lodging_p', 525, 612, () => F.rowHouse({ units: 1, unitW: 5.2, d: 6, h: 3.4, name: 'lodging_p', kind: 'framed', chimneys: [0] }), [5.2, 6], 0, "d'Orville, Champlain and Champdoré"],
    ['R', 'lodging_r', 847, 545, { units: 2, unitW: 6.6, d: 7, h: 3.4, kind: 'framed', chimneys: [0, 1] }, [13.2, 7], 0, 'Genestou, Sourin and craftsmen'],
    ['T', 'lodging_t', 748, 752, { units: 3, unitW: 4.4, d: 6, chimneys: [0, 2] }, [13.2, 6], 0, 'Beaumont, la Motte and Fougeray'],
    ['V', 'cure', 572, 770, () => F.hall({ w: 11, d: 6, h: 3, name: 'cure' }), [11, 6], 0, 'our priest'],
    ['H', 'bakehouse', 880, 838, () => F.bakehouse(), [7, 5], 0, 'the bake oven'],
    // I: Champlain draws the kitchen on the bank by the water, north-west of the houses. There the real bank is a
    // beach (+2.4 m, under water at spring tides), so it stands at KITCHEN_AT instead (2026-11-19, below).
    ['I', 'kitchen', 1020, 350, () => F.hall({ w: 6, d: 5, h: 2.8, name: 'kitchen', chimneyAt: 0.25 }), [6, 5], -Math.PI / 2, 'the kitchen'], // door to the south, toward the oven
  ];
  // Champlain drew everything square and in line. Real builders weren't so tidy: each building is nudged up to
  // 0.6 m and turned up to 3 degrees, the same way every time (from its letter), so the place looks lived in.
  const jitter = (letter, k) => { const v = Math.sin(letter.charCodeAt(0) * 12.9898 + k * 78.233) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
  // Champlain drew the craftsmen's lodgings (F, Q, R, T) as rows of houses wall to wall. Here each row is its own
  // cottages with a gap of ROW_GAP between them (2026-11-18, the user: room to walk between the buildings), each a
  // little narrower than his units so the row stays near its length on the plan.
  const ROW_GAP = 1.6, ROW_NARROW = 0.88;
  // C, the storehouse: at Champlain's spot it stood on the west bank, 10 m of slope under it and a huge stone foot to
  // match. 2026-11-19 (the user): moved inland, beside the Swiss quarters (D), on flat ground facing the square.
  const STORE_AT = [-40.5, -106];
  // I, the kitchen: at Champlain's spot (and at plan 1020, 350) it stood on the beach of the west bank, inside the
  // tide. 2026-11-19 (the user: nothing in the tidal zone): moved up onto the flat top of the island near the bake
  // oven (H), north of the garden there, 0.8 m of slope under it.
  const KITCHEN_AT = [-14, -155];
  for (const [letter, name, px, py, spec, [w, d], turn, what] of H) {
    const [x0, z0] = letter === 'C' ? STORE_AT : letter === 'I' ? KITCHEN_AT : plan(px, py);
    const shore = letter === 'C' || letter === 'I'; // I stands on the bank, C on a measured flat spot: nudge them least
    // P stood hard against the row Q on the plan (the island is no wider, so across it nothing spreads): 1.5 m east.
    // The forge E sits at the end of the carpenters' row F, which is longer now it has gaps: 1 m south.
    const [ex, ez] = letter === 'P' ? [EAST.x * 1.5, EAST.y * 1.5] : letter === 'E' ? [-NORTH.x, -NORTH.y] : [0, 0];
    const row = typeof spec === 'function' ? null : spec;
    const n = row ? row.units : 1, uw = row ? row.unitW * ROW_NARROW : w;
    for (let i = 0; i < n; i++) {
      const b = row
        ? F.rowHouse({ units: 1, unitW: uw, d: row.d, h: row.h ?? 3, kind: row.kind ?? 'boards', name, chimneys: row.chimneys.includes(i) ? [0] : [] })
        : spec();
      b.name = name;
      b.userData.info = name;
      const along = (i - (n - 1) / 2) * (uw + ROW_GAP); // metres north along the row
      const key = String.fromCharCode(letter.charCodeAt(0) + i * 7);
      const nudge = shore ? 0.2 : row ? 0.25 : 0.6; // cottages in a row move less, so the gaps between them stay open
      const x = x0 + ex + NORTH.x * along + jitter(key, 1) * nudge;
      const z = z0 + ez + NORTH.y * along + jitter(key, 2) * nudge;
      settle(b, x, z, PLAN_ROT + turn + jitter(key, 3) * 0.05, uw, d);
      hab.add(b);
      buildings.push(b);
      b.userData.letter = letter;
      for (const c of b.userData.chimneys || []) {
        const v = new THREE.Vector3(...c).applyEuler(b.rotation).add(b.position);
        smokes.push(Object.assign(smoke(root, [v.x, v.y, v.z]), { kind: 'chimney' }));
      }
      if (i === Math.floor((n - 1) / 2)) { // one letter for the row, over its middle
        const t = letterTag(letter, what);
        t.position.set(n % 2 ? 0 : (uw + ROW_GAP) / 2, 9, 0);
        b.add(t);
        letters.plan.push(t);
      }
    }
  }
  // the square (N) with its tree, the well (G), the palisade (O)
  const [nx, nz] = plan(655, 430);
  const tree = place(F.squareTree(), nx, nz, 0, hab);
  const grove = [tree];
  for (const [px, py, size] of [[238, 215, .85], [223, 394, 1.1], [256, 902, .74], [1048, 110, 1.06], [1061, 598, .9], [1067, 792, 1.1]]) {
    const [x, z] = plan(px, py);
    if (heightAt(x, z) <= HW() + .8) continue;
    const specimen = place(F.squareTree(), x, z, px, hab);
    specimen.scale.setScalar(size);
    grove.push(specimen);
  }
  const wellM = await make('well');
  place(wellM, ...plan(528, 705), 0, hab);
  wellM.userData.info = 'well';
  tree.userData.info = 'square';
  const palisade = new THREE.Group();
  palisade.name = 'palisade';
  hab.add(palisade);
  palisade.add(F.palisade([plan(690, 238), plan(772, 238)], 2.6, ground));
  palisade.add(F.palisade([plan(935, 425), plan(985, 470), plan(985, 525), plan(935, 592)], 2.6, ground));
  for (const [L, at, text] of [['N', [nx, nz], 'the square, with a tree'], ['G', plan(528, 705), 'the well'], ['O', plan(985, 500), 'the palisade']]) {
    const t = letterTag(L, text);
    t.position.set(at[0], ground(...at) + 7, at[1]);
    root.add(t);
    letters.plan.push(t);
  }
  // Footpaths worn into the ground between the houses (world.js draws them; main.js hands them over). Champlain's plan
  // shows none: these are where people would walk, from the landing up to the square and out to the storehouse, the
  // kitchen, the well, the oven, and south to the chapel and the gardens.
  const P = (px, py) => plan(px, py);
  // (P is the plan: x runs north along the island, y runs east. The landing path climbs between V and T, then
  // runs north up the open ground between the rows to the square.)
  const PATHS = [
    [PLACES.landing, [14, -114], P(655, 760), P(655, 640), P(655, 470)],    // up from the landing to the square
    [P(655, 470), [-37, -120], [-47, -122], [-46, -147]],                 // past the storehouse to the woodpile
    [P(655, 640), P(840, 680), P(880, 795)],                               // to the bake oven
    [P(655, 640), P(600, 690), P(545, 700)],                               // to the well
    [P(655, 470), P(560, 488), P(360, 488), [-24, -66], [-25, -40]],       // the walk south, past the cemetery, to the chapel
    [[-24, -66], [2, -62]],                                                // to the gardens on the island
    [P(880, 795), [-12, -152]],                                            // from the oven to the kitchen door
  ];
  const pathSegs = PATHS.flatMap((line) => line.slice(1).map((b, k) => [...line[k], ...b]));
  const squareWorn = [...P(655, 445), 7];

  // gardens: M (the big formal one), L (four plots), X (two small ones), and B on the island map, south of the houses
  const gardens = new THREE.Group();
  gardens.name = 'gardens';
  root.add(gardens);
  const beds = [];
  function bed(w, d, rows, [x, z], angle, parent = gardens, formal = false) {
    const base = heightAt(x, z), cos = Math.cos(angle), sin = Math.sin(angle);
    const relief = (a, b) => heightAt(x + a*cos + b*sin, z - a*sin + b*cos) - base;
    const g = F.garden(w, d, rows, relief, formal);
    g.position.set(x, base, z);
    g.rotation.y = angle;
    g.userData.info = parent === gardens ? 'gardens' : 'gardens_mainland';
    parent.add(g);
    beds.push(g);
  }
  // Champlain's plan puts M west of the forge and L east of the lodgings, but the real island is narrower than his
  // plan, and there both ran down the banks (M into the river: 10 m of drop across it, L 6 m). 2026-11-19 (the user:
  // a garden on a massive slope looks off): every bed now sits where the ground drops no more than about 1.3 m across
  // it, clear of the buildings and the footpaths. M joins the island gardens (B) on the flat ground south of the
  // houses, L is smaller to fit the flat east of the lodgings, X is a little smaller, and two B beds moved 6 m west.
  const M_AT = [-10.4, -57.4], L_AT = [2.2, -84.9], X_AT = [6.5, -131.5];
  bed(12, 21, 0, M_AT, PLAN_ROT, gardens, true);
  bed(7, 11.5, 0, L_AT, PLAN_ROT, gardens, true);
  bed(7.7, 3.1, 0, X_AT, PLAN_ROT - .06, gardens, true);
  bed(14, 5, 0, plan(845, 654), PLAN_ROT, gardens, true);
  for (const [x, z, w, d, r] of [[4, -70, 18, 11, .1], [18, -60, 9.8, 7, -.15], [4, -44, 16, 10, .05]]) bed(w, d, 7, [x, z], PLAN_ROT + r);
  for (const [L, at, text] of [['M', M_AT, 'more gardens'], ['L', L_AT, 'gardens'], ['X', X_AT, 'more gardens']]) {
    const t = letterTag(L, text);
    t.position.set(at[0], ground(...at) + 4, at[1]);
    root.add(t);
    letters.plan.push(t);
  }


  // ---------------------------------------------------------------- the rest of the island, from the island map

  const chap = F.chapel();
  settle(chap, ...PLACES.chapel, PLAN_ROT, 7, 4.5);
  root.add(chap);
  chap.userData.order = 3;
  chap.userData.info = 'chapel';
  buildings.push(chap);
  const crosses = [];
  for (let i = 0; i < 35; i++) {
    const c = F.graveCross();
    const row = Math.floor(i / 7), col = i % 7;
    const x = PLACES.cemetery[0] + (col - 3) * 1.6 * EAST.x + (row - 2) * 1.9 * NORTH.x;
    const z = PLACES.cemetery[1] + (col - 3) * 1.6 * EAST.y + (row - 2) * 1.9 * NORTH.y;
    c.position.set(x, ground(x, z) - 0.05, z);
    c.rotation.y = PLAN_ROT + Math.PI / 2 + (rand() - 0.5) * 0.1;
    c.visible = false;
    c.userData.info = 'cemetery';
    root.add(c);
    crosses.push(c);
  }
  const batterySouth = F.battery(2);
  batterySouth.name = 'battery_south';
  place(batterySouth, ...PLACES.batterySouth, 0, root); // guns facing south, down the river (the battery's front is +z)
  const batteryNorth = F.battery(2);
  batteryNorth.name = 'battery_north';
  place(batteryNorth, ...PLACES.batteryNorth, Math.PI + 0.2, root); // guns facing north, up the river
  batteryNorth.position.y -= 0.3;
  batterySouth.userData.info = 'battery_south';
  batteryNorth.userData.info = 'battery_north';
  const flake = F.codFlake(5);
  place(flake, ...PLACES.flake, 0.4, root);
  flake.userData.info = 'flake';
  const wood = F.woodpile(1.6);
  place(wood, ...plan(980, 380), PLAN_ROT, root);
  wood.userData.info = 'woodpile';
  const planks = F.plankPile(8);
  // stacked at the top of the bank above the landing (the beach below is under water at high tide), along the slope
  place(planks, 6.5, -120.5, -0.87, root);
  planks.position.y = heightAt(6.5, -120.5) - 0.04;

  // G: rocky shoals around the island, thickest off the south end and in a fan to the north-east
  {
    const geo = F.boulderGeometry();
    const spots = [];
    // (the ledge south-east of the island, bare at half tide, is the biggest of them)
    const zones = [[0, 110, 60, 40], [112, 72, 28, 38], [110, -230, 90, 70], [-30, -225, 40, 25], [-90, -60, 25, 90], [65, -20, 25, 110]];
    for (const [zx, zz, rx, rz] of zones) for (let i = 0; i < 70; i++) {
      const x = zx + (rand() * 2 - 1) * rx, z = zz + (rand() * 2 - 1) * rz, h = heightAt(x, z);
      if (h > -HW() + 0.3 && h < HW() - 0.2) spots.push([x, h, z, 0.3 + rand() ** 2 * 1.4]);
    }
    const rocks = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#6f6a62', roughness: 1 }), spots.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    spots.forEach(([x, y, z, s], i) => { m4.compose(new THREE.Vector3(x, y + s * 0.2, z), q.setFromEuler(e.set(0, rand() * 6, 0)), new THREE.Vector3(s, s, s)); rocks.setMatrixAt(i, m4); });
    rocks.castShadow = rocks.receiveShadow = true;
    root.add(rocks);
  }

  // the mainland: the mill (I), the charcoal place (L), gardens west (M) and east (N)
  const mill = F.waterMill();
  place(mill, ...PLACES.mill, 2.2, root);
  mill.userData.info = 'mill';
  const charcoal = F.charcoalMound();
  place(charcoal, ...PLACES.charcoal, 0, root);
  charcoal.userData.info = 'charcoal';
  smokes.push(Object.assign(smoke(root, [PLACES.charcoal[0], ground(...PLACES.charcoal) + 1.8, PLACES.charcoal[1]], { size: 3, count: 14 }), { kind: 'charcoal' }));
  bed(22, 14, 8, PLACES.gardensWest, .3, root);
  bed(20, 14, 7, PLACES.gardensEast, -.2, root);

  // the letters of the island map, for the map viewer
  for (const [L, at, text, up] of [
    ['A', PLAN.at, 'the habitation', 16], ['B', PLACES.islandGardens, 'gardens', 5], ['C', PLACES.batterySouth, 'a little islet with the cannon', 6],
    ['D', PLACES.batteryNorth, 'a platform with cannon', 6], ['E', PLACES.cemetery, 'the cemetery', 5], ['F', PLACES.chapel, 'the chapel', 9],
    ['G', [110, 70], 'rocky shoals', 3], ['H', [47, 1610], 'a small islet (Little Dochet)', 8], ['I', PLACES.mill, 'the water mill de Mons began', 8],
    ['L', PLACES.charcoal, 'where they made charcoal', 6], ['M', PLACES.gardensWest, 'gardens on the west shore', 5], ['N', PLACES.gardensEast, 'gardens on the east shore', 5],
    ['P', [420, 380], 'Rivière des Etechemins', 0],
  ]) {
    const t = letterTag(L, text);
    t.position.set(at[0], Math.max(heightAt(...at), 0) + up, at[1]);
    root.add(t);
    letters.map.push(t);
  }
  for (const t of [...letters.map, ...letters.plan]) t.visible = false;

  // ---------------------------------------------------------------- the ship and the trade beside it

  const ship = await make('ship');
  ship.position.set(PLACES.ship[0], 0, PLACES.ship[1]);
  ship.rotation.y = -1.9; // bow upriver, to the north-north-west
  ship.userData.info = 'ship';
  root.add(ship);
  const fittings = F.deckFittings(ship.userData.source === 'glb');
  fittings.position.y = ship.userData.deckY + (ship.userData.source === 'glb' ? 0 : .075);
  ship.add(fittings);
  const cargoStacks = new THREE.Group();
  for (const [x,z] of [[-6.75,-1.05],[-7.35,-1.02],[-1.5,-1.08]]) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(.56,.41,.48), new THREE.MeshStandardMaterial({color: '#9a7a55'}));
    crate.position.set(x,.205,z);
    crate.castShadow = crate.receiveShadow = true;
    cargoStacks.add(crate);
  }
  fittings.add(cargoStacks);
  const deck = new THREE.Group(); // on deck, at the waist on the side facing the camera
  deck.position.set(1.2, ship.userData.deckY + 0.1, -2.2);
  ship.add(deck);
  const kettle = await make('trade_kettle');
  kettle.position.set(-0.8, 0, 0);
  kettle.scale.setScalar(2.2);
  const ax = F.axe(); ax.position.set(0.1, 0, 0.1); ax.scale.setScalar(2);
  const cl = F.cloth(); cl.position.set(1.0, 0, -0.1); cl.scale.setScalar(1.6);
  const kn = F.knife(); kn.position.set(0.3, 0, 0.5); kn.scale.setScalar(2.2);
  for (const b of [F.barrel(), F.barrel()]) { b.position.set(-2.4 + rand(), 0, -0.6 + rand()); deck.add(b); }
  deck.add(kettle, ax, cl, kn);
  const tradeCanoe = await make('canoe_birch');
  tradeCanoe.name = 'trade_canoe';
  const peltPile = F.pelts();
  tradeCanoe.scale.setScalar(1.28);
  peltPile.scale.set(.82,.64,.56);
  peltPile.position.set(.48, .095, 0);
  tradeCanoe.add(peltPile);
  root.add(tradeCanoe);
  const shallop = F.shallop();
  root.add(shallop);
  // a pair of oars for each rower, pivoting on the gunwales; they sweep with the rower's stroke (see update)
  const oars = [];
  {
    const wood = new THREE.MeshStandardMaterial({ color: '#9a7a52', roughness: 0.9 });
    const oarGeo = mergeGeometries([
      new THREE.CylinderGeometry(0.035, 0.035, 3.6, 6).rotateX(Math.PI / 2).translate(0, 0, 0.9),
      new THREE.BoxGeometry(0.04, 0.2, 0.75).translate(0, 0, 2.95),
    ]);
    for (const x of [-1.5, 0, 1.5]) for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(x + 0.45, 0.62, side * 1.0);
      pivot.rotation.order = 'YXZ';
      const oar = new THREE.Mesh(oarGeo, wood);
      if (side < 0) oar.rotation.y = Math.PI;
      oar.castShadow = true;
      pivot.add(oar);
      pivot.userData = { x, side };
      shallop.add(pivot);
      oars.push(pivot);
    }
  }

  // ---------------------------------------------------------------- a Peskotomuhkati summer camp, and the spring canoes

  const camp = new THREE.Group();
  camp.name = 'summer_camp';
  camp.userData.info = 'camp';
  root.add(camp);
  const [cx, cz] = PLACES.camp;
  for (const [x, z, r] of [[0, 0, 0], [9, 6, 1], [-7, 9, 2], [3, 15, 0.5]]) place(await make('wigwam'), cx + x, cz + z, r, camp);
  const rack = await make('fish_rack');
  if (rack) place(rack, cx + 14, cz + 18, 0.6, camp);
  const fire = smoke(root, [cx + 2, ground(cx + 2, cz + 7) + 0.6, cz + 7], { size: 1.6 });
  fire.kind = 'camp';
  smokes.push(fire);
  for (const [x, z, r] of [[0, 0, 2.2], [4, 3, 2.4], [-3, 5, 2.1]]) beach(await make('canoe_birch'), PLACES.campBeach[0] + x, PLACES.campBeach[1] + z, r, camp);
  const march = new THREE.Group();
  march.name = 'march_canoes';
  root.add(march);
  // spring 1605: the Passamaquoddy came back from their winter camps to the shores of the island, and helped (NPS)
  for (const [x, z, r] of [[0, 0, 0], [-2.5, -3.7, 0.79]]) beach(await make('canoe_birch'), PLACES.marchBeach[0] + x, PLACES.marchBeach[1] + z, r, march);

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

  // ---------------------------------------------------------------- people

  // Who is where, by stop and month. All the French on the island were men: 79 of them wintered there.
  // `when(st)` decides if a figure shows. Figures with a `path` walk it back and forth.
  const crowd = new Crowd(220, await make('people'));
  root.add(crowd.group);
  const FR = {
    coat: ['#6b4a32', '#5a5e66', '#3e4a5c', '#7a4030', '#8a7a5a', '#4d5a3a', '#6e6253', '#5b3d3d'],
    legs: ['#4a3b2e', '#3a3a40', '#5a4a38', '#2f3440', '#6a5a48'],
    skin: ['#e8c3a0', '#dcb08a', '#f0cfb0', '#c99b78', '#e2b996'],
    hair: ['#3a2a1e', '#5a4030', '#2a2420', '#7a5a3a', '#8a6a4a', '#4a3a30'],
    felt: ['#2a2622', '#4a3a2e', '#3a3a3a', '#5a4a3a'],
    cap: ['#8a3a2e', '#3e4a5c', '#6e6253', '#5a5e66'],
  };
  const PK = {
    coat: ['#8a6a4a', '#7a5a3e', '#9a7a58', '#6e5034'],
    legs: ['#6e5034', '#7a5a3e', '#5e4430'],
    skin: ['#a9744f', '#9c6a48', '#b07c56', '#a06e4c'],
    robe: ['#5a4030', '#4e3a2c', '#64483a'],
  };
  function french(f) {
    const hat = f.hat ?? pick(['felt', 'felt', 'monmouth', 'monmouth', null]);
    return crowd.add({
      kind: 'man', beard: rand() < 0.6, hat,
      colors: { coat: pick(FR.coat), legs: pick(FR.legs), skin: pick(FR.skin), hair: pick(FR.hair), hat: hat === 'felt' ? pick(FR.felt) : pick(FR.cap) },
      ...f,
    });
  }
  function peskotomuhkati(f) {
    const winter = f.winter;
    return crowd.add({
      kind: f.kind ?? 'man', longHair: true, wrap: true, hat: null,
      colors: { coat: winter ? pick(PK.robe) : pick(PK.coat), legs: pick(PK.legs), skin: pick(PK.skin), hair: '#1e1a18', dress: winter ? pick(PK.robe) : pick(PK.coat) },
      ...f,
    });
  }
  const isSummer = (st) => st.month < 3.5 || st.month > 10.5;
  const onIsland = (st) => ['trade', 'plan', 'island', 'winter', 'sickness', 'neighbours', 'leaving'].includes(st.stop);
  const at = (px, py, dx = 0, dz = 0) => { const [x, z] = plan(px, py); return [x + dx, z + dz]; };
  const face = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
  // summer: building, gardening, carrying boards up from the landing, talking in the square
  const square = at(655, 470);
  for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + i, c = [square[0] + i * 9 - 4 + Math.cos(a) * 1.1, square[1] + i * 5 - 2 + Math.sin(a) * 1.1];
    french({ x: c[0], z: c[1], heading: face(c, [square[0] + i * 9 - 4, square[1] + i * 5 - 2]), action: 'chat', when: (st) => onIsland(st) && isSummer(st) && st.stop !== 'leaving' });
  }
  const woodAt = plan(980, 380);
  for (let i = 0; i < 3; i++) {
    const p = [woodAt[0] + 3 + i * 1.8, woodAt[1] - 2 + i];
    french({ x: p[0], z: p[1], heading: -1 + i, action: 'chop', tool: 'axe', hat: 'monmouth', when: (st) => onIsland(st) && st.month < 9.5 && st.stop !== 'leaving' && !(st.month > 7.5 && i > 0) });
  }
  for (const g of beds.slice(5, 8)) for (let i = 0; i < 2; i++) {
    french({ x: g.position.x + (i - 0.5) * 4, z: g.position.z + (rand() - 0.5) * 3, heading: rand() * 6, action: 'hoe', tool: 'hoe', when: (st) => onIsland(st) && isSummer(st) && st.stop !== 'leaving' });
  }
  const lm = beds[1].position; // L
  french({ x: lm.x + 2, z: lm.z, heading: 1, action: 'hoe', tool: 'hoe', when: (st) => onIsland(st) && isSummer(st) && st.stop !== 'leaving' });
  // the boards come up the footpath from the landing, from the water's edge at the top of the tide (the landing
  // itself is out on the beach, under water at high tide)
  const shoreEdge = [22, -113];
  const toHouses = [shoreEdge, ...PATHS[0].slice(1)];
  for (let i = 0; i < 4; i++) {
    french({ x: toHouses[0][0], z: toHouses[0][1], heading: 0, action: 'shoulder', tool: 'plank', path: toHouses, speed: 1.1, offset: i * 0.25,
      when: (st) => onIsland(st) && st.month < 2.5 && st.stop !== 'leaving' });
  }
  // people coming and going on the footpaths in summer: water from the well, baskets to the oven, a pair walking south
  const onPath = (st) => onIsland(st) && isSummer(st) && st.stop !== 'leaving';
  french({ x: 0, z: 0, heading: 0, action: 'walk', tool: 'bucket', path: PATHS[3], speed: 1.0, offset: 0.1, hat: 'monmouth', when: onPath });
  french({ x: 0, z: 0, heading: 0, action: 'walk', tool: 'basket', path: PATHS[2], speed: 0.9, offset: 0.6, when: onPath });
  for (let i = 0; i < 2; i++) french({ x: 0, z: 0, heading: 0, action: 'walk', path: PATHS[4], speed: 0.8, offset: 0.3 + i * 0.012, hat: 'felt', when: onPath });
  french({ x: 0, z: 0, heading: 0, action: 'walk', path: PATHS[1], speed: 1.1, offset: 0.45, when: onPath });
  // the well: someone drawing water in every season
  const wl = plan(528, 705);
  french({ x: wl[0] + 1.3, z: wl[1], heading: -Math.PI / 2, action: 'reach', tool: 'bucket', when: (st) => onIsland(st) && st.stop !== 'leaving' });
  // the batteries: a man on watch at each
  for (const b of [PLACES.batteryNorth, PLACES.batterySouth]) french({ x: b[0] + 1.5, z: b[1] + 1.5, heading: rand() * 6, action: 'idle', hat: 'felt', y: () => ground(...b) + 1, when: (st) => onIsland(st) && st.month < 4 });
  // winter: a few men carry firewood from the pile to the houses; fewer as the sickness spreads
  const woodRun = [woodAt, at(900, 470), at(700, 480), at(560, 480)];
  for (let i = 0; i < 4; i++) {
    french({ x: woodRun[0][0], z: woodRun[0][1], heading: 0, action: 'carry', tool: 'logs', path: woodRun, speed: 0.7, offset: i * 0.25, hat: 'monmouth',
      when: (st) => onIsland(st) && st.month >= 4 && st.month <= 10 && (i < 2 || st.month < 7.5 || st.month > 9.5) });
  }
  // the trade: Peskotomuhkati traders in the canoe beside the ship, French traders at the rail
  const paddlers = [-1.3, 1.3].map((dx) => peskotomuhkati({ x: 0, z: 0, heading: 0, action: 'paddle', tool: 'paddle', when: (st) => st.stop === 'trade' || st.stop === 'plan' || (st.roam && st.season === 'summer'), canoe: dx, scale: .86, y: f => f.deckHeight }));
  const deckHands = [];
  function sailor(x, z, facing, action, options = {}) {
    deckHands.push(french({ x: 0, z: 0, heading: 0, hat: 'monmouth', action,
      deck: [x, z], facing, y: f => f.deckHeight, when: () => ship.visible, ...options }));
  }
  sailor(.9, -1.45, Math.PI, 'chat');
  sailor(-.8, 1.94, 0, 'haul');
  sailor(-6.65, .45, 2.2, 'reach');
  sailor(0, -1.02, 0, 'carry', { route: [-6.1,-2.1], tool: 'crate', cargo: true, cycle: 15 });
  sailor(0, .28, 0, 'walk', { route: [.72,3.95], cycle: 12 });
  sailor(9.5, -.7, 2.75, 'idle', { upperDeck: true });
  // the summer camp: families at their camp
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, r = 4 + rand() * 4;
    const p = [cx + 2 + Math.cos(a) * r, cz + 8 + Math.sin(a) * r];
    peskotomuhkati({ x: p[0], z: p[1], heading: face(p, [cx + 2, cz + 8]), kind: i % 3 === 1 ? 'woman' : i === 5 ? 'boy' : 'man', action: i % 2 ? 'chat' : 'idle', when: (st) => camp.visible });
  }
  // spring 1605: Peskotomuhkati people ashore on the island, and French who came down to meet them
  const mb = PLACES.marchBeach;
  // (the Peskotomuhkati just above their canoes, the French coming down the bank: all above the top of the tide)
  const meet = [mb[0] + 6, mb[1] + 3.8];
  [[-0.5, 2.3], [1, 2.8], [2.5, 2]].forEach(([dx, dz], i) => { const p = [mb[0] + dx, mb[1] + dz]; peskotomuhkati({ x: p[0], z: p[1], heading: face(p, meet), winter: true, action: i === 1 ? 'chat' : 'idle', when: (st) => march.visible }); });
  [[6, 3.8], [7.4, 4.9]].forEach(([dx, dz], i) => { const p = [mb[0] + dx, mb[1] + dz]; french({ x: p[0], z: p[1], heading: face(p, [mb[0] + 1, mb[1] + 2.5]), action: i ? 'idle' : 'chat', hat: 'monmouth', when: (st) => march.visible }); });
  // leaving: men carry the boards down to the landing; the shallop takes them out to the ship
  // (they stop at the water's edge at the top of the tide, not out on the beach)
  const toBoats = [...toHouses].reverse();
  for (let i = 0; i < 8; i++) french({ x: toBoats[0][0], z: toBoats[0][1], heading: 0, action: 'shoulder', tool: 'plank', path: toBoats, speed: 1.2, offset: i / 8, when: (st) => st.stop === 'leaving' });
  const rowers = [-1.5, 0, 1.5].map((dx) => french({ x: 0, z: 0, heading: 0, action: 'row', hat: 'monmouth', when: (st) => st.stop === 'leaving', boat: dx, y: f => f.deckHeight }));

  // walk a path back and forth: f.path, f.speed (m/s), f.offset (0..1 of the way round)
  function walk(f, t) {
    if (!f.path) return;
    if (!f.legs) {
      f.legs = [];
      let total = 0;
      const pts = [...f.path, ...f.path.slice(0, -1).reverse()];
      for (let k = 1; k < pts.length; k++) { const L = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); f.legs.push([pts[k - 1], pts[k], total, L]); total += L; }
      f.total = total;
    }
    const d = ((t * f.speed) + (f.offset ?? 0) * f.total) % f.total;
    const leg = f.legs.find((l) => d >= l[2] && d < l[2] + l[3]) || f.legs[0];
    const k = (d - leg[2]) / leg[3];
    f.x = leg[0][0] + (leg[1][0] - leg[0][0]) * k;
    f.z = leg[0][1] + (leg[1][1] - leg[0][1]) * k;
    f.heading = Math.atan2(leg[1][0] - leg[0][0], leg[1][1] - leg[0][1]);
  }

  // ---------------------------------------------------------------- the island's small things (island-detail.js)

  // kept clear: the free-roam scenes, the cemetery, the landing and the spring canoes' beach
  const keepClear = [
    ...SCENES.map((sc) => [...(sc.world ? sc.at : plan(...sc.at)), 6]),
    [...PLACES.cemetery, 8], [...PLACES.landing, 7], [...PLACES.marchBeach, 9],
  ];
  const detail = buildIslandDetail({ root, buildings, beds, others: [wellM, tree, flake, wood, planks, batteryNorth], pathSegs, square: squareWorn,
    spots: keepClear, rand, PLAN_ROT });

  // free roam: the shallop drawn up on the beach below the landing (afloat when the tide is in), and in summer a
  // Peskotomuhkati canoe going up and down the channel east of the island
  const beachAt = [PLACES.landing[0] + 2, PLACES.landing[1] - 1];
  const canoeLoop = { cx: 125, cz: -170, rx: 25, rz: 170, speed: 1.4 };
  let canoeA = 0;

  // ---------------------------------------------------------------- state

  const picks = ['pelts', 'trade_kettle', 'axe', 'cloth', 'storehouse', 'gardens', 'palisade', 'battery_north', 'battery_south'];
  const pickObj = { pelts: peltPile, trade_kettle: kettle, axe: ax, cloth: cl, storehouse: buildings[0], gardens, palisade, battery_north: batteryNorth, battery_south: batterySouth };
  for (const [n, o] of Object.entries(pickObj)) o.name = n;

  const st = { month: 0, stop: null, dismantle: 0, dismantling: false, lit: [], letters: null, roam: false, season: null };
  const roofSnow = new THREE.Color('#e9edf2');

  function setMonth(m) {
    st.month = m;
    const cal = CALENDAR[Math.round(m)];
    const snow = season('snow', m);
    // snow on the roofs (a white roof drops its shingle texture) and over the gardens
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
    root.traverse((o) => {
      if (!o.isMesh || !o.parent || o.parent.name !== 'garden') return;
      o.material.userData.base ||= o.material.color.clone();
      o.material.color.copy(o.material.userData.base).lerp(roofSnow, snow * 0.9);
    });
    const grow = m < 3 ? 0.3 + m * 0.25 : m < 10 ? 0 : m < 11 ? 0.1 : Math.min(1, 0.25 + (m - 11) * 0.3);
    beds.forEach((g) => g.userData.grow?.(grow));
    camp.visible = cal.camp === 'coast';
    march.visible = Math.round(m) === 11; // May 1605
    crosses.forEach((c, i) => { c.visible = i < cal.dead; });
    for (const s of smokes) s.on = s.kind === 'camp' ? camp.visible : s.kind === 'charcoal' ? m < 4 || m > 10.5 : m >= 3 && m <= 11 && st.dismantle < 0.2;
    const leaf = season('leaves', m);
    for (const tree of grove) {
      const crown = tree.getObjectByName('square_tree_crown');
      crown.visible = leaf > .1;
      crown.material.color.set(leaf > .55 ? '#719344' : '#ae844a');
    }
    if (st.stop === 'winter') ship.visible = m < 3 || m > 11;
    detail.setMonth(m);
    for (const f of crowd.list) f.hidden = !f.when(st);
  }

  // the ship and the boats beside it
  const tmpV = new THREE.Vector3();
  function ride(f, boat, x, y, z, facing) {
    boat.localToWorld(tmpV.set(x, y, z));
    f.x = tmpV.x;
    f.z = tmpV.z;
    f.deckHeight = tmpV.y;
    f.heading = boat.rotation.y + facing;
  }
  function placeBoats() {
    tmpV.set(1.5, 0, -6.4).applyEuler(ship.rotation).add(ship.position);
    tradeCanoe.position.set(tmpV.x, 0, tmpV.z);
    tradeCanoe.rotation.y = ship.rotation.y;
    tmpV.set(-6, 0, 7.5).applyEuler(ship.rotation).add(ship.position);
    shallop.position.set(tmpV.x, 0, tmpV.z);
    shallop.rotation.y = ship.rotation.y + 0.2;
  }

  function setStop(id, month) {
    st.stop = id;
    const sp = id === 'leaving' ? PLACES.shipLoading : PLACES.ship;
    ship.position.set(sp[0], 0, sp[1]);
    placeBoats();
    shallopHome.copy(shallop.position);
    tradeCanoe.visible = id === 'trade' || id === 'plan';
    ship.visible = ['trade', 'plan', 'island', 'leaving', 'winter'].includes(id);
    st.dismantling = id === 'leaving';
    if (id !== 'leaving') st.dismantle = 0;
    labels.forEach((l) => { l.visible = ['island', 'winter', 'neighbours', 'acadie'].includes(id); });
    labels[0].visible = id === 'winter' || id === 'neighbours';
    setMonth(month);
    highlight(null);
  }

  // Champlain's letters on the 3D scene: 'map' for the island map, 'plan' for the plan of the habitation, or null.
  function setLetters(which) {
    st.letters = which;
    for (const t of letters.map) t.visible = which === 'map';
    for (const t of letters.plan) t.visible = which === 'plan';
  }

  function highlight(names) {
    st.lit.forEach((o) => glow(o, false));
    st.lit = [names].flat().filter(Boolean).map((n) => pickObj[n]).filter(Boolean);
    st.lit.forEach((o) => glow(o, true));
  }

  // Taking the buildings apart: walls and roofs lift off, fly out to the ship, and only the stone footings stay.
  const flyParts = [];
  for (const b of buildings) b.traverse((o) => {
    if (o.isMesh && !o.userData.stays && o.parent === b) flyParts.push({ o, b, home: o.position.clone(), homeS: o.scale.clone(), delay: rand() * 0.5 });
  });
  const shipDeck = new THREE.Vector3(), worldHome = new THREE.Vector3(), localTarget = new THREE.Vector3();
  function stepDismantle(dt) {
    if (st.dismantling) st.dismantle = Math.min(1, st.dismantle + dt / 14);
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

  const shallopHome = new THREE.Vector3(), shallopShore = new THREE.Vector3(PLACES.landing[0] + 14, 0, PLACES.landing[1] + 2);
  placeBoats();
  setStop('trade', 0);
  const shipBed = () => heightAt(ship.position.x, ship.position.z) + 2.3; // where the keel would touch the mud
  return {
    picks,
    paths: { segs: pathSegs, square: squareWorn },
    // for free roam (explore.js): what can be clicked, and the means to add the scenes' people and props
    explore: {
      root, crowd, french, peskotomuhkati, plan, ground: stand, PLACES, glow,
      targets: [...buildings, wellM, tree, ...beds, ...crosses, batterySouth, batteryNorth, flake, wood, mill, charcoal, ship, camp],
      // roam: on or off; season: 'summer' or 'winter' (who shows is decided again on the next setMonth)
      setRoam(on, season) {
        st.roam = on; st.season = season;
        tradeCanoe.visible = on ? season === 'summer' : st.stop === 'trade' || st.stop === 'plan';
        if (!on) { placeBoats(); shallopHome.copy(shallop.position); }
      },
      get state() { return st; },
    },
    setStop,
    setMonth,
    setLetters,
    get month() { return st.month; },
    react(e) {
      if (e.type === 'select' || e.type === 'option') highlight(e.pick);
      if (e.type === 'item-correct') highlight(null);
      if (e.type === 'task-done' || e.type === 'task-start') highlight(null);
    },
    update(dt, t, tide, camera) {
      ship.position.y = Math.max(tide + Math.sin(t * 0.6) * 0.08, shipBed()); // at low tide she sits on the mud
      ship.rotation.z = Math.sin(t * 0.5) * 0.012;
      ship.userData.flag.rotation.y = Math.sin(t * 1.3) * 0.25;
      tradeCanoe.position.y = Math.max(heightAt(tradeCanoe.position.x, tradeCanoe.position.z), tide - .14) + Math.sin(t * 0.9 + 1) * 0.05;
      // on the last stop the shallop shuttles between the landing and the ship
      if (st.stop === 'leaving') {
        const k = 0.5 - 0.5 * Math.cos(t * 0.12);
        shallop.position.lerpVectors(shallopShore, shallopHome, k);
        shallop.rotation.y = Math.atan2(shallopHome.x - shallopShore.x, shallopHome.z - shallopShore.z) - Math.PI / 2;
      } else shallop.position.copy(shallopHome);
      shallop.position.y = tide + Math.sin(t * 0.8 + 2) * 0.06;
      if (st.roam) {
        // drawn up at the landing: she settles on the beach as the tide goes out
        shallop.position.set(beachAt[0], Math.max(tide + Math.sin(t * 0.8 + 2) * 0.04, heightAt(...beachAt) + 0.12), beachAt[1]);
        shallop.rotation.y = 0.35;
        if (tradeCanoe.visible) {
          const L = canoeLoop;
          canoeA += (L.speed / Math.hypot(L.rx * Math.sin(canoeA), L.rz * Math.cos(canoeA))) * dt;
          const dx = -L.rx * Math.sin(canoeA), dz = L.rz * Math.cos(canoeA);
          tradeCanoe.position.x = L.cx + L.rx * Math.cos(canoeA);
          tradeCanoe.position.z = L.cz + L.rz * Math.sin(canoeA);
          tradeCanoe.rotation.y = Math.atan2(-dz, dx) + Math.PI; // the paddlers face her -x
        }
      }
      detail.update(dt, t, tide);
      // canoes drawn up on a beach: aground at low tide, afloat and level when the water reaches them
      for (const b of beached) {
        const u = b.userData.beached, fy = tide - 0.12 + Math.sin(t * 0.9 + u.ph) * 0.03;
        const k = THREE.MathUtils.clamp((fy - u.y) / 0.25, 0, 1);
        b.position.y = Math.max(u.y, fy);
        b.rotation.x = u.rx * (1 - k);
        b.rotation.z = u.rz * (1 - k);
      }
      mill.userData.wheel.rotation.z -= dt * 0.8;
      for (const s of smokes) s(dt);
      stepDismantle(dt);
      // people riding boats: their place follows the boat
      for (const f of paddlers) ride(f, tradeCanoe, f.canoe, .085, 0, -Math.PI/2);
      for (const f of rowers) ride(f, shallop, f.boat, .20, 0, -Math.PI/2);
      // the oars follow their rower's stroke (the same sine as ACTIONS.row in people.js)
      for (const o of oars) {
        const f = rowers[[-1.5, 0, 1.5].indexOf(o.userData.x)];
        o.visible = !f.hidden; // no rower, no oars (they are stowed)
        const s = Math.sin(Math.PI * (t + f.phase) + f.seed);
        o.rotation.y = o.userData.side * 0.45 * s;
        o.rotation.x = o.userData.side * (0.2 + 0.1 * Math.cos(Math.PI * (t + f.phase) + f.seed));
      }
      for (const f of deckHands) {
        if (f.hidden) continue;
        let [x,z] = f.deck, facing = f.facing;
        if (f.route) {
          const phase = ((t + f.phase) % f.cycle) / f.cycle;
          const outbound = phase < .5;
          const leg = (phase % .5)*2;
          const progress = THREE.MathUtils.clamp((leg-.13)/.74,0,1);
          x = THREE.MathUtils.lerp(...f.route, outbound ? progress : 1-progress);
          facing = (outbound ? 1 : -1)*Math.PI/2;
          if (f.cargo) {
            crowd.setTool(f,outbound ? 'crate' : null);
            f.action = outbound ? 'carry' : 'walk';
          }
        }
        const y = f.upperDeck ? (ship.userData.source === 'glb' ? 3.89 : 3.975) : fittings.position.y;
        ride(f,ship,x,y,z,facing);
      }
      for (const f of crowd.list) if (f.path && !f.hidden) walk(f, t);
      if (camera) crowd.update(dt, t, { camera, groundY: stand, range: 900 });
    },
    pickable: (name) => pickObj[name],
  };
}
