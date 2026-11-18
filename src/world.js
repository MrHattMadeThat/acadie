import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The St. Croix River around the island: real ground (scripts/build-terrain.mjs), a tide that rises and falls,
// and the year turning. setMonth(m) runs the seasons, where m counts months from June 1604:
//   0 Jun 1604 · 4 Oct · 6 Dec · 9 Mar 1605 · 12 Jun · 14 Aug 1605
// East is +x, north is -z, metres; the island is at the origin.

export const MONTHS = ['June 1604', 'July 1604', 'August 1604', 'September 1604', 'October 1604', 'November 1604',
  'December 1604', 'January 1605', 'February 1605', 'March 1605', 'April 1605', 'May 1605', 'June 1605', 'July 1605', 'August 1605'];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function hash(i, j) {
  let h = (i * 374761393 + j * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Season curves, one value per month 0..14 (interpolated between).
const CURVE = {
  snow: [0, 0, 0, 0, 0.25, 0.6, 1, 1, 1, 0.95, 0.55, 0, 0, 0, 0],
  ice: [0, 0, 0, 0, 0, 0.15, 0.85, 1, 1, 0.9, 0.3, 0, 0, 0, 0],
  leaves: [1, 1, 1, 0.8, 0.45, 0, 0, 0, 0, 0, 0, 0.5, 1, 1, 1], // how much leaf is on the birches and maples
  autumn: [0, 0, 0, 0.45, 1, 0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0],   // how turned the leaves are
  green: [1, 1, 0.95, 0.7, 0.35, 0.1, 0, 0, 0, 0, 0.15, 0.7, 1, 1, 1], // how green the grass is
  sunElev: [52, 50, 44, 36, 27, 19, 15, 17, 24, 32, 41, 48, 52, 50, 44],
  grey: [0, 0, 0, 0.1, 0.35, 0.6, 0.7, 0.75, 0.7, 0.55, 0.4, 0.1, 0, 0, 0], // winter's flat light
};
export function season(key, m) {
  const c = CURVE[key], i = clamp(Math.floor(m), 0, c.length - 1), j = Math.min(i + 1, c.length - 1);
  return mix(c[i], c[j], clamp(m - i, 0, 1));
}

// ------------------------------------------------------------------ data

let meta, mainH, insetH;
export async function loadWorldData() {
  const get = async (f) => (await fetch(`data/${f}`)).arrayBuffer();
  meta = await (await fetch('data/meta.json')).json();
  mainH = new Float32Array(await get('height.bin'));
  insetH = new Float32Array(await get('inset.bin'));
  const trees = new Float32Array(await get('trees.bin'));
  return { meta, trees };
}
export const HW = () => meta.HW;
export const island = () => meta.island;

function sampleGrid(g, arr, x, z) {
  const u = clamp((x - g.x0) / g.cell, 0, g.w - 1.001), v = clamp((z - g.z0) / g.cell, 0, g.h - 1.001);
  const i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, k = j * g.w + i;
  return mix(mix(arr[k], arr[k + 1], a), mix(arr[k + g.w], arr[k + g.w + 1], a), b);
}
const inInset = (x, z, pad = 0) => {
  const I = meta.inset;
  return x > I.x0 + pad && x < I.x0 + (I.w - 1) * I.cell - pad && z > I.z0 + pad && z < I.z0 + (I.h - 1) * I.cell - pad;
};
// Ground height (m above mean sea level) anywhere on the board.
export function heightAt(x, z) {
  return inInset(x, z) ? sampleGrid(meta.inset, insetH, x, z) : sampleGrid(meta.main, mainH, x, z);
}
export function onIsland(x, z) {
  const r = meta.island;
  let inside = false;
  for (let a = 0, b = r.length - 1; a < r.length; b = a++) {
    const [xa, za] = r[a], [xb, zb] = r[b];
    if ((za > z) !== (zb > z) && x < ((xb - xa) * (z - za)) / (zb - za) + xa) inside = !inside;
  }
  return inside;
}
// Local metres for a latitude and longitude.
export function local(lat, lon) {
  return [(lon - meta.origin.lon) * meta.mPerDeg.lon, -(lat - meta.origin.lat) * meta.mPerDeg.lat];
}

// ------------------------------------------------------------------ build

export function buildWorld(scene, { trees, low = false }) {
  const world = new THREE.Group();
  scene.add(world);
  const H = meta.HW;

  // sky dome
  const skyU = {
    zen: { value: new THREE.Color('#4d88c7') }, hor: { value: new THREE.Color('#cfe2ee') },
    sunDir: { value: new THREE.Vector3(-0.4, 0.7, 0.5) }, sunCol: { value: new THREE.Color('#fff3df') },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(9000, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
      fragmentShader: `uniform vec3 zen, hor, sunDir, sunCol; varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 c = mix(hor, zen, pow(h, 0.55));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          c += sunCol * (pow(s, 900.0) * 3.0 + pow(s, 12.0) * 0.3 + pow(s, 3.0) * 0.1 * (1.0 - h));
          if (d.y < 0.0) c = hor * 0.92;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  world.add(sky);

  const hemi = new THREE.HemisphereLight('#d8ecff', '#4c4a3c', 1.1);
  const sun = new THREE.DirectionalLight('#fff', 2.5);
  sun.castShadow = !low;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 600 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.05;
  world.add(hemi, sun, sun.target);
  scene.fog = new THREE.Fog('#d4e4ec', 900, 9000);

  // ---------------------------------------------------------------- ground

  // Snow lies on flat ground above the high-water line; it comes and goes with uSnow.
  const groundU = { uSnow: { value: 0 }, uGreen: { value: 1 }, uHW: { value: H } };
  function groundMaterial(offset = false) {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95,
      polygonOffset: offset, polygonOffsetFactor: offset ? -1 : 0, polygonOffsetUnits: offset ? -2 : 0 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, groundU);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWNrm;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vWNrm = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vWPos; varying vec3 vWNrm; uniform float uSnow, uGreen, uHW;
          float gh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
            return mix(mix(gh(i), gh(i+vec2(1,0)), f.x), mix(gh(i+vec2(0,1)), gh(i+vec2(1,1)), f.x), f.y); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          {
            float land = smoothstep(uHW + 0.2, uHW + 0.9, vWPos.y);
            // grass browns off in the fall and comes back in the spring
            vec3 dry = diffuseColor.rgb * vec3(1.18, 1.0, 0.72);
            diffuseColor.rgb = mix(mix(dry, diffuseColor.rgb, uGreen), diffuseColor.rgb, 1.0 - land * step(0.01, diffuseColor.g - diffuseColor.b));
            float n = gn(vWPos.xz * 0.35) * 0.6 + gn(vWPos.xz * 0.06) * 0.4;
            float flat_ = smoothstep(0.45, 0.8, vWNrm.y);
            float s = clamp(uSnow * 1.4 - (1.0 - flat_) * 0.9 - n * 0.35, 0.0, 1.0) * land;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.98), s);
          }`);
    };
    return m;
  }

  const forestShade = new Float32Array(meta.main.w * meta.main.h); // tree cover per main cell, for the ground colour
  for (let t = 0; t < trees.length; t += 4) {
    const i = Math.round((trees[t] - meta.main.x0) / meta.main.cell), j = Math.round((trees[t + 1] - meta.main.z0) / meta.main.cell);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const a = i + di, b = j + dj;
      if (a >= 0 && b >= 0 && a < meta.main.w && b < meta.main.h) forestShade[b * meta.main.w + a] += di || dj ? 0.12 : 0.3;
    }
  }

  const C = {
    bed: new THREE.Color('#4a5648'), mud: new THREE.Color('#8a7c63'), weed: new THREE.Color('#6a5d36'),
    gravel: new THREE.Color('#948d7d'), grass: new THREE.Color('#7f9450'), forest: new THREE.Color('#4a5a33'), rock: new THREE.Color('#7d776b'),
  };
  const c = new THREE.Color();
  function colourAt(x, z, h, slope, shade) {
    if (h < -H) c.copy(C.bed);
    else if (h < H - 1.2) c.copy(C.mud).lerp(C.bed, smooth(-H * 0.4, -H, h) * 0.6);
    else if (h < H) c.copy(C.weed);
    else if (h < H + 1.3) c.copy(C.gravel);
    else {
      c.copy(C.grass).lerp(C.forest, clamp(shade, 0, 1));
      c.lerp(C.rock, smooth(0.35, 0.7, slope) * 0.7);
    }
    const n = 0.94 + hash(Math.round(x / 7), Math.round(z / 7)) * 0.12;
    return c.multiplyScalar(n);
  }

  function gridMesh(g, arr, keep, offset, shadeAt) {
    const pos = new Float32Array(g.w * g.h * 3), col = new Float32Array(g.w * g.h * 3);
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
      const k = j * g.w + i, x = g.x0 + i * g.cell, z = g.z0 + j * g.cell, h = arr[k];
      pos.set([x, h, z], k * 3);
      const hx = arr[k + (i < g.w - 1 ? 1 : 0)] - arr[k - (i > 0 ? 1 : 0)], hz = arr[k + (j < g.h - 1 ? g.w : 0)] - arr[k - (j > 0 ? g.w : 0)];
      const slope = Math.hypot(hx, hz) / (2 * g.cell);
      colourAt(x, z, h, slope, shadeAt(x, z, k));
      col.set([c.r, c.g, c.b], k * 3);
    }
    const idx = [];
    for (let j = 0; j < g.h - 1; j++) for (let i = 0; i < g.w - 1; i++) {
      if (!keep(g.x0 + i * g.cell, g.z0 + j * g.cell)) continue;
      const a = j * g.w + i, b = a + 1, d = a + g.w, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, groundMaterial(offset));
    mesh.receiveShadow = true;
    return mesh;
  }
  const M = meta.main, I = meta.inset;
  world.add(gridMesh(M, mainH, (x, z) => !(inInset(x, z, -1) && inInset(x + M.cell, z + M.cell, -1)), false, (x, z, k) => forestShade[k]));
  world.add(gridMesh(I, insetH, () => true, true, (x, z) => (onIsland(x, z) ? 0.05 : 0.6)));

  // ---------------------------------------------------------------- water and the tide

  const waterU = {
    time: { value: 0 }, sunDir: skyU.sunDir, sunCol: skyU.sunCol, hor: skyU.hor, zen: skyU.zen,
    deep: { value: new THREE.Color('#24505c') },
  };
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(40000, 40000, 1, 1).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      transparent: true, fog: true,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...waterU },
      vertexShader: `varying vec3 vW;
        #include <common>
        #include <fog_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        void main(){
          vec4 w = modelMatrix * vec4(position,1.0);
          vW = w.xyz;
          vec4 mvPosition = viewMatrix * w;
          gl_Position = projectionMatrix * mvPosition;
          #include <logdepthbuf_vertex>
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform float time; uniform vec3 sunDir, sunCol, hor, zen, deep; varying vec3 vW;
        #include <fog_pars_fragment>
        #include <logdepthbuf_pars_fragment>
        void main(){
          #include <logdepthbuf_fragment>
          vec2 p = vW.xz * 0.35;
          float amp = 1.0 / (1.0 + distance(cameraPosition.xz, vW.xz) * 0.01);
          vec2 q = mat2(0.8, -0.6, 0.6, 0.8) * p;
          vec3 n = normalize(vec3(
            (sin(p.x*0.9 + time*1.3)*0.05 + sin(q.x*2.7 - q.y*1.3 + time*2.1)*0.03 + sin(q.y*4.3 + p.x*1.7 + time*1.7)*0.02) * amp,
            1.0,
            (sin(q.y*1.1 + time*1.1)*0.05 + sin(p.x*2.3 + q.y*2.9 - time*1.9)*0.03 + sin(q.x*3.7 - time*2.3)*0.02) * amp));
          vec3 v = normalize(cameraPosition - vW);
          float fr = pow(1.0 - max(dot(n, v), 0.0), 4.0);
          vec3 r = reflect(-v, n);
          vec3 skyc = mix(hor, zen, pow(max(r.y,0.0), 0.6));
          vec3 c = mix(deep, skyc, 0.22 + 0.6*fr);
          c += sunCol * pow(max(dot(r, normalize(sunDir)), 0.0), 240.0) * 2.5;
          gl_FragColor = vec4(c, 0.93 + 0.07*fr);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    }),
  );
  water.renderOrder = 1;
  world.add(water);

  // ---------------------------------------------------------------- forest

  // kind 0 spruce/fir, 1 birch/maple (turns, then goes bare), 2 white pine. Instanced, one mesh per part per
  // 1.2 km tile, so tiles off screen are skipped. Low-poly on purpose: there are about 68,000 trees.
  const step = low ? 2 : 1;
  const TILE = 1200;
  const tiles = new Map(); // key -> [[], [], []] tree offsets by kind
  for (let t = 0, n = 0; t < trees.length; t += 4, n++) {
    if (n % step) continue;
    const key = `${Math.floor(trees[t] / TILE)},${Math.floor(trees[t + 1] / TILE)}`;
    if (!tiles.has(key)) tiles.set(key, [[], [], []]);
    tiles.get(key)[trees[t + 2]].push(t);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  function instanced(geo, mat, list, rand = 0) {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, k) => {
      const x = trees[t], z = trees[t + 1], sc = trees[t + 3];
      q.setFromAxisAngle(up, hash(t, 7) * 6.28);
      m4.compose(p.set(x, heightAt(x, z) - 0.3, z), q, s.set(sc * (1 + (hash(t, 3) - 0.5) * rand), sc, sc * (1 + (hash(t, 5) - 0.5) * rand)));
      mesh.setMatrixAt(k, m4);
    });
    mesh.computeBoundingSphere();
    world.add(mesh);
    return mesh;
  }
  const lam = (color) => new THREE.MeshLambertMaterial({ color });
  const spruceGeo = mergeGeometries([
    new THREE.ConeGeometry(2.6, 10, 6, 1, true).translate(0, 5, 0),
    new THREE.ConeGeometry(1.8, 6, 6, 1, true).translate(0, 10, 0),
  ]);
  const spruceMat = lam('#2f4a2c');
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 8, 4, 1, true).translate(0, 4, 0);
  const trunkMat = lam('#7a7268');
  const crownGeo = new THREE.IcosahedronGeometry(3.4, 0).scale(1, 1.15, 1).translate(0, 8.5, 0);
  const crownMat = lam('#ffffff');
  const pineGeo = mergeGeometries([
    new THREE.CylinderGeometry(0.3, 0.45, 15, 4, 1, true).translate(0, 7.5, 0).toNonIndexed(),
    new THREE.IcosahedronGeometry(3.4, 0).scale(1.2, 0.45, 1.2).translate(0.6, 13, 0),
    new THREE.IcosahedronGeometry(2.8, 0).scale(1.2, 0.45, 1.2).translate(-0.8, 16, 0.4),
  ]);
  const pineMat = lam('#3a5134');
  const crowns = []; // [mesh, tones]
  for (const [, [sp, de, pi]] of tiles) {
    if (sp.length) instanced(spruceGeo, spruceMat, sp, 0.2);
    if (de.length) {
      instanced(trunkGeo, trunkMat, de);
      crowns.push([instanced(crownGeo, crownMat, de, 0.3), de.map((t) => hash(t, 11))]);
    }
    if (pi.length) instanced(pineGeo, pineMat, pi);
  }

  const summer = new THREE.Color('#5f7f3a'), bare = new THREE.Color('#7b7068'), frost = new THREE.Color('#c9cbd0');
  const autumnCols = ['#c8502a', '#e0902a', '#d8b43a', '#b8402a', '#9a7a3a'].map((h) => new THREE.Color(h));
  function setLeaves(leaves, autumn, snow) {
    for (const [mesh, tones] of crowns) {
      for (let k = 0; k < tones.length; k++) {
        const r = tones[k];
        c.copy(summer).multiplyScalar(0.85 + r * 0.3);
        c.lerp(autumnCols[Math.floor(r * autumnCols.length)], clamp(autumn * 1.3 - r * 0.3, 0, 1));
        c.lerp(bare, 1 - leaves);
        if (snow > 0 && leaves < 0.2) c.lerp(frost, snow * 0.3);
        mesh.setColorAt(k, c);
      }
      mesh.instanceColor.needsUpdate = true;
    }
    spruceMat.color.set('#2f4a2c').lerp(frost, snow * 0.28);
    pineMat.color.set('#3a5134').lerp(frost, snow * 0.22);
  }

  // ---------------------------------------------------------------- river ice

  // Flat cakes of ice that ride the tide up and down the river, the way they cut the island off in the winter of
  // 1604-05. At low tide the ones over the flats ground on the mud.
  const AX = new THREE.Vector2(0.38, 0.925).normalize(); // down-river, roughly south-south-east
  const floeGeo = (() => {
    const g = new THREE.CylinderGeometry(1, 1, 0.35, 9);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const a = Math.atan2(P.getZ(i), P.getX(i)), r = Math.hypot(P.getX(i), P.getZ(i));
      if (r > 0.01) { const k = 0.75 + 0.35 * Math.sin(a * 3 + 1) * Math.cos(a * 2); P.setX(i, Math.cos(a) * k); P.setZ(i, Math.sin(a) * k); }
    }
    g.computeVertexNormals();
    return g;
  })();
  const FLOES = low ? 700 : 1600;
  const floes = new THREE.InstancedMesh(floeGeo, new THREE.MeshLambertMaterial({ color: '#e9eef2' }), FLOES);
  const floeData = [];
  for (let k = 0, tries = 0; k < FLOES && tries < 40000; tries++) {
    const along = (hash(tries, 1) - 0.5) * 3000, across = (hash(tries, 2) - 0.5) * 2200;
    const x = AX.x * along + AX.y * across, z = AX.y * along - AX.x * across;
    if (heightAt(x, z) > H - 0.6) continue;
    const r = 3 + hash(tries, 3) ** 2 * 16;
    // how far this floe can drift up and down the river before its edge would touch land: it stops there (jammed
    // against the shore or the island) instead of riding over it
    const wet = (o) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dz]) => heightAt(x + AX.x * o + dx, z + AX.y * o + dz) < H - 0.5);
    if (!wet(0)) continue;
    let lo = 0, hi = 0;
    while (hi < 160 && wet(hi + 5)) hi += 5;
    while (lo > -160 && wet(lo - 5)) lo -= 5;
    floeData.push({ x, z, r, lo, hi, a: hash(tries, 4) * 6.28, ph: hash(tries, 5) * 6.28, spin: (hash(tries, 6) - 0.5) * 0.05 });
    k++;
  }
  floes.count = 0;
  floes.receiveShadow = true;
  world.add(floes);

  // ---------------------------------------------------------------- falling snow

  const SNOW = 2500;
  const flakes = new Float32Array(SNOW * 3);
  for (let i = 0; i < SNOW; i++) flakes.set([(hash(i, 1) - 0.5) * 160, hash(i, 2) * 60, (hash(i, 3) - 0.5) * 160], i * 3);
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(flakes, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.35, transparent: true, opacity: 0.85, depthWrite: false }));
  snow.frustumCulled = false;
  snow.visible = false;
  world.add(snow);

  // ---------------------------------------------------------------- the year and the light

  const state = { month: 0, ice: 0, snowing: 0, tide: 0, evening: 0 };
  const focus = new THREE.Vector3();
  const tmp = new THREE.Color(), tmp2 = new THREE.Color();
  const KEYS = {
    summer: { zen: '#4d88c7', hor: '#cfe2ee', sun: '#fff3df', hemi: '#d8ecff', fog: '#cfdde6', deep: '#24505c', sunI: 2.7, hemiI: 1.1 },
    winter: { zen: '#7d8ea3', hor: '#d9dde2', sun: '#f2eee6', hemi: '#dfe6ee', fog: '#d6dbe0', deep: '#3a4c55', sunI: 1.5, hemiI: 1.35 },
    evening: { zen: '#3e4f86', hor: '#f2a463', sun: '#ff9758', hemi: '#d9b8a8', fog: '#d9a888', deep: '#2c3e52', sunI: 1.6, hemiI: 0.8 },
  };
  function key(k, out) {
    const g = season('grey', state.month);
    out.set(KEYS.summer[k]).lerp(tmp2.set(KEYS.winter[k]), g);
    return out.lerp(tmp2.set(KEYS.evening[k]), state.evening);
  }
  function applyLight() {
    const g = season('grey', state.month);
    const elev = THREE.MathUtils.degToRad(mix(season('sunElev', state.month), 6, state.evening));
    // afternoon: the sun in the south-west
    const dir = new THREE.Vector3(-0.55 * Math.cos(elev), Math.sin(elev), 0.83 * Math.cos(elev)).normalize();
    skyU.sunDir.value.copy(dir);
    key('zen', skyU.zen.value); key('hor', skyU.hor.value); key('sun', skyU.sunCol.value);
    sun.color.copy(skyU.sunCol.value);
    sun.intensity = mix(mix(KEYS.summer.sunI, KEYS.winter.sunI, g), KEYS.evening.sunI, state.evening);
    hemi.color.copy(key('hemi', tmp));
    hemi.intensity = mix(mix(KEYS.summer.hemiI, KEYS.winter.hemiI, g), KEYS.evening.hemiI, state.evening);
    scene.fog.color.copy(key('fog', tmp));
    key('deep', waterU.deep.value);
    sun.target.position.copy(focus);
    sun.position.copy(focus).addScaledVector(dir, 300);
  }

  function setMonth(m, { snowing } = {}) {
    state.month = m;
    const sn = season('snow', m);
    groundU.uSnow.value = sn;
    groundU.uGreen.value = season('green', m);
    state.ice = season('ice', m);
    floes.count = Math.round(state.ice * floeData.length);
    state.snowing = snowing ?? (sn > 0.5 && m > 5 && m < 10 ? 1 : 0);
    snow.visible = state.snowing > 0;
    setLeaves(season('leaves', m), season('autumn', m), sn);
    applyLight();
  }

  const fp = new THREE.Vector3();
  return {
    setMonth,
    get month() { return state.month; },
    setEvening(e) { state.evening = e; applyLight(); },
    setFocus(v) { focus.copy(v); applyLight(); },
    tide: () => state.tide,
    sun,
    tick(t, dt, camera, tideSpeed = 1) {
      waterU.time.value = t;
      sky.position.copy(camera.position);
      // a tide every 80 seconds or so, scaled by tideSpeed
      state.tidePhase = (state.tidePhase || 0) + dt * tideSpeed * (Math.PI * 2) / 80;
      state.tide = Math.sin(state.tidePhase) * H * 0.75;
      water.position.y = state.tide;
      if (floes.count) {
        const flow = Math.cos(state.tidePhase); // the current runs hardest at mid-tide
        for (let k = 0; k < floes.count; k++) {
          const f = floeData[k];
          const off = clamp(-Math.sin(state.tidePhase) * 140 + Math.sin(t * 0.05 + f.ph) * 12, f.lo, f.hi);
          const x = f.x + AX.x * off, z = f.z + AX.y * off;
          const ground = heightAt(x, z);
          const y = Math.max(state.tide, ground + 0.12) + 0.1;
          q.setFromAxisAngle(up, f.a + t * f.spin * (0.3 + Math.abs(flow)));
          m4.compose(fp.set(x, y, z), q, s.set(f.r, 1, f.r * 0.8));
          floes.setMatrixAt(k, m4);
        }
        floes.instanceMatrix.needsUpdate = true;
      }
      if (snow.visible) {
        const P = snowGeo.attributes.position;
        for (let i = 0; i < SNOW; i++) {
          let y = P.getY(i) - dt * (1.6 + hash(i, 4) * 1.2);
          if (y < 0) y += 60;
          P.setY(i, y);
          P.setX(i, P.getX(i) + Math.sin(t * 0.7 + i) * dt * 0.4);
        }
        P.needsUpdate = true;
        snow.position.set(camera.position.x, camera.position.y - 30, camera.position.z);
      }
    },
  };
}
