// Builds the St. Croix River stage from raw map data.
//
//   in:  data/raw/terrarium/14_*.png  AWS Terrain Tiles (Terrarium encoding), zoom 14 (about 6.7 m a pixel)
//        data/raw/osm.json            OpenStreetMap coastline, islets and place names (Overpass, 2026-11-18)
//   out: public/data/meta.json        grid sizes, origin, the island's outline, place names
//        public/data/height.bin       Float32 ground height (m) on the main grid (CELL m)
//        public/data/inset.bin        Float32 ground height on the island inset (INSET_CELL m)
//        public/data/inset-kind.bin   Uint8 ground kind on the inset: 0 by height, 1 sand, 2 rock
//   and: data/island-trace.png        the island's mid-tide shore, traced from air photos (see the island section)
//        public/data/trees.bin        Float32 [x, z, kind, scale] per tree
//        data/preview.png             a top-down check image (not shipped)
//
// Heights: 0 is mean sea level. OSM's coastline is roughly high water. The tide here runs about 6 m, so high
// water is +HW and low water is -HW, and the flats between show and hide with the tide.
//
// Re-run after changing a constant: npm run build:data

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'data');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- config

// The river from above the island down to where it opens into Passamaquoddy Bay. Origin = the island.
const BBOX = { s: 45.088, n: 45.168, w: -67.190, e: -67.072 };
const ORIGIN = { lat: 45.1280, lon: -67.1334 };
const FINE = 5;          // metres per cell of the working rasters
const CELL = 20;         // main mesh
const INSET_CELL = 2;    // the island and the water around it (fine enough for the spit, about 8 m wide)
const INSET_HALF = [300, 420]; // half-size of the inset in x and z (m)
export const HW = 2.9;   // high water above mean sea level (m)

const M_LAT = 111135, M_LON = 78680;
const toX = (lon) => (lon - ORIGIN.lon) * M_LON;
const toZ = (lat) => -(lat - ORIGIN.lat) * M_LAT; // north is -z
const XMIN = toX(BBOX.w), XMAX = toX(BBOX.e), ZMIN = toZ(BBOX.n), ZMAX = toZ(BBOX.s);
const FW = Math.ceil((XMAX - XMIN) / FINE), FH = Math.ceil((ZMAX - ZMIN) / FINE), FN = FW * FH;
const MW = Math.floor((XMAX - XMIN) / CELL) + 1, MH = Math.floor((ZMAX - ZMIN) / CELL) + 1;

const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
log(`fine ${FW}x${FH}, mesh ${MW}x${MH}, ${((XMAX - XMIN) / 1000).toFixed(1)} x ${((ZMAX - ZMIN) / 1000).toFixed(1)} km`);

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function hash2(i, j, s = 0) {
  let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, z, scale, seed) {
  const u = x / scale, v = z / scale, i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
  const sa = a * a * (3 - 2 * a), sb = b * b * (3 - 2 * b);
  return mix(mix(hash2(i, j, seed), hash2(i + 1, j, seed), sa), mix(hash2(i, j + 1, seed), hash2(i + 1, j + 1, seed), sa), sb);
}
const fbm = (x, z, s, seed) => 0.55 * vnoise(x, z, s, seed) + 0.3 * vnoise(x, z, s / 2.3, seed + 7) + 0.15 * vnoise(x, z, s / 5.1, seed + 13);

// ---------------------------------------------------------------- elevation

