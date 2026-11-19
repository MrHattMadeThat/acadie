// Free roam, brought to life: click a building for its story, or click the people (or their 💬) to watch a little
// scene play out with speech bubbles. A season switch turns the island from summer 1604 to the winter of 1604-05.
// The words and facts are in stories.js; the scene's people come from the same crowd as everyone else (people.js).
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { INFO, SCENES, SOURCES } from './stories.js';

const MONTH = { summer: 1, winter: 7 }; // July 1604, January 1605 (world.js MONTHS)
const SEASON_NAME = { summer: 'Summer 1604', winter: 'Winter 1604–05' };
const FACE = { east: Math.PI / 2, west: -Math.PI / 2, north: Math.PI, south: 0 };
const WALK = 1.3; // m/s
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const sourceLine = (keys) => 'Source: ' + keys.split(/;\s*/).map((k) => SOURCES[k] || k).join('; ');

// ------------------------------------------------------------------ props for the scenes

const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
const WOOD = M('#7a5a3a'), STONE = M('#8d8880'), IRON = M('#2f2c2a', { roughness: 0.6 });
const PROPS = {
  // a hand mill: two round stones on a wooden stand, a peg handle on the top stone
  quern() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.62, 0.9), WOOD, 0, 0.31, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.14, 18), STONE, 0, 0.69, 0));
    const top = new THREE.Group();
    top.position.y = 0.82;
    top.add(mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 18), STONE));
    top.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 6), WOOD, 0.28, 0.2, 0));
    g.add(top);
    g.userData.spin = top;
    return g;
  },
  barrel() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.82, 14), M('#86623e'), 0, 0.41, 0));
    for (const y of [0.15, 0.67]) g.add(mesh(new THREE.TorusGeometry(0.305, 0.02, 4, 18).rotateX(Math.PI / 2), IRON, 0, y, 0));
    return g;
  },
  // a block of frozen cider on a chopping stump
  ciderBlock() {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.5, 10), M('#6e5032'), 0, 0.25, 0));
    g.add(mesh(new THREE.BoxGeometry(0.34, 0.24, 0.3), M('#d9a23e', { roughness: 0.25, transparent: true, opacity: 0.85 }), 0, 0.62, 0));
    return g;
  },
  // a kettle of snow over a small fire, ringed with stones
  kettleFire() {
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; g.add(mesh(new THREE.DodecahedronGeometry(0.12), STONE, Math.cos(a) * 0.45, 0.08, Math.sin(a) * 0.45)); }
    for (let i = 0; i < 3; i++) g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6).rotateZ(Math.PI / 2).rotateY(i * 2.1), WOOD, 0, 0.08, 0));
    const flame = mesh(new THREE.ConeGeometry(0.2, 0.5, 8), new THREE.MeshBasicMaterial({ color: '#ffb347' }), 0, 0.3, 0);
    flame.castShadow = false;
    g.add(flame);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const leg = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.25, 5), WOOD, Math.cos(a) * 0.4, 0.58, Math.sin(a) * 0.4); leg.lookAt(0, 1.6, 0); leg.rotateX(Math.PI / 2); g.add(leg); }
    const pot = mesh(new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), IRON, 0, 0.82, 0);
    pot.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12), M('#f2f5f8'), 0, -0.01, 0)); // snow in the pot
    g.add(pot);
    g.userData.flame = flame;
    return g;
  },
  // pointed stakes for a barricade, half driven in
  stakes() {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Group();
      s.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.5, 6), M('#9a7a52'), 0, 0.75, 0));
      s.add(mesh(new THREE.ConeGeometry(0.07, 0.22, 6), M('#9a7a52'), 0, 1.6, 0));
      s.position.x = (i - 2.5) * 0.36;
      s.rotation.z = (Math.sin(i * 7.1) * 0.05);
      s.scale.y = 0.85 + 0.25 * Math.abs(Math.sin(i * 3.3));
      g.add(s);
    }
    return g;
  },
};

