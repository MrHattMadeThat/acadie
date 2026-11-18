# Acadie: handoff

A 3D Grade 8 Social Studies experience (NB) about early Acadie. Vite + three.js, vanilla JS, same stack and panel
engine as `../wabanaki-wampum-review` (The Open Path), with real ground built the way `../st-george-3d` builds its
own. Started 2026-11-18. Read `README.md` for the file map and `docs/SOURCES.md` for sources.

## What the teacher wants

- **It grows.** Each new class reading becomes a new chapter: take the reading, integrate it. Chapter 1 is the reading
  *The Island* (St. Croix Island, 1604–05), already handed out. The next reading is "Who were the Acadians, and how
  did they live?" (aboiteaux and daily life are expected there). Later: the border story (which river is the St.
  Croix? the 1797–98 commission used the island's ruins; St. George nearly became the border).
- **Start at St. Croix Island**, not with Wabanaki territories (the class did those in depth already). The
  Peskotomuhkati are there first, living their year; show what they knew and helped with, and what the French
  didn't know. Use "Peskotomuhkati (Passamaquoddy)" the first time.
- **Facts beyond the reading are welcome**, but each one goes in `docs/SOURCES.md` and gets a comment in
  `content.js`. Don't add facts from memory without a source.
- Audience: Grade 8, lab PCs (16 GB, integrated graphics). Short sentences.

## Ground rules carried over from the Open Path

- Reword, don't copy, the reading's questions.
- No people models yet. The sickness and the deaths are told plainly and quietly (a small cemetery), never acted out.
- **No question may scroll inside the panel** at 1366×650, before or after answering. Re-check after content or
  style changes (a loop over `#qdots .qdot` in the console does it).
- There is no automated UI test. Verify in the browser and say so.

## How it fits together

- One persistent scene (`scene.js`) instead of a separate stage per stop. Each stop has a camera in `VIEWS`, a
  `month`, and `setStop(id, month)` decides what shows. `world.setMonth(m)` runs the seasons: m counts months from
  June 1604 (0) to August 1605 (14). Curves are in `CURVE` in world.js.
- `calendar: true` on a stop shows the two-calendar card; its slider calls `world.setMonth` and `story.setMonth`.
  `when` tasks read the card's month. The tide runs four times faster on that stop so the ice is seen moving.
- The scene centres between the panel and the calendar card (`resize` in main.js uses a view offset both ways).
- Match questions with `pick`s get numbered labels on the 3D parts. `scripts/check-content.mjs` keeps its own copy
  of the pick list; keep it in step with `picks` in scene.js.
- Positions are local metres (east +x, north -z, island at the origin). Use `node scripts/probe.mjs x,z` or
  `probe.mjs grid x0 z0 x1 z1 step` to find ground heights before placing anything. High water is +2.9 m; the
  island's high ground is around (0, -80).
- The forest is ~68,000 instanced trees in 1.2 km tiles (frustum culled). Keep them low-poly: the scene draws about
  1 million triangles; it was 5.5 million before the trees were simplified.
- Custom ShaderMaterials need `#include <common>` and the `logdepthbuf` chunks (the renderer uses a logarithmic
  depth buffer for the 9 km board). r185 fails silently: read `acadie.renderer.info.programs[].diagnostics`.
- The browser pane is often hidden, so rAF stalls: drive time with `acadie.story.update(dt, t, 0)` loops and call
  `acadie.render()` before reading anything.
- Console: `acadie.arrive(n)`, `acadie.setMonth(m)`, `acadie.story`, `acadie.world`.

## Open items

- The French models are procedural stand-ins (`src/french.js`); a Codex model brief like the Open Path's would be
  the next art step (ship, habitation buildings from Champlain's plan).
- Confirm Champlain's dates (first snow, first ice) against his *Voyages*.
- Git: public repo MrHattMadeThat/acadie; LIVE at https://mrhattmadethat.github.io/acadie/. Pushing to `main`
  deploys through GitHub Pages (`.github/workflows/deploy.yml` runs `npm run check` first). Commits use the GitHub no-reply identity set in
  the repo's local config, like `../st-george-3d`. Stage files by name, never `git add -A`. `data/raw/` (elevation tiles
  and OSM) is ignored, so `public/data/` is committed and `npm run build:data` only works on this machine. Ask before
  publishing anything.
