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

let meta, mainH, insetH, insetKind;
export async function loadWorldData() {
  const get = async (f) => (await fetch(`data/${f}`)).arrayBuffer();
  meta = await (await fetch('data/meta.json')).json();
  mainH = new Float32Array(await get('height.bin'));
  insetH = new Float32Array(await get('inset.bin'));
  insetKind = new Uint8Array(await get('inset-kind.bin')); // 0 by height, 1 sand, 2 rock (the island's shore)
  const trees = new Float32Array(await get('trees.bin'));
  return { meta, trees };
}
export const HW = () => meta.HW;
export const island = () => meta.island;

function sampleGrid(g, arr, x, z) {
  const u = clamp((x - g.x0) / g.cell, 0, g.w - 1.001), v = clamp((z - g.z0) / g.cell, 0, g.h - 1.001);
  const i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, k = j * g.w + i;
  // Match the diagonal used by gridMesh so props stand on the rendered surface.
  if (a + b <= 1) return arr[k] + a * (arr[k + 1] - arr[k]) + b * (arr[k + g.w] - arr[k]);
  const far = arr[k + g.w + 1];
  return far + (1-a) * (arr[k + g.w] - far) + (1-b) * (arr[k + 1] - far);
}
const inInset = (x, z, pad = 0) => {
  const I = meta.inset;
  return x > I.x0 + pad && x < I.x0 + (I.w - 1) * I.cell - pad && z > I.z0 + pad && z < I.z0 + (I.h - 1) * I.cell - pad;
};
// The highest ground anywhere in a box (never lower than the truth: the surface is flat between grid points).
function gridMax(g, arr, x0, z0, x1, z1) {
  const i0 = clamp(Math.floor((x0 - g.x0) / g.cell), 0, g.w - 1), i1 = clamp(Math.ceil((x1 - g.x0) / g.cell), 0, g.w - 1);
  const j0 = clamp(Math.floor((z0 - g.z0) / g.cell), 0, g.h - 1), j1 = clamp(Math.ceil((z1 - g.z0) / g.cell), 0, g.h - 1);
  let m = -Infinity;
  for (let j = j0; j <= j1; j++) for (let k = j * g.w + i0, e = j * g.w + i1; k <= e; k++) if (arr[k] > m) m = arr[k];
  return m;
}
function heightMaxIn(x0, z0, x1, z1) {
  const I = meta.inset, m = gridMax(meta.main, mainH, x0, z0, x1, z1);
  const over = x1 > I.x0 && x0 < I.x0 + (I.w - 1) * I.cell && z1 > I.z0 && z0 < I.z0 + (I.h - 1) * I.cell;
  return over ? Math.max(m, gridMax(I, insetH, x0, z0, x1, z1)) : m;
}
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
  // the habitation's footpaths (segments, x0 z0 x1 z1) and its trodden square (x, z, radius), set by setPaths
  const MAX_SEGS = 64; // the footpaths and a worn door step at each house
  const groundU = { uSnow: { value: 0 }, uGreen: { value: 1 }, uHW: { value: H },
    uSeg: { value: Array.from({ length: MAX_SEGS }, () => new THREE.Vector4()) }, uSegN: { value: 0 }, uSquare: { value: new THREE.Vector3(0, 0, -1) } };
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
          varying vec3 vWPos; varying vec3 vWNrm; uniform float uSnow, uGreen, uHW; uniform vec4 uSeg[${MAX_SEGS}]; uniform int uSegN; uniform vec3 uSquare;
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
            // Fine meadow mottling, tidal gravel and a trodden central square.
            float grain = gn(vWPos.xz * 2.2);
            diffuseColor.rgb *= 0.86 + 0.24 * n + 0.10 * grain;
            // the meadow in patches: longer, yellower grass, and darker clumps (2026-11-19)
            float meadow = land * step(0.01, diffuseColor.g - diffuseColor.b);
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.14, 1.07, 0.74), smoothstep(0.55, 0.78, gn(vWPos.xz * 0.11 + 7.3)) * meadow * 0.75);
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.8, 0.88, 0.74), smoothstep(0.6, 0.82, gn(vWPos.xz * 0.45 + 3.1)) * meadow * 0.5);
            // the wrack line: dried rockweed left along the top of the last high tide, broken here and there
            float wrack = (1.0 - smoothstep(0.0, 0.3, abs(vWPos.y - uHW - 0.2))) * smoothstep(0.35, 0.6, gn(vWPos.xz * 0.7));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.17, 0.1), wrack * 0.75);
            // the trodden square and the footpaths between the houses (scene.js lays them out)
            float d = length(vWPos.xz - uSquare.xy) - uSquare.z;
            if (abs(vWPos.x + 20.) < 140. && abs(vWPos.z + 90.) < 160.) {
              for (int i = 0; i < ${MAX_SEGS}; i++) {
                if (i >= uSegN) break;
                vec2 a = uSeg[i].xy, b = uSeg[i].zw, pa = vWPos.xz - a, ba = b - a;
                float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.);
                d = min(d, length(pa - ba * h) - .75);
              }
            }
            float worn = 1. - smoothstep(-.4, .9, d + 1.3*(n-.5) + .35*(grain-.5));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.30,.216,.126) * (.76 + .36*n + .18*grain), worn * land);
            float flat_ = smoothstep(0.45, 0.8, vWNrm.y);
            float s = clamp(uSnow * 1.4 - (1.0 - flat_) * 0.9 - n * 0.35, 0.0, 1.0) * land * (1.0 - worn * 0.65); // paths trodden through the snow
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
    sand: new THREE.Color('#c2b08a'), wetSand: new THREE.Color('#9c8c6c'), shoreRock: new THREE.Color('#7a6e5e'),
  };
  const c = new THREE.Color();
  function colourAt(x, z, h, slope, shade, kind = 0) {
    if (kind === 1 && h > -H) c.copy(C.wetSand).lerp(C.sand, smooth(0.2, 2.4, h)); // the spit and its beaches
    else if (kind === 2 && h > -H && h < H + 1.5) c.copy(C.shoreRock).lerp(C.weed, (1 - smooth(-1, 1.6, h)) * 0.7); // rock, weedy low down
    else if (h < -H) c.copy(C.bed);
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

  function gridMesh(g, arr, keep, offset, shadeAt, kinds) {
    const pos = new Float32Array(g.w * g.h * 3), col = new Float32Array(g.w * g.h * 3);
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
      const k = j * g.w + i, x = g.x0 + i * g.cell, z = g.z0 + j * g.cell, h = arr[k];
      pos.set([x, h, z], k * 3);
      const hx = arr[k + (i < g.w - 1 ? 1 : 0)] - arr[k - (i > 0 ? 1 : 0)], hz = arr[k + (j < g.h - 1 ? g.w : 0)] - arr[k - (j > 0 ? g.w : 0)];
      const slope = Math.hypot(hx, hz) / (2 * g.cell);
      colourAt(x, z, h, slope, shadeAt(x, z, k), kinds ? kinds[k] : 0);
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
  world.add(gridMesh(I, insetH, () => true, true, (x, z) => (onIsland(x, z) ? 0.05 : 0.6), insetKind));

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
  // 1604-05. They always float: at high tide they spread over the flooded flats up to the island's shore, and as the
  // water falls each one is held back to water deep enough for its whole footprint, so ice never sits on a beach.
  const AX = new THREE.Vector2(0.38, 0.925).normalize(); // down-river, roughly south-south-east
  const TIDE = H * 0.75;          // the tide's swing either side of mean sea level (tick)
  const DRIFT = 140, SWAY = 12;   // how far the tide carries a floe each way, and its own slow wander (tick)
  const REACH = DRIFT + SWAY;
  const STEP = 2.5;               // a floe's limits are worked out every STEP metres along its drift
  const CELL = 2.5;               // ground sampled on this grid along each floe's strip of river
  const CLEAR = 0.15;             // a floating floe keeps this much water over the highest ground under it
  const PAD = 0.02;               // past the first shallows, each further metre needs this much more tide (no jumps)
  const KEEP_CLEAR = [[215, -75, 18], [30, -110, 12]]; // the ship at anchor and the landing (PLACES in scene.js)
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
  let KMAX = 0; // the floe's widest reach from its centre, as a fraction of r (it spins, so any direction counts)
  for (let i = 0, P = floeGeo.attributes.position; i < P.count; i++) KMAX = Math.max(KMAX, Math.hypot(P.getX(i), P.getZ(i)));

  // A floe's limits: for each point every STEP metres along its drift, the lowest tide at which it may be there. That
  // is the highest ground anywhere under a circle a STEP wider than the floe (so it holds between the points, at
  // any spin) plus CLEAR, and it only grows going out from home (a floe can't pass a bar to reach deeper water
  // beyond). Returns [down-river, up-river] lists, or null if the floe's home dries at low tide.
  const SAMPLES = Math.ceil(REACH / STEP);
  const FREE = new Float32Array(SAMPLES + 1).fill(-Infinity); // open water the whole way
  function floeLimits(x, z, r) {
    const R = KMAX * r + STEP + 0.5;
    // most floes are out in deep water: one look at the box around their whole strip of river settles it
    const L = SAMPLES * STEP + R + CELL, ex = Math.abs(AX.x) * L + Math.abs(AX.y) * R, ez = Math.abs(AX.y) * L + Math.abs(AX.x) * R;
    if (heightMaxIn(x - ex, z - ez, x + ex, z + ez) + CLEAR <= -TIDE
      && KEEP_CLEAR.every(([kx, kz, kr]) => Math.abs(kx - x) > ex + kr || Math.abs(kz - z) > ez + kr)) return [FREE, FREE];
    const nu = Math.ceil((SAMPLES * STEP + R + CELL) / CELL), nv = Math.ceil(R / CELL), rows = 2 * nv + 1;
    const colMax = new Float32Array((2 * nu + 1) * (nv + 1)).fill(NaN); // per column: highest ground within w cells of the axis
    const hs = new Float32Array(rows);
    const col = (c) => {
      const o = c * (nv + 1);
      if (!Number.isNaN(colMax[o])) return o;
      const u = (c - nu) * CELL, cx = x + AX.x * u, cz = z + AX.y * u;
      for (let j = 0; j < rows; j++) { const v = (j - nv) * CELL; hs[j] = heightAt(cx + AX.y * v, cz - AX.x * v); }
      for (let w = 0, m = -Infinity; w <= nv; w++) colMax[o + w] = m = Math.max(m, hs[nv - w], hs[nv + w]);
      return o;
    };
    const need = (s) => {
      const cx = x + AX.x * s, cz = z + AX.y * s;
      for (const [kx, kz, kr] of KEEP_CLEAR) if ((cx - kx) ** 2 + (cz - kz) ** 2 < (kr + R) ** 2) return Infinity;
      let m = -Infinity;
      for (let c = Math.ceil((s - R - CELL / 2) / CELL) + nu, last = Math.floor((s + R + CELL / 2) / CELL) + nu; c <= last; c++) {
        const d = Math.max(0, Math.abs((c - nu) * CELL - s) - CELL / 2);
        const w = Math.min(nv, Math.ceil(Math.sqrt(Math.max(0, R * R - d * d)) / CELL));
        m = Math.max(m, colMax[col(c) + w]);
      }
      return m + CLEAR;
    };
    const home = need(0);
    if (home > -TIDE) return null;
    return [1, -1].map((dir) => {
      const list = [home];
      for (let i = 1; i <= SAMPLES; i++) {
        const prev = list[i - 1];
        list.push(Math.max(need(dir * i * STEP), prev > -TIDE ? prev + PAD * STEP : prev));
        if (list[i] > TIDE) break; // the tide never gets this high: the floe stops before here
      }
      return Float32Array.from(list);
    });
  }
  // how far a floe may be from home along one of its lists at tide T, in metres (smooth as the tide moves)
  function reach(list, T) {
    let a = 0, b = list.length - 1;
    if (list[b] <= T) return b * STEP;
    while (b - a > 1) { const m = (a + b) >> 1; if (list[m] <= T) a = m; else b = m; }
    return (a + (T - list[a]) / (list[b] - list[a])) * STEP;
  }

  const FLOES = low ? 700 : 1600;
  const floes = new THREE.InstancedMesh(floeGeo, new THREE.MeshLambertMaterial({ color: '#e9eef2' }), FLOES);
  const floeData = [];
  for (let k = 0, tries = 0; k < FLOES && tries < 40000; tries++) {
    const along = (hash(tries, 1) - 0.5) * 3000, across = (hash(tries, 2) - 0.5) * 2200;
    const x = AX.x * along + AX.y * across, z = AX.y * along - AX.x * across;
    if (heightAt(x, z) + CLEAR > -TIDE) continue; // home must stay afloat at low tide
    const r = 3 + hash(tries, 3) ** 2 * 16;
    const lim = floeLimits(x, z, r);
    if (!lim) continue;
    floeData.push({ x, z, r, down: lim[0], up: lim[1], a: hash(tries, 4) * 6.28, ph: hash(tries, 5) * 6.28, spin: (hash(tries, 6) - 0.5) * 0.05 });
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
    /** footpaths worn into the ground: segs [[x0, z0, x1, z1], ...], square [x, z, radius] */
    setPaths(segs, square) {
      segs.slice(0, MAX_SEGS).forEach((g, i) => groundU.uSeg.value[i].set(...g));
      groundU.uSegN.value = Math.min(segs.length, MAX_SEGS);
      groundU.uSquare.value.set(...square);
    },
    tide: () => state.tide,
    sun,
    tick(t, dt, camera, tideSpeed = 1) {
      waterU.time.value = t;
      sky.position.copy(camera.position);
      // a tide every 80 seconds or so, scaled by tideSpeed
      state.tidePhase = (state.tidePhase || 0) + dt * tideSpeed * (Math.PI * 2) / 80;
      state.tide = Math.sin(state.tidePhase) * TIDE;
      water.position.y = state.tide;
      if (floes.count) {
        const flow = Math.cos(state.tidePhase); // the current runs hardest at mid-tide
        const T = state.tide, y = T + 0.1; // every floe floats: its limits keep dry ground out from under it
        for (let k = 0; k < floes.count; k++) {
          const f = floeData[k];
          const off = clamp(-Math.sin(state.tidePhase) * DRIFT + Math.sin(t * 0.05 + f.ph) * SWAY, -reach(f.up, T), reach(f.down, T));
          const x = f.x + AX.x * off, z = f.z + AX.y * off;
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
