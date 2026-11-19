// The source viewer: Champlain's own pages beside a version you can read, and what historians say today.
//
// openSources(ids)  opens a set of passages from sources.js (the ones behind one question or one card), with a tab
//                   for each when there is more than one.
// openLibrary()     opens the list of every source in the chapter, primary and secondary.
// sourceChips(ids)  little buttons, one per passage, that open the viewer at that passage.
//
// A primary passage shows the 1613 page (click to zoom in, drag to move around; gold bands mark the passage) and the
// words in three versions: today's words, the 1878 English translation, and Champlain's French.
import { DOCS, EXCERPTS, chipLabel } from './sources.js';
import './sources.css';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const button = (cls, text) => { const b = el('button', cls, text); b.type = 'button'; return b; };

const VERSIONS = [
  ['plain', 'In today’s words'],
  ['en', 'English, 1878'],
  ['fr', 'French, 1613'],
];
const ZOOM = 2.6;

let root = null, list = [], at = 0, version = 'plain', back = null, fromLibrary = false;
let lastFocus = null;
try { version = localStorage.getItem('acadie-source-version') || 'plain'; } catch {}

function build() {
  root = el('div', 'sv-backdrop');
  root.hidden = true;
  root.addEventListener('pointerdown', (e) => { if (e.target === root) close(); });
  document.body.append(root);
  // capture, so Escape closes the viewer and nothing behind it (the free-roam card listens on window)
  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
  }, true);
}

function shell(head) {
  const card = el('section', 'sv paint-paper');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', 'Sources');
  const top = el('header', 'sv-head');
  top.append(...head);
  const x = button('sv-close', '×');
  x.setAttribute('aria-label', 'Close the sources');
  x.onclick = close;
  top.append(x);
  card.append(top);
  root.replaceChildren(card);
  return card;
}

function show() {
  if (root.hidden) lastFocus = document.activeElement;
  root.hidden = false;
  document.body.classList.add('with-sources');
  root.querySelector('.sv-close')?.focus({ preventScroll: true });
}

export function close() {
  if (!root || root.hidden) return;
  root.hidden = true;
  document.body.classList.remove('with-sources');
  lastFocus?.focus?.({ preventScroll: true });
}

export function openSources(ids, start = ids[0]) {
  if (!root) build();
  list = ids.filter((id) => EXCERPTS[id]);
  if (!list.length) return;
  at = Math.max(0, list.indexOf(start));
  fromLibrary = false;
  draw();
  show();
}

export function openLibrary() {
  if (!root) build();
  const card = shell([el('h2', 'sv-title', 'Sources for this chapter')]);
  const body = el('div', 'sv-library');
  body.append(el('p', 'sv-about',
    'A primary source was made at the time, by someone who was there. A secondary source was written later, by someone studying the past. Click one to read it.'));
  const groups = [
    ['primary', 'Primary source', 'Champlain’s own book, 1613'],
    ['secondary', 'Secondary sources', 'What historic sites say today'],
  ];
  for (const [kind, label, sub] of groups) {
    const sec = el('section', 'sv-group');
    sec.append(el('h3', null, label), el('p', 'sv-sub', sub));
    const grid = el('div', `sv-grid kind-${kind}`);
    const ids = Object.keys(EXCERPTS).filter((id) => DOCS[EXCERPTS[id].doc].kind === kind);
    for (const id of ids) {
      const x = EXCERPTS[id], d = DOCS[x.doc];
      const b = button('sv-item');
      if (x.pages) { const img = el('img'); img.src = x.pages[0].src; img.alt = ''; img.loading = 'lazy'; b.append(img); }
      const words = el('span');
      words.append(el('b', null, x.title), el('small', null, x.pages ? x.where : `${d.who}, ${x.where}`));
      b.append(words);
      b.onclick = () => { list = ids; at = ids.indexOf(id); fromLibrary = true; draw(); };
      grid.append(b);
    }
    sec.append(grid);
    body.append(sec);
  }
  card.append(body);
  show();
}

