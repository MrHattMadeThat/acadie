// The question panel. One task at a time: renderTask(host, task, hooks) draws it into `host` and returns a
// controller with pick(name), which main.js calls when a 3D part or its scene label is clicked.
//
// hooks.emit(event) tells the stage (and the scene labels) what happened:
//   { type: 'select', pick }                    an item linked to a 3D part is selected (pick may be null)
//   { type: 'item-correct', pick, item, answer } a match item was answered correctly
//   { type: 'option', pick }                    a choice option linked to a 3D part was clicked
// hooks.dropTarget(x, y) returns the 3D part name under a screen point, for answers dragged onto the scene.
// hooks.done({ firstTry }) when the task is solved.
// hooks.month() gives the month the calendar card is on (for `when` tasks).
//
// Every task has the same two parts: .q-body (the question) and .q-foot (feedback and the explanation),
// which sits at the bottom of the panel next to the Next button, so nothing pushes the answers out of view.

import { MAP } from './map-data.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const button = (cls, text) => {
  const b = el('button', cls, text);
  b.type = 'button';
  return b;
};

function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Feedback and explanation live in the foot.
function footer(foot) {
  const say = el('p', 'feedback');
  say.setAttribute('role', 'status');
  foot.append(say);
  return {
    say(text, kind = '') { say.textContent = text; say.className = `feedback ${kind}`; },
    clear() { say.textContent = ''; say.className = 'feedback'; },
    // the win and the why in one box, so a solved question doesn't grow
    solved(headline, text) {
      say.textContent = ''; say.className = 'feedback';
      const box = el('p', 'explain');
      box.append(el('strong', null, headline + ' '), document.createTextNode(text || ''));
      foot.append(box);
    },
  };
}

// Pointer dragging for answer chips. A press that doesn't move is a tap.
// onMove(x, y) while dragging, onDrop(x, y) at the end, onTap() for a tap.
function draggable(chip, label, { onMove, onDrop, onTap }) {
  let start = null, ghost = null;
  chip.style.touchAction = 'none';
  chip.addEventListener('pointerdown', (e) => {
    if (chip.disabled) return;
    start = [e.clientX, e.clientY];
    chip.setPointerCapture(e.pointerId);
  });
  chip.addEventListener('pointermove', (e) => {
    if (!start) return;
    if (!ghost && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 6) {
      ghost = el('div', 'ghost', label);
      document.body.append(ghost);
      chip.classList.add('dragging');
    }
    if (ghost) {
      ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      onMove?.(e.clientX, e.clientY);
    }
  });
  const end = (e, cancelled) => {
    if (!start) return;
    start = null;
    chip.classList.remove('dragging');
    if (ghost) {
      ghost.remove();
      ghost = null;
      if (!cancelled) onDrop(e.clientX, e.clientY);
      else onMove?.(-1, -1);
    } else if (!cancelled) onTap();
  };
  chip.addEventListener('pointerup', (e) => end(e, false));
  chip.addEventListener('pointercancel', (e) => end(e, true));
  // keyboard: Enter/Space is a tap
  chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } });
}

// Some tasks put things outside the panel (the map card). They register a cleanup here.
let cleanup = null;
export function clearTask() {
  cleanup?.();
  cleanup = null;
}

export function renderTask(host, task, hooks) {
  clearTask();
  host.replaceChildren();
  const body = el('div', 'q-body');
  const foot = el('div', 'q-foot');
  if (task.lead) body.append(el('p', 'lead', task.lead)); // a little setup before the question
  body.append(el('p', 'prompt', task.prompt));
  host.append(body, foot);
  const kind = { choice, multi, order, match, answer3, when, mapfind }[task.type];
  return kind(body, footer(foot), task, hooks) || { pick() {} };
}

// ------------------------------------------------------------------ choice

function choice(body, fb, task, hooks) {
  const list = el('div', 'options');
  let wrong = 0, solved = false;
  const buttons = shuffle(task.options).map((o) => {
    const b = button('option', o.text);
    b.dataset.pick = o.pick || '';
    b.onclick = () => {
      if (solved || b.disabled) return;
      if (o.pick) hooks.emit({ type: 'option', pick: o.pick });
      if (o.correct) {
        solved = true;
        b.classList.add('right');
        buttons.forEach((x) => (x.disabled = true));
        fb.solved('Yes.', task.explain);
        hooks.done({ firstTry: wrong === 0 });
      } else {
        wrong++;
        b.classList.add('wrong');
        b.disabled = true;
        fb.say(o.why || 'Not that one. Try again.', 'bad');
      }
    };
    list.append(b);
    return b;
  });
  body.append(list);
  return { pick(name) { buttons.find((b) => b.dataset.pick === name)?.click(); } };
}

