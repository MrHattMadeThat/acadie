// Ground height at local points: node scripts/probe.mjs x,z x,z ...   (or "grid x0 z0 x1 z1 step")
import fs from 'node:fs';
const meta = JSON.parse(fs.readFileSync('public/data/meta.json'));
const main = new Float32Array(fs.readFileSync('public/data/height.bin').buffer.slice(0));
const ins = new Float32Array(fs.readFileSync('public/data/inset.bin').buffer.slice(0));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), mix = (a, b, t) => a + (b - a) * t;
function grid(g, arr, x, z) {
  const u = clamp((x - g.x0) / g.cell, 0, g.w - 1.001), v = clamp((z - g.z0) / g.cell, 0, g.h - 1.001);
  const i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, k = j * g.w + i;
  return mix(mix(arr[k], arr[k + 1], a), mix(arr[k + g.w], arr[k + g.w + 1], a), b);
}
const I = meta.inset;
const h = (x, z) => (x > I.x0 && x < I.x0 + (I.w - 1) * I.cell && z > I.z0 && z < I.z0 + (I.h - 1) * I.cell ? grid(I, ins, x, z) : grid(meta.main, main, x, z));
const a = process.argv.slice(2);
if (a[0] === 'grid') {
  const [x0, z0, x1, z1, st] = a.slice(1).map(Number);
  for (let z = z0; z <= z1; z += st) { let s = `${String(z).padStart(6)} `; for (let x = x0; x <= x1; x += st) { const v = h(x, z); s += v > 12 ? '#' : v > 8 ? '+' : v > 4 ? '-' : v > 2.9 ? ',' : v > -2.9 ? '.' : ' '; } console.log(s); }
  console.log('x from', x0, 'step', st);
} else for (const p of a) { const [x, z] = p.split(',').map(Number); console.log(p, h(x, z).toFixed(2)); }