function draw() {
  const x = EXCERPTS[list[at]], d = DOCS[x.doc];
  const head = [];
  if (fromLibrary) {
    const b = button('sv-back', '‹ All sources');
    b.onclick = openLibrary;
    head.push(b);
  }
  if (list.length > 1 && !fromLibrary) {
    const tabs = el('div', 'sv-tabs');
    tabs.setAttribute('role', 'tablist');
    list.forEach((id, i) => {
      const t = button('sv-tab', EXCERPTS[id].title);
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', String(i === at));
      t.dataset.kind = DOCS[EXCERPTS[id].doc].kind;
      t.onclick = () => { at = i; draw(); };
      tabs.append(t);
    });
    head.push(tabs);
  } else if (!fromLibrary) head.push(el('span', 'sv-spacer'));
  if (fromLibrary) {
    const nav = el('div', 'sv-step');
    const p = button('sv-back', '‹'), n = button('sv-back', '›');
    p.setAttribute('aria-label', 'Previous source'); n.setAttribute('aria-label', 'Next source');
    p.disabled = at === 0; n.disabled = at === list.length - 1;
    p.onclick = () => { at--; draw(); }; n.onclick = () => { at++; draw(); };
    nav.append(p, el('span', null, `${at + 1} of ${list.length}`), n);
    head.push(nav);
  }
  const card = shell(head);
  card.classList.toggle('kind-secondary', d.kind === 'secondary');

  const body = el('div', x.pages ? 'sv-body two' : 'sv-body');
  if (x.pages) body.append(pageViewer(x));
  body.append(textSide(x, d));
  card.append(body);
}

// ------------------------------------------------------------------ the 1613 page

function pageViewer(x) {
  const side = el('div', 'sv-pageside');
  const frame = el('div', 'sv-page');
  frame.tabIndex = 0;
  frame.setAttribute('aria-label', 'The page as it was printed in 1613. Click to zoom in.');
  const wrap = el('div', 'sv-zoom');
  const img = el('img');
  wrap.append(img);
  frame.append(wrap);
  const bar = el('div', 'sv-pagebar');
  const tabs = el('div', 'sv-pagetabs');
  const zoomBtn = button('sv-zoombtn', 'Zoom in');
  const open = el('a', 'sv-open', 'Open the full scan ↗');
  open.target = '_blank';
  open.rel = 'noopener';
  bar.append(tabs, zoomBtn);

  let k = 0, zoomed = false;
  const marks = [];
  function setPage(i) {
    k = i;
    const p = x.pages[k];
    img.src = p.src;
    img.alt = `${x.where.split(',')[0]}: ${p.label}, Champlain’s Voyages, 1613`;
    open.href = p.link;
    marks.forEach((m) => m.remove());
    marks.length = 0;
    for (const [a, b] of p.marks) {
      const m = el('div', 'sv-mark');
      m.style.top = a + '%';
      m.style.height = (b - a) + '%';
      wrap.append(m);
      marks.push(m);
    }
    [...tabs.children].forEach((t, j) => t.setAttribute('aria-pressed', String(j === k)));
    setZoom(false);
  }
  // the page fits the frame, or (zoomed) is ZOOM times that; sized in pixels so the gold bands stay on their lines
  function layout() {
    const iw = img.naturalWidth, ih = img.naturalHeight, fw = frame.clientWidth, fh = frame.clientHeight;
    if (!iw || !fw || !fh) return;
    const s = Math.min(fw / iw, fh / ih) * (zoomed ? ZOOM : 1);
    wrap.style.width = Math.round(iw * s) + 'px';
    wrap.style.height = Math.round(ih * s) + 'px';
  }
  img.addEventListener('load', layout);
  new ResizeObserver(layout).observe(frame);
  function setZoom(on, cx = 0.5, cy = 0.3) {
    zoomed = on;
    frame.classList.toggle('zoomed', on);
    zoomBtn.textContent = on ? 'Whole page' : 'Zoom in';
    layout();
    // keep the clicked point in the middle of the frame
    frame.scrollLeft = on ? cx * wrap.offsetWidth - frame.clientWidth / 2 : 0;
    frame.scrollTop = on ? cy * wrap.offsetHeight - frame.clientHeight / 2 : 0;
  }
  // the first gold band, so a zoom without a click lands on the passage
  const markAt = () => { const m = x.pages[k].marks[0]; return m ? (m[0] + Math.min(m[1] - m[0], 20) / 2) / 100 : 0.3; };
  x.pages.forEach((p, i) => {
    const t = button('sv-pagetab', p.label);
    t.onclick = () => setPage(i);
    tabs.append(t);
  });
  if (x.pages.length < 2) tabs.append(el('span', 'sv-pagelabel', x.pages[0].label));
  zoomBtn.onclick = () => setZoom(!zoomed, 0.5, markAt());

  // click to zoom (at the click), drag to move around while zoomed
  let drag = null;
  frame.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, sl: frame.scrollLeft, st: frame.scrollTop, moved: false };
    frame.setPointerCapture(e.pointerId);
  });
  frame.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    if (zoomed && drag.moved) { frame.scrollLeft = drag.sl - dx; frame.scrollTop = drag.st - dy; }
  });
  frame.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (moved) return;
    const r = wrap.getBoundingClientRect();
    setZoom(!zoomed, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });
  frame.addEventListener('pointercancel', () => { drag = null; });
  frame.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setZoom(!zoomed, 0.5, markAt()); } });

  side.append(frame, bar, open);
  setPage(0);
  return side;
}

