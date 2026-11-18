import { CALENDAR } from './content.js';
import { MONTHS } from './world.js';

// The two-calendar card: one slider through the months, and what each side of the river was living through.
// Left: the French on the island. Right: Peskotomuhkati families. onChange(m) runs whenever the month moves.

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

export function buildCalendar(host, onChange) {
  host.replaceChildren();
  const head = el('div', 'cal-head');
  const month = el('p', 'cal-month');
  const slider = el('input', 'cal-slider');
  Object.assign(slider, { type: 'range', min: '0', max: String(CALENDAR.length - 1), step: '1', value: '0' });
  slider.setAttribute('aria-label', 'Month');
  const ticks = el('div', 'cal-ticks');
  MONTHS.forEach((m, i) => ticks.append(el('span', i === 0 || m.startsWith('January') ? 'year' : '', m.slice(0, 1))));
  head.append(month, slider, ticks);

  const cols = el('div', 'cal-cols');
  const fr = el('section', 'cal-col fr');
  const pk = el('section', 'cal-col pk');
  fr.append(el('h3', null, 'The French on the island'));
  pk.append(el('h3', null, 'Peskotomuhkati families'));
  const frText = el('p', 'cal-text'), pkText = el('p', 'cal-text');
  fr.append(frText);
  pk.append(pkText);

  const meters = (col) => ['Firewood', 'Fresh water', 'Fresh food'].map((name) => {
    const row = el('div', 'meter');
    const bar = el('span', 'bar');
    const fill = el('span', 'fill');
    bar.append(fill);
    row.append(el('span', 'meter-name', name), bar);
    col.append(row);
    return fill;
  });
  const frM = meters(fr), pkM = meters(pk);

  // 79 men: well, sick, died
  const men = el('div', 'men');
  const dots = Array.from({ length: 79 }, () => men.appendChild(el('span', 'man')));
  const menNote = el('p', 'men-note');
  fr.append(men, menNote);

  // where the families are: a sketch of the river, the bay, and the land inland
  const where = svg('svg', { viewBox: '0 0 200 92', class: 'where', 'aria-hidden': 'true' });
  where.append(
    svg('path', { d: 'M0 74 Q60 64 100 70 T200 66 L200 92 L0 92 Z', class: 'w-bay' }),
    svg('path', { d: 'M104 70 C 100 54, 112 40, 98 26 S 70 8, 60 0', class: 'w-river' }),
    svg('circle', { cx: 103, cy: 58, r: 3.2, class: 'w-island' }),
  );
  const lab = (x, y, t, c = 'w-label') => { const e = svg('text', { x, y, class: c }); e.textContent = t; where.append(e); };
  lab(118, 85, 'the bay'); lab(4, 14, 'inland'); lab(110, 56, 'island', 'w-label small');
  const fam = svg('g', { class: 'w-fam' });
  fam.append(svg('path', { d: 'M-7 5 L0 -8 L7 5 Z' }));
  where.append(fam);
  pk.append(where);

  cols.append(fr, pk);
  host.append(head, cols);

  const SPOT = { coast: [150, 63], moving: [92, 32], inland: [36, 16], visit: [96, 56] };
  function show(m) {
    const c = CALENDAR[m];
    month.textContent = MONTHS[m];
    frText.textContent = c.fr;
    pkText.textContent = c.pk;
    [c.wood, c.water, c.fresh].forEach((v, i) => { frM[i].style.width = `${v * 100}%`; frM[i].className = `fill${v < 0.3 ? ' low' : ''}`; });
    // the families move to where these are, so they keep them all year
    [0.95, 0.95, c.camp === 'inland' ? 0.85 : 0.9].forEach((v, i) => { pkM[i].style.width = `${v * 100}%`; });
    dots.forEach((d, i) => { d.className = `man${i < c.dead ? ' dead' : i < c.dead + c.sick ? ' sick' : ''}`; });
    menNote.textContent = m === 0 ? '79 men will spend the winter here.'
      : c.dead >= 35 ? '35 of the 79 died. About 20 more came close.'
      : c.sick ? 'More get sick as the winter goes on.' : '';
    const [x, y] = SPOT[c.camp];
    fam.setAttribute('transform', `translate(${x} ${y})`);
  }
  slider.oninput = () => { const m = +slider.value; show(m); onChange(m); };
  return {
    set(m) { slider.value = String(m); show(m); },
    get month() { return +slider.value; },
  };
}