const TZ = 14, TX0 = 5132, TY0 = 5882, NTX = 9, NTY = 8;
const DW = NTX * 256, DH = NTY * 256, dem = new Float32Array(DW * DH);
for (let ty = 0; ty < NTY; ty++) for (let tx = 0; tx < NTX; tx++) {
  const png = PNG.sync.read(fs.readFileSync(path.join(ROOT, 'data/raw/terrarium', `${TZ}_${TX0 + tx}_${TY0 + ty}.png`)));
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const p = (y * 256 + x) * 4;
    dem[(ty * 256 + y) * DW + tx * 256 + x] = png.data[p] * 256 + png.data[p + 1] + png.data[p + 2] / 256 - 32768;
  }
}
function demAt(lat, lon) {
  const n = 256 * 2 ** TZ, r = (lat * Math.PI) / 180;
  const px = ((lon + 180) / 360) * n - TX0 * 256 - 0.5;
  const py = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n - TY0 * 256 - 0.5;
  const x = clamp(px, 0, DW - 1.001), y = clamp(py, 0, DH - 1.001);
  const i = Math.floor(x), j = Math.floor(y), a = x - i, b = y - j, k = j * DW + i;
  return mix(mix(dem[k], dem[k + 1], a), mix(dem[k + DW], dem[k + DW + 1], a), b);
}
const cx = (i) => XMIN + (i + 0.5) * FINE, cz = (j) => ZMIN + (j + 0.5) * FINE;
const demF = new Float32Array(FN);
for (let j = 0; j < FH; j++) {
  const lat = ORIGIN.lat - cz(j) / M_LAT;
  for (let i = 0; i < FW; i++) demF[j * FW + i] = demAt(lat, ORIGIN.lon + cx(i) / M_LON);
}
log('elevation sampled');

// ---------------------------------------------------------------- land and water from the OSM coastline

const osm = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/raw/osm.json'), 'utf8')).elements;
const toLocal = (g) => g.map((p) => [toX(p.lon), toZ(p.lat)]);
const fu = (x) => (x - XMIN) / FINE, fv = (z) => (z - ZMIN) / FINE;

// Coastline ways are walls on the fine grid; the walls split it into pieces, and each piece is voted land or
// sea by looking just left (land) and right (water) of every coastline segment, which is how OSM draws them.
const wall = new Uint8Array(FN);
function drawLine(x0, z0, x1, z1) {
  const u0 = fu(x0), v0 = fv(z0), u1 = fu(x1), v1 = fv(z1);
  const n = Math.ceil(Math.hypot(u1 - u0, v1 - v0) * 3) + 1;
  let pi = -1, pj = -1;
  for (let s = 0; s <= n; s++) {
    const t = s / n, i = Math.floor(mix(u0, u1, t)), j = Math.floor(mix(v0, v1, t));
    if (i === pi && j === pj) continue;
    if (pi >= 0 && i !== pi && j !== pj && pi < FW && j >= 0 && j < FH) wall[j * FW + pi] = 1; // keep it 4-connected
    if (i >= 0 && i < FW && j >= 0 && j < FH) wall[j * FW + i] = 1;
    pi = i; pj = j;
  }
}
const coast = osm.filter((e) => e.type === 'way' && (e.tags?.natural === 'coastline' || /island|islet/.test(e.tags?.place || '')) && e.geometry)
  .map((e) => ({ pts: toLocal(e.geometry), name: e.tags?.name || '' }));
for (const c of coast) for (let k = 1; k < c.pts.length; k++) drawLine(...c.pts[k - 1], ...c.pts[k]);