// ------------------------------------------------------------------ the words

function textSide(x, d) {
  const side = el('div', 'sv-text');
  const badge = el('p', `sv-kind kind-${d.kind}`, d.kind === 'primary' ? 'Primary source' : 'Secondary source');
  side.append(badge, el('h2', 'sv-title', x.title));
  side.append(el('p', 'sv-who', `${d.who} · ${d.kind === 'primary' ? d.when + ' · ' + x.where : x.where}`));

  const box = el('div', 'sv-words');
  if (x.pages) {
    const tabs = el('div', 'sv-versions');
    tabs.setAttribute('role', 'tablist');
    const fill = () => {
      box.replaceChildren();
      const v = x[version] ? version : 'plain';
      if (v === 'fr') box.append(el('p', 'sv-tip', 'Reading the old printing: ſ is an s, u is often a v (auoit = avoit), ã means an (grãdes = grandes), and & means et.'));
      for (const para of x[v]) box.append(el('p', v === 'plain' ? null : 'sv-quote', para));
      if (v !== 'plain') box.lang = v === 'fr' ? 'fr' : 'en'; else box.removeAttribute('lang');
      [...tabs.children].forEach((t) => t.setAttribute('aria-selected', String(t.dataset.v === v)));
    };
    for (const [v, label] of VERSIONS) {
      const t = button('sv-version', label);
      t.dataset.v = v;
      t.setAttribute('role', 'tab');
      t.onclick = () => { version = v; try { localStorage.setItem('acadie-source-version', v); } catch {} fill(); };
      tabs.append(t);
    }
    side.append(tabs, box);
    fill();
  } else {
    box.append(el('h3', 'sv-label', 'What it says'));
    for (const para of x.quote) box.append(el('p', 'sv-quote', para));
    box.append(el('h3', 'sv-label', 'In today’s words'));
    for (const para of x.plain) box.append(el('p', null, para));
    side.append(box);
  }
  if (x.note) {
    const n = el('div', 'sv-note');
    n.append(el('b', null, 'Think about it. '), document.createTextNode(x.note));
    side.append(n);
  }
  const foot = el('p', 'sv-credit');
  foot.append(document.createTextNode(d.credit + ' '));
  const link = x.link || d.link;
  if (link) {
    const a = el('a', null, x.link ? 'Read the whole page ↗' : (d.linkText || 'More') + ' ↗');
    a.href = link; a.target = '_blank'; a.rel = 'noopener';
    foot.append(a);
  }
  side.append(foot);
  return side;
}

// ------------------------------------------------------------------ buttons that open it

// One small button per passage. `extra` is plain text for a source that can't be opened here (the class reading).
export function sourceChips(ids, extra) {
  const row = el('div', 'sv-chips');
  row.append(el('span', 'sv-chips-label', 'Sources:'));
  const good = ids.filter((id) => EXCERPTS[id]);
  for (const id of good) {
    const b = button(`sv-chip kind-${DOCS[EXCERPTS[id].doc].kind}`, chipLabel(id));
    b.onclick = () => openSources(good, id);
    row.append(b);
  }
  if (extra) row.append(el('span', 'sv-chip plain', extra));
  return row;
}
