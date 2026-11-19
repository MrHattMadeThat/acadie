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
- **If it can't be proven, it goes** (2026-11-18). The March 1605 "fresh meat for bread" visit was cut for this.
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

## Champlain's maps (2026-11-18, round 2)

- The habitation is laid out letter by letter from Champlain's plan (`H` table in scene.js, plan pixels through
  `plan()`), with its top to the west. The island and mainland sites come from his island map via
  `scripts/champlain-fit.mjs`. See docs/SOURCES.md for every judgment call.
- **The island's shape (round 3):** `data/island-trace.png` (mid-tide shore traced from air photos, 1 m a pixel,
  origin -160,-250) plus OSM's island outline (= low water) make the island in `build-terrain.mjs` ("St. Croix
  Island, at 1 m"). High tide cuts off both islets, half tide bares the spit and the rock ledge, low tide joins it
  all. `public/data/inset-kind.bin` marks sand and rock for the ground colours. The habitation is spread a little
  along the island (2026-11-18: `PLAN.along` 0.13 m a plan pixel from plan x 900, across it stays 0.1), each
  building nudged and turned a touch (`jitter` in scene.js). The rows F, Q, R, T are separate cottages 1.6 m apart
  (`ROW_GAP`), not one long building: the user wants room to walk between every building. Its middle is repeated in main.js (MAP_VIEWS.plan). The
  footpaths and the trodden square are `PATHS` in scene.js, drawn by the ground shader through `world.setPaths`.
- Vite's dev server can serve a stale `meta.json` next to a new `inset.bin` after `npm run build:data`, which
  stretches the island. Reload with the cache bypassed.
- **Champlain's maps (1613)** button: a card with both maps; while one is open, his letters show on the 3D scene
  (`story.setLetters`) and the camera glides to look down with west at the top, the way he drew them.
- People: `src/people.js` is copied from st-george-3d (instanced, posed in code), with felt hats, knitted caps, long hair
  and planks/logs/buckets added. All the French are men (79 wintered). Who shows when is each figure's `when(st)` in
  scene.js. Peskotomuhkati figures appear as traders in the canoe, at the summer camp, and in March 1605; no
  ceremony, nothing stereotyped.
- The ice always floats (2026-11-19): `floeLimits` in world.js gives each floe, every 2.5 m of its drift, the lowest tide that keeps 0.15 m of water over all ground under it at any spin; tick clamps to that, so floes fall back off the flats as the tide drops and never touch a beach, the ship's anchorage or the landing.
- On the last stop the ship comes in close to the landing (`shipLoading`), in water deep enough to float at low tide
  (the bed drops steeply off the island now, so grounding there would leave her hanging over water).

## Free roam (2026-11-18)

- `src/explore.js` runs it: click a building for its card (`INFO` in `src/stories.js`), click the people by a gold
  dot (or the dot itself) to watch a scene (`SCENES`): speech bubbles over heads, poses from people.js (`turn`, `swat`,
  `point`, `shiver`, `study` were added for these), props built in explore.js, the camera glides in. A Summer 1604 /
  Winter 1604-05 switch in the roam bar sets the month and which scenes show.
- Every card and scene names its source; the words are made up, the facts are not (docs/SOURCES.md, "Free roam").
  Nothing about the sickness is acted out.
- Console: `acadie.explore.season('winter')`, `acadie.explore.play('cider')`.
- Scene markers are small dots; the dot opens into the 💬 name when the mouse is on it or on the scene's people
  (`.open`, set in explore.js). The cursor tip is only for buildings, so a name never shows twice.

## Island detail (2026-11-19)

- `src/island-detail.js` adds stumps, long-grass tufts (thickest on the banks), the carpenters' work yard at
  (-23, -121), firewood behind every other cottage (shrinking through the winter), barrels, benches, a wheelbarrow,
  driftwood, gulls (sitting ones float at high tide; five circle) and snowdrifts. It places things clear of every
  building, garden, footpath and free-roam scene, and adds a worn door step for each house to the footpaths
  (`MAX_SEGS` in world.js is 64 for them). It adds about 27,000 triangles.