// ------------------------------------------------------------------ multi

function multi(body, fb, task, hooks) {
  const list = el('div', `options${task.options.length > 6 ? ' two' : ''}`);
  const chosen = new Set();
  const want = task.options.filter((o) => o.correct).length;
  let tries = 0, solved = false;
  const buttons = shuffle(task.options).map((o) => {
    const b = button('option toggle', o.text);
    b.setAttribute('aria-pressed', 'false');
    b.onclick = () => {
      if (solved || b.disabled) return;
      chosen.has(o) ? chosen.delete(o) : chosen.add(o);
      b.setAttribute('aria-pressed', String(chosen.has(o)));
      ready();
      fb.clear();
    };
    list.append(b);
    return { b, o };
  });
  const check = button('primary small', 'Check');
  // Check wakes up once as many answers are picked as the question asks for
  const ready = () => { check.disabled = chosen.size !== want; };
  ready();
  check.onclick = () => {
    if (solved) return;
    tries++;
    const bad = [...chosen].filter((o) => !o.correct);
    const good = [...chosen].filter((o) => o.correct).length;
    if (!bad.length && good === want) {
      solved = true;
      buttons.forEach(({ b, o }) => { b.disabled = true; if (o.correct) b.classList.add('right'); });
      check.remove();
      body.querySelector('.hint')?.remove();
      fb.solved(`All ${want}.`, task.explain);
      hooks.done({ firstTry: tries === 1 });
      return;
    }
    for (const o of bad) {
      const it = buttons.find((x) => x.o === o);
      it.b.classList.add('wrong'); it.b.disabled = true; it.b.setAttribute('aria-pressed', 'false');
      chosen.delete(o);
    }
    const lines = [];
    if (bad.length) lines.push(bad.map((o) => o.why || `“${o.text}” doesn’t belong.`).join(' '));
    if (good < want) lines.push(`You have ${good} of ${want}. Keep going.`);
    fb.say(lines.join(' '), 'bad');
    ready();
  };
  body.append(el('p', 'hint', `Pick ${want}, then check.`), list, check);
}

// ------------------------------------------------------------------ order

