import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { STOPS, CHAPTERS, OPENING } from './content.js';
import { loadWorldData, buildWorld, heightAt } from './world.js';
import { loadManifest, makeModel } from './models.js';
import { buildScene, VIEWS } from './scene.js';
import { buildCalendar } from './calendar.js';
import { buildExplore } from './explore.js';
import { renderTask, clearTask } from './tasks.js';
import '@fontsource-variable/fraunces';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './style.css';

const params = new URLSearchParams(location.search);
const low = params.get('q') === 'low';
const free = params.has('free'); // a teacher can jump to any stop
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);
const V = (a) => new THREE.Vector3(...a);

// ------------------------------------------------------------------ renderer

const host = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: params.has('capture'), logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = !low;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const labels = new CSS2DRenderer();
Object.assign(labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
host.appendChild(labels.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 30000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.rotateSpeed = 0.6;
controls.enabled = false;

// Keep the stop centred in the space between the panels (the question panel on the right, the calendar on the left).
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  const panel = $('panel'), cal = $('calendar');
  const b = document.body.classList;
  const open = !b.contains('roaming') && !b.contains('collapsed') && !b.contains('titled') && !b.contains('intro');
  const wide = innerWidth > 820;
  const right = wide && open ? panel.offsetWidth + 24 : 0;
  const maps = $('maps');
  const left = wide && open ? Math.max(!cal.hidden ? cal.offsetWidth + 16 : 0, !maps.hidden ? maps.offsetWidth + 16 : 0) : 0;
  const below = !wide && open ? Math.round(h * 0.56) : 0; // phones: the panel is a bottom sheet
  renderer.setSize(w, h);
  labels.setSize(w, h);
  const cx = (left + (w - right)) / 2, shift = cx - w / 2;
  const W = w + 2 * Math.abs(shift), H = h + below;
  camera.aspect = W / H;
  if (shift || below) camera.setViewOffset(W, H, W / 2 - cx, below, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ------------------------------------------------------------------ world and story

const data = await loadWorldData();
const world = buildWorld(scene, { trees: data.trees, low });
await loadManifest();
const story = await buildScene(scene, makeModel);
world.setPaths(story.paths.segs, story.paths.square);

const pose = (v) => {
  const eye = V(v.eye), look = V(v.look);
  eye.y = Math.max(eye.y, heightAt(eye.x, eye.z) + 2, 2);
  return { eye, look };
};
const poses = STOPS.map((s) => pose(VIEWS[s.id]));

// The calendar card, for stops that show it. Moving the slider turns the whole river through the year.
const calendar = buildCalendar($('calendar'), (m) => { world.setMonth(m); story.setMonth(m); });
function setMonth(m) { world.setMonth(m); story.setMonth(m); calendar.set(m); }
// free roam's clickable buildings, scenes and seasons
const explore = buildExplore({ story, camera, controls, renderer, setMonth, onFocus: (v) => world.setFocus(v) });

// ------------------------------------------------------------------ progress

const SAVE = 'acadie-v1';
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE)) || null; } catch { return null; }
}
function store() {
  try { localStorage.setItem(SAVE, JSON.stringify(save)); } catch { /* private window: progress lasts this visit only */ }
}
let save = loadSave() || { reached: 0, marks: {} };
const marksFor = (id) => (save.marks[id] ||= []);

function drawChapterIndex() {
  $('chapter-index').replaceChildren(...STOPS.map((stop, i) => {
    const marks = marksFor(stop.id);
    const total = stop.tasks.length;
    const answered = marks.filter(Boolean).length;
    const gold = marks.filter(mark => mark === 'gold').length;
    const tab = document.createElement('button');
    tab.className = 'stop-tab';
    tab.type = 'button';
    tab.textContent = String(i + 1);
    tab.title = `${stop.title} · ${answered}/${total} answered · ${gold} gold`;
    tab.setAttribute('aria-label', `Stop ${i + 1}. ${tab.title}`);
    if (current === i) tab.setAttribute('aria-current', 'step');
    tab.style.setProperty('--answered', `${100 * answered / total}%`);
    tab.style.setProperty('--gold-marks', `${100 * gold / total}%`);
    tab.disabled = !(free || i <= save.reached) || travel != null;
    tab.onclick = () => goTo(i);
    return tab;
  }));
}

