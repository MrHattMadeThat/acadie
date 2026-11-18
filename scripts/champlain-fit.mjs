// Fits Champlain's 1613 map of St. Croix Island (the class copy with the A-F / 1-4 grid, 2000 px wide) onto the
// real island, and prints where each of his lettered features lands in local metres. Run: node scripts/champlain-fit.mjs
// His north is the fleur-de-lis on the compass, pointing right; west is up. A similarity transform (turn, scale, shift)
// from two control points: the south end of the island's main body and its north tip, on the island's mid-tide
// outline (data/island-trace.png, traced from air photos). Against that outline his island comes out about 40%
// bigger than his own scale bar; against OSM's low-water outline (the first fit) the two agreed. He may have drawn it
// at low water, rocks and flats included.
// The places in src/scene.js were set from this fit, then nudged to fit the habitation where the island is wide enough.
const C = (re, im) => ({ re, im });
const sub = (a, b) => C(a.re - b.re, a.im - b.im), add = (a, b) => C(a.re + b.re, a.im + b.im);
const mul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
// image (x right, y down) -> local (x east, z south): x = iy, z = -ix, before fitting
const pre = ([ix, iy]) => C(iy, -ix);
const ctrl = [
  [[870, 760], [0, 45]],     // south end of the main body, where the sand spit starts
  [[1290, 400], [-22, -208]], // north tip
];
const p0 = pre(ctrl[0][0]), p1 = pre(ctrl[1][0]), q0 = C(...ctrl[0][1]), q1 = C(...ctrl[1][1]);
const A = div(sub(q1, q0), sub(p1, p0)), B = sub(q0, mul(A, p0));
const toLocal = (ix, iy) => { const q = add(mul(A, pre([ix, iy])), B); return [Math.round(q.re), Math.round(q.im)]; };
const scale = Math.hypot(A.re, A.im), turn = (Math.atan2(A.im, A.re) * 180) / Math.PI;
console.log(`scale ${scale.toFixed(3)} m per px (the map's own toise bar says about 0.64); turn ${turn.toFixed(1)} degrees`);
const F = {
  'A habitation (centre)': [1200, 520], 'B gardens': [1135, 590], 'C cannon islet': [790, 690], 'D cannon platform (north)': [1290, 480],
  'E cemetery': [1100, 555], 'F chapel': [1035, 600], 'G south shoal': [880, 700], 'G east fan': [1390, 600], 'H small islet': [290, 540],
  'I water mill (west shore)': [290, 205], 'L charcoal (west shore)': [690, 140], 'M gardens, west mainland': [730, 200],
  'N gardens, east mainland': [1390, 1030], 'O mountain (east)': [1790, 1040], 'ship at anchor': [470, 830], 'shallop': [1660, 440],
};
for (const [k, v] of Object.entries(F)) console.log(k.padEnd(30), toLocal(...v).join(', '));
