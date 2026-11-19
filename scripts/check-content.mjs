// Checks src/content.js: every task is well formed, and every `pick` names a part the scene can show.
// Run: npm run check
import { existsSync } from 'node:fs';
import { STOPS, CALENDAR, CHAPTERS } from '../src/content.js';
import { DOCS, EXCERPTS, SHORT } from '../src/sources.js';
import { INFO, SCENES } from '../src/stories.js';

// Keep in step with the `picks` list in src/scene.js.
const PICKS = ['pelts', 'trade_kettle', 'axe', 'cloth', 'storehouse', 'gardens', 'palisade', 'battery_north', 'battery_south'];
const VIEWS = ['trade', 'plan', 'island', 'winter', 'sickness', 'neighbours', 'leaving', 'acadie'];

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const ids = new Set();
let count = 0;

for (const s of STOPS) {
  if (ids.has(s.id)) fail(s.id, 'duplicate stop id');
  ids.add(s.id);
  if (!VIEWS.includes(s.id)) fail(s.id, 'no camera view in scene.js VIEWS');
  if (!CHAPTERS.some((c) => c.id === s.chapter)) fail(s.id, `unknown chapter ${s.chapter}`);
  if (!(s.month >= 0 && s.month < CALENDAR.length)) fail(s.id, `month ${s.month} is outside the calendar`);
  for (const k of ['title', 'place', 'intro']) if (!s[k]) fail(s.id, `missing ${k}`);
  s.tasks.forEach((t, i) => {
    const w = `${s.id}.${i + 1}`;
    count++;
    if (!t.prompt) fail(w, 'missing prompt');
    if (!t.explain) fail(w, 'missing explain');
    if (t.type === 'choice') {
      if (t.options.filter((o) => o.correct).length !== 1) fail(w, 'choice needs exactly one correct option');
      t.options.filter((o) => !o.correct && !o.why).forEach((o) => fail(w, `wrong option without a why: ${o.text}`));
    } else if (t.type === 'multi') {
      if (!t.options.some((o) => o.correct)) fail(w, 'multi needs a correct option');
    } else if (t.type === 'match') {
      const cs = new Set(t.choices.map((c) => c.id));
      t.items.forEach((it) => {
        if (!cs.has(it.answer)) fail(w, `item ${it.id} answers ${it.answer}, which isn't a choice`);
        if (it.pick && !PICKS.includes(it.pick)) fail(w, `pick ${it.pick} isn't in the scene`);
      });
    } else if (t.type === 'answer3') {
      if (t.steps?.length !== 3) fail(w, 'answer3 needs three step titles');
      if (t.claims.length < 3) fail(w, 'answer3 needs three claims');
    } else if (t.type === 'when') {
      if (!s.calendar) fail(w, 'a when task needs a stop with the calendar');
      if (!t.answer?.length || !t.hints?.early || !t.hints?.late) fail(w, 'when needs answer and hints');
    } else if (t.type === 'mapfind') {
      if (!t.target?.at || !t.target?.r || !t.hint) fail(w, 'mapfind needs target.at, target.r and hint');
    } else if (t.type === 'mapmatch') {
      if (t.view?.length !== 4) fail(w, 'mapmatch needs view: [west, south, east, north]');
      const [W, S, E, N] = t.view || [];
      const ids = new Set();
      for (const p of [...(t.fixed || []), ...t.items]) {
        if (ids.has(p.id)) fail(w, `place ${p.id} is listed twice`);
        ids.add(p.id);
        if (!(p.at?.[0] > W && p.at[0] < E && p.at[1] > S && p.at[1] < N)) fail(w, `${p.id} is outside the view`);
      }
      t.items.forEach((it) => { if (!it.hint) fail(w, `${it.id} needs a hint`); });
      (t.route || []).forEach((id) => { if (!ids.has(id)) fail(w, `route names ${id}, which isn't on the map`); });
    } else fail(w, `unknown type ${t.type}`);
  });
}
for (const [m, c] of CALENDAR.entries()) for (const k of ['fr', 'pk', 'camp']) if (!c[k]) fail(`calendar ${m}`, `missing ${k}`);

// The sources (src/sources.js): every passage is whole, every page image exists, and everything that cites one
// names a real passage.
for (const [id, x] of Object.entries(EXCERPTS)) {
  const d = DOCS[x.doc];
  if (!d) { fail(`source ${id}`, `unknown doc ${x.doc}`); continue; }
  for (const k of ['title', 'where', 'plain']) if (!x[k]) fail(`source ${id}`, `missing ${k}`);
  if (x.pages) {
    for (const k of ['fr', 'en']) if (!x[k]?.length) fail(`source ${id}`, `a primary passage needs ${k}`);
    for (const p of x.pages) {
      if (!existsSync(new URL(`../public/${p.src}`, import.meta.url))) fail(`source ${id}`, `no image ${p.src}`);
      for (const [a, b] of p.marks) if (!(a >= 0 && b > a && b <= 100)) fail(`source ${id}`, `bad mark ${a}-${b} on ${p.label}`);
    }
  } else if (!x.quote?.length || !(x.link || d.link)) fail(`source ${id}`, 'a secondary passage needs quote and link');
}
const cites = (where, ids) => (ids || []).forEach((id) => { if (!EXCERPTS[id]) fail(where, `cites ${id}, which isn't in sources.js`); });
for (const s of STOPS) s.tasks.forEach((t, i) => cites(`${s.id}.${i + 1}`, t.sources));
for (const [id, x] of Object.entries(INFO)) cites(`card ${id}`, x.cite);
for (const sc of SCENES) cites(`scene ${sc.id}`, sc.cite);
for (const [k, ids] of Object.entries(SHORT)) cites(`short name ${k}`, ids);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`content ok: ${STOPS.length} stops, ${count} questions, ${CALENDAR.length} months, ${Object.keys(EXCERPTS).length} source passages`);