function setInitialHeading(heading, title) {
  heading.textContent = title;
  const index = title.charCodeAt(0) - 65;
  if (!(index >= 0 && index < 26)) return;
  const initial = document.createElement('span');
  initial.className = 'initial-tile';
  initial.style.backgroundPosition = `${(index % 7) * 100 / 6}% ${Math.floor(index / 7) * 100 / 3}%`;
  initial.textContent = title[0];
  heading.replaceChildren(initial, title.slice(1));
  heading.setAttribute('aria-label', title);
}

// ------------------------------------------------------------------ the panel

let current = 0, controller = null, arriveAt = null;

function openStop(i) {
  const s = STOPS[i];
  $('place').textContent = s.place;
  $('intro').textContent = s.intro;
  $('caption').hidden = false;
  setInitialHeading($('title'), s.title);
  $('step').textContent = `Stop ${i + 1} of ${STOPS.length}`;
  const got = marksFor(s.id);
  let first = s.tasks.findIndex((_, k) => !got[k]);
  if (arriveAt === 'last') first = s.tasks.length - 1;
  arriveAt = null;
  if (first < 0) showStopDone(i);
  else showTask(i, first);
  drawChapterIndex();
  $('task').scrollTop = 0;
}

// One label above each 3D part a match question links to.
let itemTags = [];
function clearItemTags() {
  itemTags.forEach(({ tag }) => tag.removeFromParent());
  itemTags = [];
}
function addItemTags(task) {
  clearItemTags();
  if (task.type !== 'match') return;
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3(), top = new THREE.Vector3();
  task.items.forEach((item, k) => {
    const obj = item.pick && story.pickable(item.pick);
    if (!obj) return;
    box.setFromObject(obj, true);
    top.set((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2);
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'tag item';
    d.dataset.pick = item.pick;
    d.innerHTML = '<b></b><span></span>';
    d.firstChild.textContent = String(k + 1);
    d.lastChild.textContent = item.label;
    // the name stays readable while the card shows only its number
    d.setAttribute('aria-label', `${k + 1}. ${item.label}`);
    d.title = item.label;
    d.onclick = () => controller?.pick(item.pick);
    const tag = new CSS2DObject(d);
    tag.center.set(0.5, 1.15);
    tag.position.copy(obj.worldToLocal(top.clone()));
    obj.add(tag);
    itemTags.push({ tag, pick: item.pick, el: d });
  });
}
function tagsReact(e) {
  if (e.type === 'select') itemTags.forEach((t) => t.el.classList.toggle('current', t.pick === e.pick));
  if (e.type === 'item-correct') {
    const t = itemTags.find((x) => x.pick === e.pick);
    if (t) { t.el.classList.remove('current'); t.el.classList.add('done'); t.el.lastChild.textContent = e.answer;
      t.el.setAttribute('aria-label', `${t.el.firstChild.textContent}. ${t.el.title}: ${e.answer}`);
      t.el.title += ` · ${e.answer}`;
    }
  }
}
function dropTarget(x, y) {
  const tag = document.elementsFromPoint(x, y).find((e) => e.classList?.contains('item') && e.dataset.pick);
  if (tag) return tag.dataset.pick;
  return pickAt({ clientX: x, clientY: y });
}

function showTask(i, k) {
  const s = STOPS[i];
  $('count').textContent = s.tasks.length > 1 ? `Question ${k + 1} of ${s.tasks.length}` : '';
  story.react({ type: 'task-start', index: k });
  const next = $('next');
  next.hidden = true;
  addItemTags(s.tasks[k]);
  drawNav(i, k);
  $('task').scrollTop = 0;
  controller = renderTask($('task'), s.tasks[k], {
    emit: (e) => { story.react(e); tagsReact(e); },
    dropTarget,
    month: () => calendar.month,
    done: ({ firstTry }) => {
      const got = marksFor(s.id);
      if (!got[k]) got[k] = firstTry ? 'gold' : 'white';
      store();
      drawChapterIndex();
      story.react({ type: 'task-done', index: k });
      controller = null;
      drawNav(i, k);
      const last = k === s.tasks.length - 1;
      next.textContent = last ? (i === STOPS.length - 1 ? 'Finish the chapter' : 'Next stop →') : 'Next question →';
      next.onclick = () => (last ? leave(i) : showTask(i, k + 1));
      next.hidden = false;
      next.focus({ preventScroll: true });
    },
  });
}

function showStopDone(i) {
  clearTask();
  clearItemTags();
  $('count').textContent = '';
  const box = $('task');
  box.replaceChildren();
  const p = document.createElement('p');
  p.className = 'explain';
  p.textContent = 'You have finished this stop.';
  const again = document.createElement('button');
  again.className = 'secondary';
  again.type = 'button';
  again.textContent = 'Try these questions again';
  again.onclick = () => showTask(i, 0);
  box.append(p, again);
  const next = $('next');
  next.hidden = false;
  next.textContent = i === STOPS.length - 1 ? 'Finish the chapter' : 'Next stop →';
  next.onclick = () => leave(i);
  controller = null;
  drawNav(i, -1);
}

function drawNav(i, k) {
  const s = STOPS[i], got = marksFor(s.id), n = s.tasks.length;
  const prev = $('prev'), fwd = $('fwd');
  prev.disabled = k === 0 && i === 0;
  prev.onclick = () => {
    if (k === -1) showTask(i, n - 1);
    else if (k > 0) showTask(i, k - 1);
    else { arriveAt = 'last'; goTo(i - 1); }
  };
  const answered = k === -1 || !!got[k];
  fwd.disabled = !answered || (k === -1 && i === STOPS.length - 1);
  fwd.onclick = () => (k >= 0 && k < n - 1 ? showTask(i, k + 1) : leave(i));
  fwd.title = k >= 0 && k < n - 1 ? 'Next question' : 'Next stop';
  $('qdots').replaceChildren(...s.tasks.map((_, j) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = `qdot ${got[j] || ''}${j === k ? ' here' : ''}`;
    d.setAttribute('aria-label', `Question ${j + 1}${got[j] ? ', answered' : ''}`);
    d.onclick = () => showTask(i, j);
    return d;
  }));
}