const comp = new Int32Array(FN).fill(-1);
let ncomp = 0;
{
  const q = new Int32Array(FN);
  for (let s = 0; s < FN; s++) {
    if (wall[s] || comp[s] >= 0) continue;
    let h = 0, t = 0;
    q[t++] = s; comp[s] = ncomp;
    while (h < t) {
      const c = q[h++], i = c % FW, j = (c - i) / FW;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= FW || b >= FH) continue;
        const k = b * FW + a;
        if (!wall[k] && comp[k] < 0) { comp[k] = ncomp; q[t++] = k; }
      }
    }
    ncomp++;
  }
}
const votes = new Float32Array(ncomp);
const inGrid = (x, z) => x >= XMIN && x < XMAX && z >= ZMIN && z < ZMAX;
const compAt = (x, z) => (inGrid(x, z) ? comp[Math.floor(fv(z)) * FW + Math.floor(fu(x))] : -1);
for (const c of coast) for (let k = 1; k < c.pts.length; k++) {
  const [x0, z0] = c.pts[k - 1], [x1, z1] = c.pts[k];
  const L = Math.hypot(x1 - x0, z1 - z0);
  if (L < 1) continue;
  // left of the direction of travel, in a north = -z frame, is (dz, -dx) rotated: land on the left
  const nx = (z1 - z0) / L, nz = -(x1 - x0) / L;
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  for (const d of [8, 14]) {
    const land = compAt(mx + nx * d, mz + nz * d), sea = compAt(mx - nx * d, mz - nz * d);
    if (land >= 0) votes[land] += L;
    if (sea >= 0) votes[sea] -= L;
  }
}
const sea = new Uint8Array(FN);
for (let k = 0; k < FN; k++) {
  if (wall[k]) continue;
  sea[k] = votes[comp[k]] < 0 ? 1 : 0;
}
// wall cells take a neighbour's side
for (let k = 0; k < FN; k++) if (wall[k]) {
  const i = k % FW, j = (k - i) / FW;
  let s = 0, n = 0;
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const a = i + di, b = j + dj;
    if (a < 0 || b < 0 || a >= FW || b >= FH || wall[b * FW + a]) continue;
    s += sea[b * FW + a]; n++;
  }
  sea[k] = n && s / n >= 0.5 ? 1 : 0;
}
log(`${ncomp} pieces; sea ${(sea.reduce((a, b) => a + b, 0) / FN * 100).toFixed(0)}%`);

// ---------------------------------------------------------------- distance to the shore

function edt(isFeature) { // squared distance in cells (Felzenszwalb), 2D
  const INF = 1e20, f = new Float64Array(Math.max(FW, FH)), d = new Float64Array(Math.max(FW, FH));
  const v = new Int32Array(Math.max(FW, FH)), zz = new Float64Array(Math.max(FW, FH) + 1);
  const out = new Float64Array(FN);
  for (let k = 0; k < FN; k++) out[k] = isFeature(k) ? 0 : INF;
  const pass = (n, get, set) => {
    for (let q = 0; q < n; q++) f[q] = get(q);
    let k = 0; v[0] = 0; zz[0] = -INF; zz[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= zz[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; zz[k] = s; zz[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (zz[k + 1] < q) k++; d[q] = (q - v[k]) ** 2 + f[v[k]]; }
    for (let q = 0; q < n; q++) set(q, d[q]);
  };
  for (let i = 0; i < FW; i++) pass(FH, (q) => out[q * FW + i], (q, val) => { out[q * FW + i] = val; });
  for (let j = 0; j < FH; j++) pass(FW, (q) => out[j * FW + q], (q, val) => { out[j * FW + q] = val; });
  return out;
}
const toLand = edt((k) => !sea[k]); // sea -> nearest land
const toSea = edt((k) => sea[k]);   // land -> nearest sea
log('distances');

// ---------------------------------------------------------------- height

// The island stands on the DEM where the DEM is good (a fine survey patch covers it). The river bed is made up:
// flats that the low tide uncovers, then a channel. Land never dips below the high-water line.
const heightF = new Float32Array(FN);
for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++) {
  const k = j * FW + i, x = cx(i), z = cz(j);
  if (sea[k]) {
    const d = Math.sqrt(toLand[k]) * FINE;
    const n = (fbm(x, z, 160, 3) - 0.5) * 2.2;
    // flats out to about 80 m, then down to the channel
    const depth = 0.4 + Math.min(d, 90) * 0.068 + Math.max(0, d - 90) * 0.035 + n;
    heightF[k] = Math.max(HW - depth, -16);
  } else {
    const d = Math.sqrt(toSea[k]) * FINE;
    const g = demF[k];
    // a bank: from just above high water at the shore, rising at least this fast
    const floor = HW + 0.4 + Math.min(d, 40) * 0.12;
    heightF[k] = Math.max(g, mix(floor, Math.min(g, floor), smooth(20, 60, d)), HW + 0.4);
  }
}
// Smooth the band along the shore, where the 5 m land/sea mask leaves stair-steps.
{
  const near = new Uint8Array(FN);
  for (let k = 0; k < FN; k++) near[k] = Math.sqrt(sea[k] ? toLand[k] : toSea[k]) * FINE < 45 ? 1 : 0;
  const tmp = new Float32Array(FN);
  for (let pass = 0; pass < 3; pass++) {
    tmp.set(heightF);
    for (let j = 2; j < FH - 2; j++) for (let i = 2; i < FW - 2; i++) {
      const k = j * FW + i;
      if (!near[k]) continue;
      let s = 0;
      for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) s += tmp[k + dj * FW + di];
      heightF[k] = s / 25;
    }
  }
}
// H, "un petit islet" on Champlain's map: Little Dochet Island, south of the island. OSM has only its name (a
// point), so it is raised here where the elevation tiles show it.
for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++) {
  const k = j * FW + i, x = cx(i), z = cz(j);
  const dochet = Math.hypot((x - 47) / 24, (z - 1610) / 17);
  if (dochet < 1.8) heightF[k] = Math.max(heightF[k], mix(HW + 0.6 + 5 * (1 - dochet * dochet), HW - 2.5, smooth(0.85, 1.8, dochet)));
}

