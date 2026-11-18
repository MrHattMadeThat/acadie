// The west and east shorelines (first ground above high water) along rows of z: node scripts/shores.mjs z1 z2 ...
import fs from 'node:fs';
const meta = JSON.parse(fs.readFileSync('public/data/meta.json'));
const main = new Float32Array(fs.readFileSync('public/data/height.bin').buffer.slice(0));
const g = meta.main, H = meta.HW;
const h = (x, z) => { const i = Math.round((x - g.x0) / g.cell), j = Math.round((z - g.z0) / g.cell); return main[j * g.w + i]; };
for (const z of process.argv.slice(2).map(Number)) {
  let w = null, e = null;
  for (let x = -300; x > -3000; x -= 10) if (h(x, z) > H) { w = x; break; }
  for (let x = 300; x < 3000; x += 10) if (h(x, z) > H) { e = x; break; }
  console.log(`z ${z}: west shore x ${w}, east shore x ${e}`);
}