function leave(i) {
  if (i === STOPS.length - 1) return finish();
  save.reached = Math.max(save.reached, i + 1);
  store();
  goTo(i + 1);
}

// ------------------------------------------------------------------ travel

let travel = null;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function goTo(i, instant = false) {
  if (travel) return;
  clearTask();
  clearItemTags();
  $('caption').hidden = true;
  $('calendar').hidden = true;
  closeMaps();
  glide = null;
  $('maps-btn').hidden = true;
  const from = { eye: camera.position.clone(), look: controls.target.clone() };
  const to = poses[i];
  const dist = from.eye.distanceTo(to.eye);
  const dur = instant ? 0 : reducedMotion ? 0.6 : Math.min(7, 2.4 + dist / 160);
  travel = { from, to, i, t: 0, dur, dist, monthFrom: world.month, monthTo: STOPS[i].month };
  controls.enabled = false;
  document.body.classList.add('travelling');
  story.setStop(STOPS[i].id, STOPS[i].month);
  drawChapterIndex();
}

const tmpEye = new THREE.Vector3(), tmpLook = new THREE.Vector3();
function stepTravel(dt) {
  const tr = travel;
  tr.t = tr.dur ? Math.min(1, tr.t + dt / tr.dur) : 1;
  const k = ease(tr.t);
  tmpEye.lerpVectors(tr.from.eye, tr.to.eye, k);
  tmpEye.y += Math.sin(Math.PI * k) * Math.min(220, 6 + tr.dist * 0.12); // rise up and glide over
  tmpEye.y = Math.max(tmpEye.y, heightAt(tmpEye.x, tmpEye.z) + 4);
  tmpLook.lerpVectors(tr.from.look, tr.to.look, k);
  camera.position.copy(tmpEye);
  controls.target.copy(tmpLook);
  camera.lookAt(tmpLook);
  // the year turns on the way (whole months only, so the scene doesn't flicker)
  const m = Math.round(THREE.MathUtils.lerp(tr.monthFrom, tr.monthTo, k));
  if (m !== world.month) setMonth(m);
  world.setFocus(tmpLook);
  if (tr.t >= 1) arrive(tr.i);
}