// Two columns in the panel (which widens for it): the cards, shuffled, and a numbered list. Drag a card onto a number
// (or tap a card, then a number). Dropping on a filled number swaps the two. Check locks the right ones in
// and sends the rest back to the pile.
function order(body, fb, task, hooks) {
  const n = task.items.length;
  const pileOrder = shuffle(task.items.map((_, i) => i));
  const slots = Array(n).fill(null); // which item sits at each number
  const locked = Array(n).fill(false);
  let selected = null, tries = 0, solved = false, over = null;

  const board = el('div', 'orderboard');
  const pileCol = el('section', 'board-col pile');
  const listCol = el('section', 'board-col');
  const check = button('primary small', 'Check the order');
  const listHead = el('div', 'board-head');
  listHead.append(el('h2', null, 'In order'), check);
  pileCol.append(el('h2', null, 'Cards'));
  const pile = el('div', 'pile-cards');
  const list = el('ol', 'order-slots');
  pileCol.append(pile);
  listCol.append(listHead, list);
  board.append(pileCol, listCol);
  body.append(el('p', 'hint', 'Drag the cards onto the numbers, or tap a card and then a number. Drop on a filled number to swap.'), board);
  document.body.classList.add('wide-panel');
  dispatchEvent(new Event('resize')); // re-frame the scene beside the wider panel
  cleanup = () => { document.body.classList.remove('wide-panel'); dispatchEvent(new Event('resize')); };

  const slotOf = (it) => slots.indexOf(it);
  const targetAt = (x, y) => {
    for (const e of document.elementsFromPoint(x, y)) {
      if (e.dataset?.slot != null) return { slot: +e.dataset.slot };
      if (e === pileCol || pileCol.contains(e)) return { pile: true };
    }
    return null;
  };
  // Put item `it` at slot `to` (or back in the pile when `to` is null). A card already there goes where `it` came from.
  function place(it, to) {
    const from = slotOf(it);
    if (to != null) {
      if (locked[to] || from === to) return;
      const there = slots[to];
      slots[to] = it;
      if (from >= 0) slots[from] = there; // swap, or leave the old number empty
    } else if (from >= 0) {
      if (locked[from]) return;
      slots[from] = null;
    }
    selected = null;
    fb.clear();
    draw();
  }

  function card(it) {
    const c = button('order-card', task.items[it]);
    const at = slotOf(it);
    if (at >= 0 && locked[at]) { c.classList.add('right'); c.disabled = true; return c; }
    if (selected === it) c.classList.add('picked');
    draggable(c, task.items[it], {
      onMove: (x, y) => {
        const t = targetAt(x, y);
        const id = t?.slot ?? null;
        if (over !== id) { list.querySelector('.over')?.classList.remove('over'); over = id; if (id != null) list.children[id]?.classList.add('over'); }
      },
      onDrop: (x, y) => {
        list.querySelector('.over')?.classList.remove('over'); over = null;
        const t = targetAt(x, y);
        if (t?.slot != null) place(it, t.slot);
        else if (t?.pile) place(it, null);
      },
      onTap: () => { selected = selected === it ? null : it; draw(); },
    });
    return c;
  }

  function draw() {
    pile.replaceChildren(...pileOrder.filter((it) => slotOf(it) < 0).map(card));
    if (!pile.children.length) pile.append(el('p', 'pile-empty', solved ? 'All in order.' : 'All placed. Check the order.'));
    list.replaceChildren(...slots.map((it, k) => {
      const li = el('li', `order-slot${it == null ? ' empty' : ''}${locked[k] ? ' right' : ''}`);
      li.dataset.slot = k;
      li.append(el('span', 'slot-num', String(k + 1)));
      if (it == null) li.append(el('span', 'slot-hint', selected != null ? 'Tap to put it here' : ''));
      else li.append(card(it));
      li.onclick = (e) => {
        if (selected == null || e.target.closest('.order-card')) return;
        place(selected, k);
      };
      return li;
    }));
    check.disabled = solved || slots.includes(null);
  }
  pileCol.addEventListener('click', (e) => {
    if (selected != null && slotOf(selected) >= 0 && !e.target.closest('.order-card')) place(selected, null);
  });

  check.onclick = () => {
    tries++;
    let right = 0;
    slots.forEach((it, k) => {
      if (it === k) { locked[k] = true; right++; } else if (!locked[k]) slots[k] = null;
    });
    if (right === n) {
      solved = true;
      check.remove();
      body.querySelector('.hint')?.remove();
      // the pile is empty now: show the finished order on its own, in two short columns
      pileCol.remove();
      board.classList.add('solved');
      list.style.gridTemplateRows = `repeat(${Math.ceil(n / 2)}, auto)`;
      draw();
      fb.solved('That’s the order.', task.explain);
      hooks.done({ firstTry: tries === 1 });
      return;
    }
    draw();
    fb.say(`${right} of ${n} are in the right place, and they’re locked in green. The rest are back with the cards. Try again.`, 'bad');
  };
  draw();
}

// ------------------------------------------------------------------ match