const sampleRiver = (x, z) => {
  const u = clamp(fu(x) - 0.5, 0, FW - 1.001), v = clamp(fv(z) - 0.5, 0, FH - 1.001);
  const i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, k = j * FW + i;
  return mix(mix(heightF[k], heightF[k + 1], a), mix(heightF[k + FW], heightF[k + FW + 1], a), b);
};

// ---------------------------------------------------------------- St. Croix Island, at 1 m

// The island is shaped from two outlines, checked against Champlain's 1613 map and photos of the island at three
// tides (see docs/SOURCES.md):
//  - data/island-trace.png: the shore at mid tide, traced from air photos (Esri World Imagery, 2026-11-18), 1 m a
//    pixel, white = land. It has the island, the sand spit at the south end and the two little islets.
//  - OSM's coastline for the island, which is drawn at about LOW water: it takes in the rock aprons and the rock
//    ledge to the south-east, which can be walked to only at low tide.
// The water in the game rises and falls about 2.2 m either side of mean sea level. So: ground on the traced shore
// is 0; the island rises from a narrow beach to about 13 m; the spit's crest is +1.5 (under water at high tide,
// as the islets are then cut off); the ledge tops out under high water; the low-water line is at -1.9.
// (The traced shore is taken as mid tide, 0 m: the photos show the spit dry and the islets apart.)
const TR = PNG.sync.read(fs.readFileSync(path.join(ROOT, 'data/island-trace.png')));
const TRACE = { x0: -160, z0: -250 }; // the trace's top-left corner in local metres
const G = { x0: -260, z0: -400, w: 560, h: 700 }; // the island grid, 1 m cells
const GN = G.w * G.h;
const islandRing = coast.find((c) => c.name === 'Saint Croix Island').pts;
function edtGrid(W, H, isFeature) { // distance (m) on a 1 m grid to the nearest feature cell
  const INF = 1e20, n = Math.max(W, H), f = new Float64Array(n), d = new Float64Array(n);
  const v = new Int32Array(n), zz = new Float64Array(n + 1), out = new Float64Array(W * H);
  for (let k = 0; k < W * H; k++) out[k] = isFeature(k) ? 0 : INF;
  const pass = (len, get, set) => {
    for (let q = 0; q < len; q++) f[q] = get(q);
    let k = 0; v[0] = 0; zz[0] = -INF; zz[1] = INF;
    for (let q = 1; q < len; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= zz[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; zz[k] = s; zz[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) { while (zz[k + 1] < q) k++; d[q] = (q - v[k]) ** 2 + f[v[k]]; }
    for (let q = 0; q < len; q++) set(q, d[q]);
  };
  for (let i = 0; i < W; i++) pass(H, (q) => out[q * W + i], (q, val) => { out[q * W + i] = val; });
  for (let j = 0; j < H; j++) pass(W, (q) => out[j * W + q], (q, val) => { out[j * W + q] = val; });
  for (let k = 0; k < W * H; k++) out[k] = Math.sqrt(out[k]);
  return out;
}
const gx = (i) => G.x0 + i + 0.5, gz = (j) => G.z0 + j + 0.5;
const traced = new Uint8Array(GN), lowLand = new Uint8Array(GN);
for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) {
  const k = j * G.w + i, x = gx(i), z = gz(j);
  const ti = Math.floor(x - TRACE.x0), tj = Math.floor(z - TRACE.z0);
  traced[k] = ti >= 0 && tj >= 0 && ti < TR.width && tj < TR.height && TR.data[(tj * TR.width + ti) * 4] > 127 ? 1 : 0;
  lowLand[k] = traced[k] || pointInRing(x, z, islandRing) ? 1 : 0;
}
const inland = edtGrid(G.w, G.h, (k) => !traced[k]);  // on land: metres from the mid-tide shore
const offshore = edtGrid(G.w, G.h, (k) => traced[k]); // off it: metres to the mid-tide shore
const toLow = edtGrid(G.w, G.h, (k) => !lowLand[k]);  // inside the low-water line: metres to it
const pastLow = edtGrid(G.w, G.h, (k) => lowLand[k]); // outside it: metres back to it
log('island distances');

// The parts of the traced land. South of the line through (-30, 46) and (48, -4) is the spit; past z 88 the islets.
const cut = (x, z) => ((z - 46) + (x + 30) * (50 / 78)) / Math.hypot(1, 50 / 78); // > 0: south-east of the line
function part(x, z) {
  if (z > 86 && x < 12) return 'sw';    // the islet the spit runs to: rock, a little sand, low
  if (z > 86) return 'se';              // the islet to the south-east: higher, rock
  if (x > -36 && cut(x, z) + (fbm(x, z, 8, 41) - 0.5) * 9 > 0) return 'spit';
  return 'main';
}
// how high the island stands above its beach, north to south (the elevation tiles: about 13 m in the middle)
const RISE = [[-240, 1], [-205, 4], [-175, 8], [-140, 10.5], [-60, 11], [0, 9], [30, 6], [55, 3]];
const riseAt = (z) => {
  if (z <= RISE[0][0]) return RISE[0][1];
  for (let k = 1; k < RISE.length; k++) if (z <= RISE[k][0]) return mix(RISE[k - 1][1], RISE[k][1], (z - RISE[k - 1][0]) / (RISE[k][0] - RISE[k - 1][0]));
  return RISE[RISE.length - 1][1];
};
// KIND: what the ground is made of where height alone can't say (0 = by height, 1 = sand, 2 = rock)
const islandH = new Float32Array(GN), islandKind = new Uint8Array(GN), islandW = new Float32Array(GN);
for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) {
  const k = j * G.w + i, x = gx(i), z = gz(j);
  const rough = fbm(x, z, 9, 21) - 0.5;
  let h, kind = 0, w = 1;
  if (traced[k]) {
    const d = inland[k], p = part(x, z);
    if (p === 'main') {
      // a beach of stones and weed about 6 m wide, then the bank and the top
      h = Math.min(d, 7) * 0.4 + riseAt(z) * (1 - Math.exp(-Math.max(0, d - 7) / 9)) + (fbm(x, z, 30, 9) - 0.5) * 1.2 * smooth(6, 20, d);
      if (d < 7 && rough > 0.1) kind = 2;
    } else if (p === 'spit') {
      // the crest climbs from +1.5 on the stem to beach height where it meets the island
      const crest = mix(1.5, 3.4, 1 - smooth(4, 24, cut(x, z)));
      h = crest * smooth(2, 9, d) - 0.4 * (1 - smooth(0, 3, d)) + rough * 0.15; // the trace is a little fat here
      kind = 1;
    } else {
      const top = p === 'sw' ? 4.2 : 5.2;
      h = top * (1 - Math.exp(-d / 4)) + rough * 1.4 + (fbm(x, z, 3, 51) - 0.5) * 0.8;
      if (d < 3 || rough > 0.15) kind = 2;
    }
  } else if (lowLand[k]) {
    // between the mid-tide shore and the low-water line: rock, weed and gravel
    const t = offshore[k] / (offshore[k] + toLow[k]);
    const nearSpit = part(x, z) === 'spit' || (z > 50 && z < 95 && x > -30 && x < 30); // sand slopes are smooth
    h = mix(nearSpit ? -0.4 : 0, -1.9, Math.pow(t, 0.8)) + rough * (nearSpit ? 0.1 : 0.5);
    if (rough > 0.02) kind = 2;
    // the rock ledge south-east of the island: bare rock above half tide, under water at high tide
    if (x > 82 && z > 30 && z < 125) {
      const ledge = -1.2 + 3.1 * smooth(0, 7, toLow[k]) * (0.8 + 0.4 * fbm(x, z, 12, 33)) + (fbm(x, z, 2.5, 35) - 0.5) * 0.8;
      if (ledge > h) { h = ledge; kind = 2; }
    }
  } else {
    // off the low-water line the bed drops to the channel, then joins the river's own made-up bed
    h = -2.3 - pastLow[k] * 0.06 + rough * 0.6;
    w = 1 - smooth(60, 120, pastLow[k]);
  }
  islandH[k] = h; islandKind[k] = kind; islandW[k] = w;
}
const inG = (x, z) => x >= G.x0 + 1 && x < G.x0 + G.w - 1 && z >= G.z0 + 1 && z < G.z0 + G.h - 1;
function sampleIsland(arr, x, z) {
  const u = x - G.x0 - 0.5, v = z - G.z0 - 0.5, i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, k = j * G.w + i;
  return mix(mix(arr[k], arr[k + 1], a), mix(arr[k + G.w], arr[k + G.w + 1], a), b);
}
const sampleH = (x, z) => {
  const r = sampleRiver(x, z);
  if (!inG(x, z)) return r;
  return mix(r, sampleIsland(islandH, x, z), sampleIsland(islandW, x, z));
};
const kindAt = (x, z) => (inG(x, z) ? islandKind[Math.floor(z - G.z0) * G.w + Math.floor(x - G.x0)] : 0);
log('island shaped');
const seaAt = (x, z) => (inGrid(x, z) ? sea[Math.floor(fv(z)) * FW + Math.floor(fu(x))] : 1);