function arrive(i) {
  travel = null;
  current = i;
  const s = STOPS[i];
  $('maps-btn').hidden = s.id === 'acadie';
  setMonth(s.month);
  $('calendar').hidden = !s.calendar;
  document.body.classList.toggle('with-calendar', !!s.calendar);
  resize();
  const { eye, look } = poses[i];
  camera.position.copy(eye);
  controls.target.copy(look);
  const d = eye.distanceTo(look);
  controls.minDistance = d * 0.4;
  controls.maxDistance = d * 1.8;
  // turn all the way round, as many times as you like (2026-11-18, the user: no wall at the sides)
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;
  controls.update();
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = 1.45;
  controls.enabled = true;
  document.body.classList.remove('travelling');
  world.setFocus(look);
  openStop(i);
}

// ------------------------------------------------------------------ clicking things in the scene

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downAt = null;
function pickAt(ev) {
  if (travel) return null;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const objs = story.picks.map((n) => story.pickable(n)).filter((o) => o && o.visible);
  for (const hit of ray.intersectObjects(objs, true)) {
    for (let o = hit.object; o; o = o.parent) if (story.picks.includes(o.name)) return o.name;
  }
  return null;
}
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  const name = pickAt(e);
  if (name && controller && !explore.on) controller.pick(name);
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.buttons) return;
  if (explore.on) return; // free roam sets its own cursor
  renderer.domElement.style.cursor = controller && pickAt(e) ? 'pointer' : '';
});

// ------------------------------------------------------------------ the opening: up the river from the bay

const LINES = OPENING.map((text, k) => ({ text, at: 0.8 + k * 3.6, hold: 3.0 }));
const FLIGHT = reducedMotion ? 2 : 16;
let intro = null;
function startIntro() {
  intro = { t: 0 };
  document.body.classList.add('intro');
  $('skip').hidden = false;
  story.setStop(STOPS[0].id, STOPS[0].month);
  setMonth(STOPS[0].month);
}
function stepIntro(dt) {
  const t = (intro.t += dt);
  const k = ease(Math.min(1, t / FLIGHT));
  const o = VIEWS.opening;
  tmpEye.lerpVectors(V(o.eye), poses[0].eye, k);
  tmpLook.lerpVectors(V(o.look), poses[0].look, Math.min(1, k * 1.3));
  camera.position.copy(tmpEye);
  controls.target.copy(tmpLook);
  camera.lookAt(tmpLook);
  world.setEvening(Math.max(0, 0.7 - t / 6));
  world.setFocus(tmpLook);
  const line = LINES.findLast((l) => t >= l.at);
  const el = $('opening-line');
  if (line) {
    if (el.textContent !== line.text) el.textContent = line.text;
    const fade = (x) => Math.min(1, Math.max(0, x / 0.8));
    el.style.opacity = String(fade(t - line.at) * fade(line.at + line.hold - t));
  }
  if (t >= Math.max(FLIGHT, LINES.at(-1).at + LINES.at(-1).hold) + 0.2) endIntro();
}
function endIntro() {
  intro = null;
  $('opening-line').style.opacity = '0';
  $('skip').hidden = true;
  document.body.classList.remove('intro');
  world.setEvening(0);
  arrive(0);
}

// ------------------------------------------------------------------ title and finish

function start(fresh) {
  if (fresh) { save = { reached: 0, marks: {} }; store(); }
  $('title-screen').hidden = true;
  document.body.classList.remove('titled');
  world.setEvening(0);
  const i = Math.min(save.reached, STOPS.length - 1);
  if (i === 0 && !marksFor(STOPS[0].id).some(Boolean)) startIntro();
  else goTo(i);
}

function finish() {
  clearTask();
  const all = STOPS.flatMap((s) => marksFor(s.id));
  const gold = all.filter((b) => b === 'gold').length;
  const total = STOPS.reduce((n, s) => n + s.tasks.length, 0);
  $('finish-count').textContent = `${all.filter(Boolean).length} of ${total} questions answered. ${gold} right on the first try.`;
  const list = $('finish-review');
  list.replaceChildren();
  STOPS.forEach((s, i) => {
    const whites = marksFor(s.id).filter((b) => b === 'white').length;
    if (!whites) return;
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'linkish';
    b.textContent = s.title;
    b.onclick = () => { $('finish').hidden = true; save.marks[s.id] = []; store(); goTo(i); };
    li.append(b, document.createTextNode(` · ${whites} to try again`));
    list.append(li);
  });
  $('finish-none').hidden = list.children.length > 0;
  $('finish').hidden = false;
}