function match(body, fb, task, hooks) {
  const rows = el('div', 'match-rows');
  const palette = el('div', 'palette');
  const done = new Set();
  const rowEls = new Map();
  const reusable = task.choices.length < task.items.length; // a sort into two or three piles
  const linked = task.items.some((it) => it.pick);
  // Long answers (definitions, descriptions) read better as a list, with the short items as pills above.
  const wide = task.choices.reduce((n, c) => n + c.label.length, 0) / task.choices.length > 28;
  if (wide) { rows.classList.add('pills'); palette.classList.add('defs'); }
  let current = null, wrong = 0, solved = false;

  function select(item) {
    if (!item || done.has(item.id)) return;
    current = item;
    rowEls.forEach((r, id) => r.classList.toggle('current', id === item.id));
    hooks.emit({ type: 'select', pick: item.pick || null });
    fb.clear();
  }
  const hoverRow = (id) => rowEls.forEach((r, rid) => r.classList.toggle('over', rid === id));

  function answer(item, c, chip) {
    if (!item || done.has(item.id)) return;
    const r = rowEls.get(item.id);
    if (c.id === item.answer) {
      done.add(item.id);
      r.classList.remove('current');
      r.classList.add('right');
      r.disabled = true;
      r.querySelector('.match-answer').textContent = c.label;
      hooks.emit({ type: 'item-correct', pick: item.pick || null, item: item.id, answer: c.label });
      fb.clear();
      if (!reusable) chip.disabled = true;
      if (wide) { chip.classList.add('used'); chip.prepend(el('b', null, item.label)); }
      if (done.size === task.items.length) {
        solved = true;
        current = null;
        // the list now says it all: wide keeps the matched definitions, narrow keeps the answered rows
        body.querySelector('.hint')?.remove();
        if (wide) rows.remove();
        else palette.remove();
        fb.solved('All matched.', task.explain);
        hooks.done({ firstTry: wrong === 0 });
      } else if (item === current || !current || done.has(current.id)) {
        select(task.items.find((it) => !done.has(it.id)));
      }
    } else {
      wrong++;
      select(item);
      r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake');
      fb.say(c.why || `Not “${c.label}” for ${item.label.toLowerCase()}. Try another.`, 'bad');
    }
  }

  task.items.forEach((item, k) => {
    const r = button('match-row');
    r.dataset.item = item.id;
    r.append(el('span', 'match-num', String(k + 1)), el('span', 'match-label', item.label), el('span', 'match-answer', '?'));
    r.onclick = () => select(item);
    rows.append(r);
    rowEls.set(item.id, r);
  });

  // Where a dragged chip lands: a row in the panel, or a part (or its label) in the scene.
  const itemAt = (x, y) => {
    const row = document.elementsFromPoint(x, y).find((e) => e.dataset?.item);
    if (row) return task.items.find((it) => it.id === row.dataset.item);
    const pick = linked ? hooks.dropTarget(x, y) : null;
    return pick ? task.items.find((it) => it.pick === pick) : null;
  };

  for (const c of shuffle(task.choices)) {
    const chip = button('chip', c.label);
    draggable(chip, c.label, {
      onMove: (x, y) => hoverRow(itemAt(x, y)?.id),
      onDrop: (x, y) => { hoverRow(null); if (!solved) answer(itemAt(x, y), c, chip); },
      onTap: () => {
        if (solved || chip.disabled) return;
        if (!current) { fb.say('Pick something on the list first.'); return; }
        answer(current, c, chip);
      },
    });
    palette.append(chip);
  }

  const how = linked
    ? 'Drag each answer onto its part, in the list or in the scene. Or pick a part, then tap its answer.'
    : 'Drag each answer onto its row, or pick a row and then tap its answer.';
  body.append(rows, el('p', 'hint', how), palette);
  select(task.items[0]);
  return { pick(name) { select(task.items.find((it) => it.pick === name)); } };
}

// ------------------------------------------------------------------ answer3

function answer3(body, fb, task, hooks) {
  const area = el('div', 'answer3');
  const built = el('div', 'built');
  body.append(built, area);
  let wrong = 0;

  const line = (label, text) => {
    const p = el('p', 'built-line');
    p.append(el('strong', null, label + ' '), document.createTextNode(text));
    built.append(p);
  };

  function step(title, options, onRight) {
    area.replaceChildren(el('p', 'step', title));
    const list = el('div', 'options');
    for (const o of shuffle(options)) {
      const b = button('option', o.text);
      b.onclick = () => {
        if (o.ok) { fb.clear(); onRight(o); return; }
        wrong++;
        b.classList.add('wrong'); b.disabled = true;
        fb.say(o.why, 'bad');
      };
      list.append(b);
    }
    area.append(list);
  }

  step(task.steps[0],
    task.claims.map((c) => ({ text: c.claim, ok: true, c })),
    ({ c }) => {
      line('How:', c.claim);
      const others = task.claims.filter((x) => x !== c);
      step(task.steps[1], [
        { text: c.detail, ok: true },
        ...shuffle(others).slice(0, 2).map((x) => ({ text: x.detail, why: `That’s true, but it backs up a different point: “${x.claim}”` })),
        ...task.wrongDetails.slice(0, 1).map((t) => ({ text: t, why: 'That isn’t true. Check the reading.' })),
      ], () => {
        line('Detail:', c.detail);
        step(task.steps[2], [
          { text: c.why, ok: true },
          ...shuffle(others).slice(0, 2).map((x) => ({ text: x.why, why: `That’s a good reason, but for a different point: “${x.claim}”` })),
        ], () => {
          line('Why it matters:', c.why);
          area.replaceChildren();
          fb.solved('That’s a three-part answer. On the test, write it in your own words.', task.explain);
          hooks.done({ firstTry: wrong === 0 });
        });
      });
    });
}