const height = new Float32Array(MW * MH);
for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) height[j * MW + i] = sampleH(XMIN + i * CELL, ZMIN + j * CELL);

// the inset: finer, around the island (its own roughness is in the island section)
const IX0 = -INSET_HALF[0], IZ0 = -INSET_HALF[1];
const IW = Math.round((2 * INSET_HALF[0]) / INSET_CELL) + 1, IH = Math.round((2 * INSET_HALF[1]) / INSET_CELL) + 1;
const inset = new Float32Array(IW * IH), insetKind = new Uint8Array(IW * IH);
for (let j = 0; j < IH; j++) for (let i = 0; i < IW; i++) {
  const x = IX0 + i * INSET_CELL, z = IZ0 + j * INSET_CELL;
  inset[j * IW + i] = sampleH(x, z);
  insetKind[j * IW + i] = kindAt(x, z);
}
log(`inset ${IW}x${IH}`);

// ---------------------------------------------------------------- trees

// The mainland is forest. The island was cleared by the French, so it gets none (the stage adds what it needs).
// kind 0 = spruce/fir, 1 = birch/maple (they turn and drop their leaves), 2 = white pine.
const island = coast.find((c) => c.name === 'Saint Croix Island');
const trees = [];
const SP = 26;
for (let z = ZMIN + SP / 2; z < ZMAX; z += SP) for (let x = XMIN + SP / 2; x < XMAX; x += SP) {
  const i = Math.floor(x / SP), j = Math.floor(z / SP);
  const tx = x + (hash2(i, j, 1) - 0.5) * SP * 0.9, tz = z + (hash2(i, j, 2) - 0.5) * SP * 0.9;
  if (seaAt(tx, tz)) continue;
  const k = Math.floor(fv(tz)) * FW + Math.floor(fu(tx));
  const dSea = Math.sqrt(toSea[k]) * FINE;
  if (dSea < 10) continue;
  if (Math.abs(tx) < 260 && Math.abs(tz) < 330 && dSea < 260) { // the island itself
    const onIsland = pointInRing(tx, tz, island.pts);
    if (onIsland) continue;
  }
  const dens = fbm(tx, tz, 300, 5);
  if (dens < 0.33 || hash2(i, j, 3) > 0.35 + dens) continue;
  const mixv = fbm(tx, tz, 220, 11);
  const kind = mixv > 0.6 ? 1 : hash2(i, j, 4) < 0.08 ? 2 : mixv > 0.5 && hash2(i, j, 5) < 0.5 ? 1 : 0;
  trees.push(tx, tz, kind, 0.75 + hash2(i, j, 6) * 0.6);
}
function pointInRing(x, z, r) {
  let inside = false;
  for (let a = 0, b = r.length - 1; a < r.length; b = a++) {
    const [xa, za] = r[a], [xb, zb] = r[b];
    if ((za > z) !== (zb > z) && x < ((xb - xa) * (z - za)) / (zb - za) + xa) inside = !inside;
  }
  return inside;
}
log(`${trees.length / 4} trees`);