// ------------------------------------------------------------------ explore

export function buildExplore({ story, camera, controls, renderer, setMonth, onFocus }) {
  const X = story.explore;
  const $ = (id) => document.getElementById(id);
  const card = $('explore'), tip = $('explore-tip');
  const seasonBtns = [...document.querySelectorAll('#roam-tools [data-season]')];
  let on = false, season = 'summer', playing = null, glide = null;

  // ---------------------------------------------------------------- the scenes' people, props and markers

  for (const sc of SCENES) {
    const [ax, az] = sc.world ? sc.at : X.plan(...sc.at);
    sc.base = [ax, az];
    sc.group = new THREE.Group();
    sc.group.visible = false;
    X.root.add(sc.group);
    for (const p of sc.props || []) {
      const o = PROPS[p.kind]();
      const x = ax + p.at[0], z = az + p.at[1];
      o.position.set(x, X.ground(x, z), z);
      o.rotation.y = p.rot ?? 0;
      sc.group.add(o);
      if (o.userData.spin) sc.spin = o.userData.spin;
      if (o.userData.flame) sc.flame = o.userData.flame;
    }
    sc.actors = {};
    for (const [id, c] of Object.entries(sc.cast)) {
      const f = { x: ax + c.at[0], z: az + c.at[1], heading: 0, action: c.act, when: (st) => st.roam && st.season === sc.season };
      for (const k of ['hat', 'kind', 'beard', 'tool']) if (c[k] !== undefined) f[k] = c[k];
      const fig = (c.side === 'pk' ? X.peskotomuhkati : X.french)(f);
      fig.scene = sc;
      fig.castId = id;
      sc.actors[id] = fig;
    }
    const b = el('button', 'tag scene-mark');
    b.type = 'button';
    b.append(el('b', null, '💬'), el('span', null, sc.title));
    b.setAttribute('aria-label', `Watch a scene: ${sc.title}`);
    b.onclick = (e) => { e.stopPropagation(); play(sc); };
    sc.mark = new CSS2DObject(b);
    sc.mark.center.set(0.5, 1);
    X.root.add(sc.mark);
    rest(sc);
  }

  function posOf(sc, off) { return [sc.base[0] + off[0], sc.base[1] + off[1]]; }
  function faceTo(sc, f, face) {
    if (face == null) return;
    if (typeof face === 'number') f.heading = face;
    else if (FACE[face] !== undefined) f.heading = FACE[face];
    else { const o = sc.actors[face]; if (o) f.heading = Math.atan2(o.x - f.x, o.z - f.z); }
  }
  // everyone back where the scene starts
  function rest(sc) {
    for (const [id, c] of Object.entries(sc.cast)) {
      const f = sc.actors[id];
      [f.x, f.z] = posOf(sc, c.at);
      f.dest = null;
      f.action = c.act;
      X.crowd.setTool(f, c.tool ?? null);
    }
    for (const [id, c] of Object.entries(sc.cast)) faceTo(sc, sc.actors[id], c.face);
    const xs = Object.values(sc.actors);
    const cx = xs.reduce((s, f) => s + f.x, 0) / xs.length, cz = xs.reduce((s, f) => s + f.z, 0) / xs.length;
    sc.centre = new THREE.Vector3(cx, X.ground(cx, cz), cz);
    sc.mark.position.set(cx, sc.centre.y + 3.3, cz);
  }

  // ---------------------------------------------------------------- speech bubbles

  const bubbles = new Map(); // figure -> CSS2DObject
  function bubble(f, text, name) {
    let b = bubbles.get(f);
    if (!b) {
      const d = el('div', 'bubble');
      b = new CSS2DObject(d);
      b.center.set(0.5, 1);
      X.root.add(b);
      bubbles.set(f, b);
    }
    const d = b.element;
    d.replaceChildren();
    if (name) d.append(el('b', null, name));
    d.append(document.createTextNode(text));
    d.classList.remove('gone');
    b.visible = true;
    return b;
  }
  const hideBubbles = () => bubbles.forEach((b) => { b.visible = false; });

  // ---------------------------------------------------------------- the card (right side)

  function openCard(build) {
    card.replaceChildren();
    const close = el('button', 'explore-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.onclick = closeCard;
    card.append(close);
    build(card);
    card.hidden = false;
  }
  function closeCard() { card.hidden = true; stopScene(); }

  function showInfo(id) {
    const info = INFO[id];
    if (!info) return;
    stopScene();
    openCard((c) => {
      c.append(el('p', 'eyebrow', info.letter ? `On Champlain’s map: ${info.letter}` : SEASON_NAME[season]));
      c.append(el('h2', null, info.title), el('p', null, info.text), el('p', 'explore-source', sourceLine(info.source)));
      const near = SCENES.filter((s) => s.season === season && s.near === id);
      for (const s of near) { const b = el('button', 'paint-button small', `Watch: ${s.title}`); b.type = 'button'; b.onclick = () => play(s); c.append(b); }
    });
  }

  // ---------------------------------------------------------------- playing a scene

  const beatTime = (b) => b.dur ?? Math.min(6.5, Math.max(2.6, 1.4 + b.say.length * 0.058));
  function play(sc) {
    if (sc.season !== season) return;
    stopScene();
    rest(sc);
    playing = { sc, k: -1, t: 0, lines: null };
    openCard((c) => {
      c.append(el('p', 'eyebrow', `${SEASON_NAME[season]} · a scene`), el('h2', null, sc.title));
      playing.lines = el('div', 'explore-lines');
      playing.lines.setAttribute('aria-live', 'polite');
      c.append(playing.lines);
    });
    frame(sc);
    nextBeat();
  }
  function nextBeat() {
    const p = playing;
    p.k++;
    p.t = 0;
    const sc = p.sc, beat = sc.beats[p.k];
    if (!beat) return finish();
    for (const [id, d] of Object.entries(beat.do || {})) {
      const f = sc.actors[id];
      if (d.act) f.action = d.act;
      if (d.tool !== undefined) X.crowd.setTool(f, d.tool);
      if (d.to) { const [x, z] = posOf(sc, d.to); f.dest = [x, z]; f.after = d.face; }
      else faceTo(sc, f, d.face);
    }
    hideBubbles();
    const who = sc.actors[beat.who];
    bubble(who, beat.say, sc.cast[beat.who].name);
    const line = el('p', 'explore-line');
    if (sc.cast[beat.who].name) line.append(el('b', null, sc.cast[beat.who].name + ': '));
    line.append(document.createTextNode(beat.say));
    p.lines.append(line);
  }
  function finish() {
    const sc = playing.sc;
    hideBubbles();
    playing.done = true;
    card.append(el('p', 'explore-note', sc.note), el('p', 'explore-source', sourceLine(sc.source)));
    const again = el('button', 'paint-button small', 'Watch again');
    again.type = 'button';
    again.onclick = () => play(sc);
    card.append(again);
    card.scrollTop = card.scrollHeight;
  }
  function stopScene() {
    if (!playing) return;
    const sc = playing.sc;
    playing = null;
    hideBubbles();
    rest(sc);
  }

  // Each scene has one default view, worked out the first time it plays and kept: in front of its people (the way
  // they face, on average), about 10 m off and 4 m up, from whichever angle sees them with no building, tree or
  // prop in the way. The camera glides there every time the scene plays, wherever the student was looking.
  const viewRay = new THREE.Raycaster();
  let boxes = null;
  const dir = new THREE.Vector3(), eyeTry = new THREE.Vector3();
  function defaultView(sc) {
    if (sc.view) return sc.view;
    const look = sc.centre.clone().add(new THREE.Vector3(0, 1.2, 0));
    const fs = Object.values(sc.actors);
    const fx = fs.reduce((a, f) => a + Math.sin(f.heading), 0), fz = fs.reduce((a, f) => a + Math.cos(f.heading), 0);
    const facing = Math.hypot(fx, fz) > 0.3 ? Math.atan2(fx, fz) : 0;
    const blockers = [...X.targets, ...SCENES.map((o) => o.group)].filter((o) => shown(o));
    // the camera may not stand inside, or just over, a building (boxes grown by 1.5 m, and up to 6 m above the roof)
    boxes ??= X.targets.map((o) => new THREE.Box3().setFromObject(o)).filter((b) => b.getSize(dir).x < 60 && b.getSize(dir).z < 60)
      .map((b) => b.expandByVector(new THREE.Vector3(1.5, 0, 1.5)).expandByVector(new THREE.Vector3(0, 6, 0)));
    let best = null, bestScore = -Infinity;
    for (let k = 0; k < 32; k++) {
      const a = facing + (k / 32) * Math.PI * 2;
      for (const dist of [10, 8, 12.5]) {
        dir.set(Math.sin(a), 0, Math.cos(a));
        eyeTry.copy(look).addScaledVector(dir, dist);
        eyeTry.y = Math.max(look.y + 3.8, X.ground(eyeTry.x, eyeTry.z) + 2.2);
        const span = eyeTry.distanceTo(look);
        viewRay.set(look, dir.copy(eyeTry).sub(look).normalize());
        viewRay.far = span + 1.5;
        const crowded = boxes.some((b) => b.containsPoint(eyeTry));
        const blocked = crowded || viewRay.intersectObjects(blockers, true).some((h) => shown(h.object) && !sc.group.children.some((g) => isIn(h.object, g)));
        // also the ground itself: sample the sight line, it must stay above the hill
        let underground = false;
        for (let s = 0.15; s < 1; s += 0.15) { const px = look.x + (eyeTry.x - look.x) * s, pz = look.z + (eyeTry.z - look.z) * s; if (look.y + (eyeTry.y - look.y) * s < X.ground(px, pz) + 0.3) underground = true; }
        const front = Math.cos(a - facing); // 1 = straight in front of them
        const score = (blocked || underground ? -100 : 0) + front * 6 - Math.abs(dist - 10) * 0.4;
        if (score > bestScore) { bestScore = score; best = { eye: eyeTry.clone(), look: look.clone(), clear: !(blocked || underground) }; }
      }
    }
    return (sc.view = best);
  }
  const isIn = (o, g) => { for (; o; o = o.parent) if (o === g) return true; return false; };
  function frame(sc) {
    const v = defaultView(sc);
    glide = { t: 0, fromEye: camera.position.clone(), fromLook: controls.target.clone(), eye: v.eye.clone(), look: v.look.clone() };
  }

  // ---------------------------------------------------------------- clicking and hovering

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  function hitInfo(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const hit of ray.intersectObjects(X.targets, true)) {
      if (!shown(hit.object)) continue;
      for (let o = hit.object; o; o = o.parent) if (o.userData.info && INFO[o.userData.info]) return o.userData.info;
      return null; // something in front without a story
    }
    return null;
  }
  // the scene people are small, so a click near one (on screen) counts
  const sv = new THREE.Vector3();
  function hitScene(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    let best = null, bestD = 34;
    for (const sc of SCENES) {
      if (sc.season !== season) continue;
      for (const f of Object.values(sc.actors)) {
        if (f.hidden || camera.position.distanceTo(sv.set(f.x, f.lastY ?? 0, f.z)) > 160) continue;
        sv.set(f.x, (f.lastY ?? 0) + 1.1, f.z).project(camera);
        if (sv.z > 1) continue;
        const d = Math.hypot((sv.x * 0.5 + 0.5) * r.width + r.left - ev.clientX, (-sv.y * 0.5 + 0.5) * r.height + r.top - ev.clientY);
        if (d < bestD) { bestD = d; best = sc; }
      }
    }
    return best;
  }

  let downAt = null, lastMove = 0;
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!on || !downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const sc = hitScene(e);
    if (sc) return play(sc);
    const id = hitInfo(e);
    if (id) showInfo(id);
    else if (!playing) card.hidden = true;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!on || e.buttons) { tip.hidden = true; return; }
    const now = performance.now();
    if (now - lastMove < 70) return;
    lastMove = now;
    const sc = hitScene(e);
    const id = sc ? null : hitInfo(e);
    const text = sc ? `💬 ${sc.title}` : id ? INFO[id].title : '';
    canvas.style.cursor = text ? 'pointer' : '';
    tip.hidden = !text;
    if (text) { tip.textContent = text; tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 12}px)`; }
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });
  addEventListener('keydown', (e) => { if (on && e.key === 'Escape' && !card.hidden) closeCard(); });

  // ---------------------------------------------------------------- seasons

  function setSeason(s) {
    stopScene();
    card.hidden = true;
    season = s;
    X.setRoam(true, s);
    setMonth(MONTH[s]);
    for (const sc of SCENES) sc.group.visible = sc.season === s;
    seasonBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.season === s)));
  }
  seasonBtns.forEach((b) => { b.onclick = () => setSeason(b.dataset.season); });

  // ---------------------------------------------------------------- every frame

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  return {
    start() { on = true; setSeason('summer'); },
    stop() {
      on = false;
      stopScene();
      card.hidden = true;
      tip.hidden = true;
      glide = null;
      X.setRoam(false, null);
      for (const sc of SCENES) { sc.group.visible = false; sc.mark.visible = false; }
    },
    get on() { return on; },
    // for checks: each scene's default view, and whether it sees the people clearly
    views: () => SCENES.filter((s) => s.season === season).map((s) => ({ id: s.id, ...defaultView(s) })),
    // for checks in the console: acadie.explore.play('cider'), acadie.explore.season('winter')
    play: (id) => play(SCENES.find((s) => s.id === id)),
    season: (s) => setSeason(s),
    update(dt, t) {
      if (!on) { for (const sc of SCENES) sc.mark.visible = false; return; }
      if (glide) {
        glide.t = Math.min(1, glide.t + dt / 1.1);
        const k = ease(glide.t);
        camera.position.lerpVectors(glide.fromEye, glide.eye, k);
        controls.target.lerpVectors(glide.fromLook, glide.look, k);
        if (glide.t >= 1) { onFocus?.(controls.target); glide = null; }
      }
      for (const sc of SCENES) {
        const near = camera.position.distanceTo(sc.centre) < 420;
        sc.mark.visible = sc.season === season && near && !playing; // no markers while a scene plays
      }
      // the people of every scene in this season: walking where they're sent
      for (const sc of SCENES) {
        if (sc.season !== season) continue;
        for (const f of Object.values(sc.actors)) {
          if (!f.dest) continue;
          const dx = f.dest[0] - f.x, dz = f.dest[1] - f.z, d = Math.hypot(dx, dz);
          if (d < 0.05) { f.dest = null; faceTo(sc, f, f.after); continue; }
          const step = Math.min(d, WALK * dt);
          f.x += (dx / d) * step; f.z += (dz / d) * step;
          f.heading = Math.atan2(dx, dz);
        }
        if (sc.spin && sc.actors.a?.action === 'turn') sc.spin.rotation.y += dt * 3.4;
        if (sc.flame) sc.flame.scale.set(1, 0.8 + 0.3 * Math.abs(Math.sin(t * 9) + Math.sin(t * 13.7)) * 0.5, 1);
      }
      for (const [f, b] of bubbles) b.position.set(f.x, (f.lastY ?? 0) + 2.45 * (f.scale ?? 1), f.z);
      if (playing && !playing.done) {
        playing.t += dt;
        if (playing.t >= beatTime(playing.sc.beats[playing.k])) nextBeat();
      }
    },
  };
}
