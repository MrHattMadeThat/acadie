// Quick look at the elevation around a point: node scripts/peek-dem.mjs lat lon [radiusPx] [step]
import fs from 'node:fs';
import { PNG } from 'pngjs';
const [lat, lon, R = 40, step = 2] = process.argv.slice(2).map(Number);
const X0 = 5132, Y0 = 5882, NX = 9, NY = 8, Z = 14;
const W = NX * 256, H = NY * 256, A = new Float32Array(W * H);
for (let x = 0; x < NX; x++) for (let y = 0; y < NY; y++) {
  const p = PNG.sync.read(fs.readFileSync(`data/raw/terrarium/${Z}_${X0 + x}_${Y0 + y}.png`));
  for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4; A[(y * 256 + j) * W + x * 256 + i] = p.data[k] * 256 + p.data[k + 1] + p.data[k + 2] / 256 - 32768; }
}
const n = 256 * 2 ** Z, r = (lat * Math.PI) / 180;
const cx = ((lon + 180) / 360) * n - X0 * 256, cy = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n - Y0 * 256;
console.log('px', cx.toFixed(1), cy.toFixed(1), 'm/px', (40075016 * Math.cos(r) / n).toFixed(2));
let mn = 1e9, mx = -1e9; for (const v of A) { mn = Math.min(mn, v); mx = Math.max(mx, v); } console.log('range', mn, mx);
for (let j = -R; j < R; j += step) {
  let s = '';
  for (let i = -R; i < R; i += step / 2) { const v = A[Math.round(cy + j) * W + Math.round(cx + i)]; s += v > 15 ? '#' : v > 6 ? '+' : v > 1 ? '-' : v > -0.5 ? '.' : v > -5 ? '~' : ' '; }
  console.log(s);
}
