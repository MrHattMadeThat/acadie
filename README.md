# Acadie

A 3D walk through early Acadie for Grade 8 Social Studies in New Brunswick. It grows one chapter at a time, one
chapter per class reading.

**Chapter 1, The Island:** the winter of 1604–05 on St. Croix Island, less than an hour from St. George. Eight
stops and 30 questions, from the cod and beaver trade to the move to Port Royal and the idea of Acadie. The heart of
it is **Two calendars**: a slider through the months that turns the whole river through the year (snow, ice riding
the tide, the leaves) while a card compares the French on the island with Peskotomuhkati families.

Live at https://mrhattmadethat.github.io/acadie/ (every push to `main` deploys it).

## Running it

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5651. Useful address options:

- `?stop=winter` jumps straight to a stop (ids are in `src/content.js`)
- `?free` lets you jump to any stop from the marks along the top
- `?q=low` turns off shadows, halves the forest and the ice, and skips high-DPI rendering

`npm run check` checks the questions. `npm run build` makes `dist/`, a static folder that works from any file
server or GitHub Pages. `npm run build:data` rebuilds the ground from `data/raw/`.

## Where things are

| File | What it holds |
|---|---|
| `src/content.js` | Chapters, stops, questions, and the two-calendar text for each month |
| `src/world.js` | Ground, water and tide, the forest, river ice, falling snow, and the seasons (`setMonth`) |
| `src/scene.js` | The story on the river: the habitation, the ship, the trade, the camp, the March canoes; camera views |
| `src/french.js` | Procedural French models: ship, shallop, houses, palisade, gardens, cannon, trade goods |
| `src/calendar.js` | The two-calendar card |
| `src/tasks.js` | Question types: choice, multi, match, answer3, when (month slider), mapfind (tap the map) |
| `src/main.js` | The app: stops, travel, the opening flight, progress |
| `scripts/build-terrain.mjs` | Builds `public/data/` from the elevation tiles and OpenStreetMap |
| `scripts/probe.mjs` | Ground height at points, or a text map, for placing things |
| `docs/SOURCES.md` | Where every fact beyond the reading comes from |

Three.js is MIT licensed. Map data © OpenStreetMap contributors (ODbL).