// ---------------------------------------------------------------- write

const places = osm.filter((e) => e.type === 'node' && e.tags?.place && e.tags?.name).map((e) => ({ name: e.tags.name, at: [toX(e.lon), toZ(e.lat)] }));
const meta = {
  source: 'AWS Terrain Tiles z14; OpenStreetMap contributors (ODbL), coastline and names, 2026-11-18',
  origin: ORIGIN, bbox: BBOX, HW,
  main: { x0: XMIN, z0: ZMIN, cell: CELL, w: MW, h: MH },
  inset: { x0: IX0, z0: IZ0, cell: INSET_CELL, w: IW, h: IH },
  island: island.pts.map(([x, z]) => [+x.toFixed(1), +z.toFixed(1)]),
  places,
  mPerDeg: { lat: M_LAT, lon: M_LON },
};
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta));
fs.writeFileSync(path.join(OUT, 'height.bin'), Buffer.from(height.buffer));
fs.writeFileSync(path.join(OUT, 'inset.bin'), Buffer.from(inset.buffer));
fs.writeFileSync(path.join(OUT, 'inset-kind.bin'), Buffer.from(insetKind.buffer));
fs.writeFileSync(path.join(OUT, 'trees.bin'), Buffer.from(new Float32Array(trees).buffer));

// preview: one pixel per 10 m
{
  const S = 2, W = Math.floor(FW / S), H = Math.floor(FH / S), png = new PNG({ width: W, height: H });
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * S * FW + i * S, h = heightF[k], p = (j * W + i) * 4;
    let c;
    if (h < -HW) c = [40, 70, 130];
    else if (h < HW) c = sea[k] ? [150, 140, 110] : [200, 180, 120];
    else { const t = clamp((h - HW) / 60, 0, 1); c = [mix(90, 200, t), mix(140, 190, t), mix(70, 150, t)]; }
    if (wall[k]) c = [255, 255, 255];
    png.data.set([...c.map(Math.round), 255], p);
  }
  for (let t = 0; t < trees.length; t += 4) {
    const i = Math.floor(fu(trees[t]) / S), j = Math.floor(fv(trees[t + 1]) / S);
    if (i >= 0 && j >= 0 && i < W && j < H) png.data.set([30, 80, 40, 255], (j * W + i) * 4);
  }
  fs.writeFileSync(path.join(ROOT, 'data', 'preview.png'), PNG.sync.write(png));
}
log('done');