// ------------------------------------------------------------------ Champlain's maps

// Two maps from Champlain's Voyages (1613), beside the scene. While one is open, its letters show on the 3D island.
const MAPS = {
  map: {
    src: 'maps/champlain-island-1613.webp',
    alt: 'Champlain’s 1613 map of St. Croix Island, with a class grid of columns A to F and rows 1 to 4',
    note: 'Champlain, Les Voyages (1613). North is to the right (the fleur-de-lis on the compass), so west is at the top. ' +
      'His river is drawn much narrower than it really is. P is the Rivière des Etechemins: the French name for the people ' +
      'of this river. Source gallica.bnf.fr / BnF.',
  },
  plan: {
    src: 'maps/champlain-habitation-1613.jpg',
    alt: 'Champlain’s 1613 plan of the habitation on St. Croix Island, with lettered buildings and gardens',
    note: 'Champlain, Les Voyages (1613). His plan of the habitation, drawn here with its top to the west. ' +
      'A is the house of the Sieur de Mons; P is where Champlain lodged. The real buildings were probably plainer.',
  },
};
let mapShown = null;
// While a map is open the camera looks down on the island turned the way Champlain drew it: west at the top. On his
// island map his north is about 27 degrees off true north (scripts/champlain-fit.mjs), so that view turns with it.
const MAP_VIEWS = {
  map: { look: [5, 0, -40], up: [-0.889, -0.459], dist: 400, height: 560 },
  plan: { look: [-23.5, 9, -111.5], up: [-0.974, 0.226], dist: 40, height: 185 }, // the middle of the habitation (plan() in scene.js)
};
let mapReturn = null, glide = null;
function glideTo(eye, look) {
  glide = { t: 0, fromEye: camera.position.clone(), fromLook: controls.target.clone(), eye: eye.clone(), look: look.clone() };
  controls.enabled = false;
}
function stepGlide(dt) {
  glide.t = Math.min(1, glide.t + dt / (reducedMotion ? 0.2 : 1.2));
  const k = ease(glide.t);
  camera.position.lerpVectors(glide.fromEye, glide.eye, k);
  controls.target.lerpVectors(glide.fromLook, glide.look, k);
  camera.lookAt(controls.target);
  if (glide.t >= 1) {
    glide = null;
    controls.enabled = true;
    const d = camera.position.distanceTo(controls.target);
    controls.minDistance = Math.min(controls.minDistance, d * 0.4);
    controls.maxDistance = Math.max(controls.maxDistance, d * 1.8);
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0;
    controls.update();
  }
}
function mapView(which) {
  const v = MAP_VIEWS[which];
  const look = V(v.look);
  return { eye: new THREE.Vector3(look.x - v.up[0] * v.dist, look.y + v.height, look.z - v.up[1] * v.dist), look };
}
function showMap(which) {
  if (travel) return;
  if (!mapShown) mapReturn = { eye: camera.position.clone(), look: controls.target.clone() };
  const view = mapView(which);
  glideTo(view.eye, view.look);
  mapShown = which;
  const m = MAPS[which];
  $('maps-img').src = m.src;
  $('maps-img').alt = m.alt;
  $('maps-note').textContent = m.note;
  document.querySelectorAll('.maps-tabs [data-map]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.map === which)));
  $('maps').hidden = false;
  document.body.classList.add('with-maps');
  $('maps-btn').setAttribute('aria-expanded', 'true');
  story.setLetters(which);
  resize();
}
function closeMaps() {
  if (!mapShown) return;
  mapShown = null;
  if (mapReturn && !travel) glideTo(mapReturn.eye, mapReturn.look);
  mapReturn = null;
  if (travel) glide = null;
  $('maps').hidden = true;
  document.body.classList.remove('with-maps');
  $('maps-btn').setAttribute('aria-expanded', 'false');
  story.setLetters(null);
  resize();
}
$('maps-btn').onclick = () => (mapShown ? closeMaps() : showMap('map'));
$('maps-close').onclick = closeMaps;
document.querySelectorAll('.maps-tabs [data-map]').forEach((b) => { b.onclick = () => showMap(b.dataset.map); });

// Explore the live island without entering a lesson or touching the chapter save.
const roamBack = $('roam-back');
const orbitSurface = renderer.domElement;
$('roam').onclick = () => {
  $('title-screen').hidden = true;
  document.body.classList.replace('titled', 'roaming');
  $('roam-tools').hidden = false;
  const island = STOPS.find(s => s.id === 'island');
  story.setStop(island.id, island.month);
  explore.start(); // summer 1604, and the season switch
  world.setEvening(0);
  const view = pose(VIEWS.island);
  camera.position.copy(view.eye);
  controls.target.copy(view.look);
  controls.enabled = controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.minDistance = 6;
  controls.maxDistance = 1800;
  controls.maxPolarAngle = Math.PI * .47;
  controls.minAzimuthAngle = -Infinity; // no limit on turning round (a stop's limits don't carry over)
  controls.maxAzimuthAngle = Infinity;
  controls.minPolarAngle = 0;
  controls.listenToKeyEvents(orbitSurface);
  orbitSurface.tabIndex = 0;
  orbitSurface.setAttribute('aria-label', 'Explore the island. Arrow keys pan the view.');
  controls.update();
  resize();
  orbitSurface.focus();
};
controls.addEventListener('change', () => {
  if (controls.enablePan) world.setFocus(controls.target);
});
roamBack.onclick = () => {
  explore.stop();
  controls.stopListenToKeyEvents();
  orbitSurface.removeAttribute('tabindex');
  orbitSurface.removeAttribute('aria-label');
  controls.enabled = controls.enablePan = false;
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = true;
  controls.target.copy(tv.look);
  camera.position.copy(tv.eye);
  camera.lookAt(tv.look);
  world.setFocus(tv.look);
  story.setStop('trade', 0);
  setMonth(0);
  world.setEvening(.75);
  $('roam-tools').hidden = true;
  $('title-screen').hidden = false;
  document.body.classList.replace('roaming', 'titled');
  resize();
  $('roam').focus();
};

const chapter = CHAPTERS[0];
setInitialHeading($('chapter-title'), chapter.title);
setInitialHeading($('finish-title'), chapter.title);
$('big-idea').textContent = chapter.question;
$('finish-idea').textContent = chapter.question;
$('start').onclick = () => start(false);
$('restart').onclick = () => start(true);
$('restart').hidden = !loadSave();
$('start').textContent = save.reached > 0 ? 'Carry on' : 'Sail up the river';
$('skip').onclick = () => { if (intro) endIntro(); };
$('again').onclick = () => { $('finish').hidden = true; start(true); };
$('collapse').onclick = () => {
  document.body.classList.toggle('collapsed');
  $('collapse').setAttribute('aria-expanded', String(!document.body.classList.contains('collapsed')));
  resize();
};

// ------------------------------------------------------------------ loop

const clock = new THREE.Clock();
let t = 0;
resize();
const tv = pose(VIEWS.title);
camera.position.copy(tv.eye);
controls.target.copy(tv.look);
camera.lookAt(tv.look);
story.setStop('trade', 0);
setMonth(0);
world.setEvening(0.75);
world.setFocus(tv.look);
drawChapterIndex();
document.body.classList.remove('loading');

const jump = STOPS.findIndex((s) => s.id === params.get('stop'));
if (jump >= 0) { $('title-screen').hidden = true; document.body.classList.remove('titled'); world.setEvening(0); story.setStop(STOPS[jump].id, STOPS[jump].month); arrive(jump); }

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt;
  if (intro) stepIntro(dt);
  else if (travel) stepTravel(dt);
  else if (glide) stepGlide(dt);
  else if (document.body.classList.contains('titled')) {
    camera.position.copy(tv.eye).add(new THREE.Vector3(Math.sin(t * 0.05) * 30, 0, 0));
    camera.lookAt(tv.look);
  } else controls.update();
  // the tide runs faster on the calendar, so the ice can be seen moving
  world.tick(t, dt, camera, STOPS[current]?.calendar && !travel ? 4 : 1);
  explore.update(dt, t);
  story.update(dt, t, world.tide(), camera);
  renderer.render(scene, camera);
  labels.render(scene, camera);
});

// for checks in the browser console
window.acadie = { renderer, scene, explore, goTo, arrive, setMonth, story, world, poses, camera, controls, render: () => renderer.render(scene, camera), get current() { return current; }, get save() { return save; } };