// ------------------------------------------------------------------ when

// The calendar card (outside the panel) has the month slider. The student moves it, then presses "This month".
function when(body, fb, task, hooks) {
  body.append(el('p', 'hint', 'Use the slider on the calendar, then press the button.'));
  const go = button('primary small', 'This month');
  body.append(go);
  let wrong = 0, solved = false;
  go.onclick = () => {
    if (solved) return;
    const m = hooks.month();
    if (task.answer.includes(m)) {
      solved = true;
      go.remove();
      body.querySelector('.hint')?.remove();
      fb.solved('Yes.', task.explain);
      hooks.done({ firstTry: wrong === 0 });
    } else {
      wrong++;
      fb.say(m < Math.min(...task.answer) ? task.hints.early : task.hints.late, 'bad');
    }
  };
}

// ------------------------------------------------------------------ mapfind

const SVG = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, text) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text != null) e.textContent = text;
  return e;
};
const project = ([lon, lat]) => [(lon - MAP.proj.w) * MAP.proj.kx, (MAP.proj.n - lat) * MAP.proj.ky];
const unproject = ([x, y]) => [x / MAP.proj.kx + MAP.proj.w, MAP.proj.n - y / MAP.proj.ky];

// A map of the Maritimes over the scene. Tap the place the question asks for.
function mapfind(body, fb, task, hooks) {
  body.append(el('p', 'hint', 'Tap the map.'));
  const card = el('div', 'mapcard');
  const map = svg('svg', { viewBox: `0 0 ${MAP.w} ${MAP.h}`, role: 'img', 'aria-label': 'Map of New Brunswick, Nova Scotia, Prince Edward Island and Maine' });
  map.append(svg('rect', { width: MAP.w, height: MAP.h, class: 'sea' }));
  const L = MAP.land;
  for (const k of ['me', 'qc', 'lab', 'nb', 'ns', 'pe', 'nf']) map.append(svg('path', { d: L[k], class: 'land' }));
  for (const k of ['me', 'qc', 'lab', 'nb', 'ns', 'pe', 'nf']) map.append(svg('path', { d: L[k], class: 'coast' }));
  // province and state names, today's, so students can find their way
  for (const [name, at] of [['New Brunswick', [-66.6, 46.55]], ['Nova Scotia', [-62.9, 45.3]], ['PEI', [-63.4, 46.42]],
    ['Maine', [-69.2, 45.3]], ['Québec', [-68.9, 48.0]]]) {
    const [x, y] = project(at);
    map.append(svg('text', { x, y, class: 'region-label' }, name));
  }
  const marks = svg('g');
  map.append(marks);
  const dot = (at, label, cls) => {
    const [x, y] = project(at);
    marks.append(svg('circle', { cx: x, cy: y, r: 9, class: `mark ${cls}` }));
    marks.append(svg('text', { x: x + 14, y: y - 10, class: `mark-label ${cls}` }, label));
  };
  if (task.start) dot(task.start.at, task.start.label, 'start');
  card.append(map);
  document.body.append(card);
  document.body.classList.add('mapping');
  cleanup = () => { card.remove(); document.body.classList.remove('mapping'); };

  let wrong = 0, solved = false;
  map.addEventListener('click', (e) => {
    if (solved) return;
    const pt = map.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(map.getScreenCTM().inverse());
    const [lon, lat] = unproject([p.x, p.y]);
    const t = task.target.at;
    const d = Math.hypot((lon - t[0]) * Math.cos((lat * Math.PI) / 180), lat - t[1]);
    if (d <= task.target.r) {
      solved = true;
      dot(t, task.target.label, 'found');
      if (task.start) {
        const [x0, y0] = project(task.start.at), [x1, y1] = project(t);
        const route = svg('path', { d: `M${x0} ${y0} Q ${(x0 + x1) / 2} ${Math.max(y0, y1) + 60} ${x1} ${y1}`, class: 'route' });
        marks.prepend(route);
      }
      fb.solved('Found it.', task.explain);
      hooks.done({ firstTry: wrong === 0 });
    } else {
      wrong++;
      const [x, y] = [p.x, p.y];
      const miss = svg('circle', { cx: x, cy: y, r: 7, class: 'miss' });
      marks.append(miss);
      setTimeout(() => miss.remove(), 1200);
      fb.say(task.hint, 'bad');
    }
  });
}