- The ground shader adds meadow patches, a wrack line at high water, and paths trodden through snow.
- The storehouse (C) is at `STORE_AT` beside the Swiss quarters, not Champlain's spot on the west bank (10 m of
  slope there); the cider scene is at its door and the kitchen path runs past it.
- The gardens were moved off the banks (`M_AT`, `L_AT`, `X_AT` in scene.js): none may sit on more than ~1.3 m of slope.
- In free roam the shallop lies on the beach at the landing and in summer the trade canoe loops the east channel
  (`canoeLoop`); `setRoam(false)` puts both back.

## Tides (2026-11-19)

- The animated tide (world.js `tick`) runs between -0.75 HW and +0.75 HW, about -2.2 m to +2.2 m; HW (+2.9 m) is
  the data's high-water line. **Nothing that stands may be in the tidal zone.** `ground()` in scene.js lifts anything
  below high water up to it, which leaves it hanging in the air at low tide: never place props or buildings on a beach
  with it. People (and free-roam props, `explore.ground`) stand on the real ground via `stand()` and must be above
  +2.2 m. Boats either ride the tide (ship, shallop) or are drawn up with `beach()`, which tips them to the slope and
  floats them level when the water reaches them.
- Moved out of the tide that day: the kitchen (I, now `KITCHEN_AT` by the bake oven), the board pile and the
  "Frames from France" scene (top of the bank above the landing), the board carriers' path (starts at the water's
  edge, `shoreEdge`), the spring canoes and the summer camp canoes. The shallop's oars only show when the rowers do.
- Audit in the console: walk `acadie.story.explore.root`'s children and `crowd.list`, and compare each position with
  `heightAt` from world.js (import the `?t=` URL from `performance.getEntriesByType('resource')` after a hot reload,
  or you get a second, unloaded copy of the module).

## Free-roam keys and the Menu button (2026-11-19)

- W A S D / arrow keys move the camera and its target together, Q and E turn, Shift is faster; `keepOnBoard()` in
  main.js keeps the target within ±600 m and the camera above the ground. Keys only work in free roam, not while
  typing, gliding or with the source viewer open. Right-drag slides along the ground.
- The question mode has a Menu button first in `#topbar` (`backToTitle()` in main.js stops any glide or travel, then
  `showTitle()`, which Back to title in free roam also uses).

## Sources students can open (2026-11-19)

- `src/sources.js` holds the passages: Champlain's 1613 pages (scan, French, 1878 English, today's words, gold `marks`
  where the passage sits on the page) and NPS / Parks Canada excerpts. `src/source-viewer.js` shows them; its styles
  are in `src/sources.css`.
- A task's `sources` list puts a Source button beside Next once it is answered (it shares the row, so the panel does
  not grow). A free-roam card's or scene's `cite` list gives the chips under it. The top bar and the roam bar have a
  Sources button for the whole list. `npm run check` checks every id and image.
- New passage: add the page scan to `public/sources/` (McGill's copy, `archive.org/download/<id>/page/n<leaf>.jpg`),
  French from Laverdière (Gutenberg #17258), English from Otis (Gutenberg #6749), and write the plain version from the
  passage alone. See docs/SOURCES.md.

## Open items

- Champlain's own words bring back the March 1605 visit (page 57) and give 12 dead, not five, at Port Royal (page 101).
  Both are the teacher's call; see docs/SOURCES.md.
- The French models are procedural stand-ins (`src/french.js`); a Codex model brief like the Open Path's would be
  the next art step (ship, habitation buildings from Champlain's plan).
- Git: public repo MrHattMadeThat/acadie; LIVE at https://mrhattmadethat.github.io/acadie/. Pushing to `main`
  deploys through GitHub Pages (`.github/workflows/deploy.yml` runs `npm run check` first). Commits use the GitHub no-reply identity set in
  the repo's local config, like `../st-george-3d`. Stage files by name, never `git add -A`. `data/raw/` (elevation tiles
  and OSM) is ignored, so `public/data/` is committed and `npm run build:data` only works on this machine. Ask before
  publishing anything.
